import crypto from 'crypto';
import { adminSupabase } from '@/lib/supabase/admin';

// ============================================================
// SERVER-SIDE CHECKOUT PRICING
// The single source of truth for how much an order costs.
// The browser sends WHAT is being bought (product + variant +
// quantity); prices, discounts and delivery are recomputed here
// from the database. Client-supplied amounts are never trusted.
// This module must only ever be imported by server code — it uses
// the service-role Supabase client which bypasses RLS.
// ============================================================

export interface ClientCartItem {
  productId: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
}

export interface CheckoutInput {
  items: ClientCartItem[];
  couponCode?: string;
  regionId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
}

export interface PricedLineItem {
  productId: string;
  name: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
}

export interface PricedOrder {
  invoiceId: string;
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  couponCode: string | null;
  lineItems: PricedLineItem[];
}

const MAX_QTY_PER_LINE = 20;
const MAX_LINES = 50;

function genInvoiceId(): string {
  const year = new Date().getFullYear();
  // Unambiguous alphabet, cryptographically-random suffix so invoice
  // IDs cannot be guessed or enumerated.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars[crypto.randomInt(0, chars.length)];
  }
  return `INV-${year}-${suffix}`;
}

function computeDeliveryFee(totalWeightGrams: number, tiers: any[]): number {
  if (!tiers || tiers.length === 0) return 0;
  const sorted = [...tiers].sort((a, b) => a.min_weight_grams - b.min_weight_grams);
  for (const t of sorted) {
    const minMatch = totalWeightGrams >= t.min_weight_grams;
    const maxMatch =
      t.max_weight_grams === null ||
      t.max_weight_grams === undefined ||
      totalWeightGrams < t.max_weight_grams;
    if (minMatch && maxMatch) return Number(t.charge) || 0;
  }
  return Number(sorted[sorted.length - 1].charge) || 0;
}

/**
 * Recompute the authoritative price of a checkout from the database.
 * Throws on invalid input (empty cart, unknown/unavailable product).
 */
export async function priceCheckout(input: CheckoutInput): Promise<PricedOrder> {
  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length === 0) throw new Error('Cart is empty');
  if (items.length > MAX_LINES) throw new Error('Too many items in cart');

  // Normalize and validate quantities before touching the DB.
  const normalized = items.map((it) => {
    const qty = Math.floor(Number(it.quantity));
    if (!it || !it.productId || !Number.isFinite(qty) || qty < 1) {
      throw new Error('Invalid cart item');
    }
    return {
      productId: String(it.productId),
      size: it.size ? String(it.size) : null,
      color: it.color ? String(it.color) : null,
      quantity: Math.min(qty, MAX_QTY_PER_LINE),
    };
  });

  const productIds = Array.from(new Set(normalized.map((n) => n.productId)));

  const [{ data: products, error: pErr }, { data: variants, error: vErr }] =
    await Promise.all([
      adminSupabase
        .from('products')
        .select('id, name, price, weight_grams, is_available')
        .in('id', productIds),
      adminSupabase
        .from('product_variants')
        .select('product_id, size, color_name, weight_grams')
        .in('product_id', productIds),
    ]);
  if (pErr) throw pErr;
  if (vErr) throw vErr;

  const productMap = new Map((products || []).map((p: any) => [p.id, p]));

  let subtotal = 0;
  let totalWeightGrams = 0;

  const lineItems: PricedLineItem[] = normalized.map((n) => {
    const product = productMap.get(n.productId);
    if (!product) throw new Error('One or more products are no longer available');
    if (product.is_available === false) {
      throw new Error(`"${product.name}" is no longer available`);
    }

    // Authoritative unit price is the product price shown on the storefront.
    const unitPrice = Number(product.price) || 0;

    // Weight is used only for delivery: match the exact variant, then fall
    // back to product weight, then a sane default (mirrors the storefront).
    const variant = (variants || []).find(
      (v: any) =>
        v.product_id === n.productId &&
        (v.size ?? 'Default') === (n.size ?? 'Default') &&
        (v.color_name ?? 'Default') === (n.color ?? 'Default'),
    );
    const unitWeight = Number(variant?.weight_grams ?? product.weight_grams ?? 500) || 0;

    subtotal += unitPrice * n.quantity;
    totalWeightGrams += unitWeight * n.quantity;

    return {
      productId: n.productId,
      name: product.name,
      size: n.size,
      color: n.color,
      price: unitPrice,
      quantity: n.quantity,
    };
  });

  // --- Coupon: validated server-side; invalid coupons are ignored. ---
  let discount = 0;
  let appliedCoupon: string | null = null;
  const rawCode = (input.couponCode || '').trim().toUpperCase();
  if (rawCode) {
    const { data: c } = await adminSupabase
      .from('coupons')
      .select('*')
      .eq('code', rawCode)
      .single();
    const notExpired =
      !c?.expiry || new Date(c.expiry) >= new Date(new Date().toDateString());
    if (
      c &&
      c.is_active &&
      notExpired &&
      c.used < c.usage_limit &&
      subtotal >= c.min_order
    ) {
      discount = Math.round((subtotal * c.discount_pct) / 100);
      appliedCoupon = c.code;
    }
  }

  // --- Delivery fee: computed from region + total weight. ---
  let delivery = 0;
  if (input.regionId) {
    const { data: region } = await adminSupabase
      .from('delivery_regions')
      .select('id, is_active')
      .eq('id', input.regionId)
      .single();
    if (region && region.is_active) {
      const { data: tiers } = await adminSupabase
        .from('delivery_tiers')
        .select('*')
        .eq('region_id', input.regionId)
        .order('min_weight_grams');
      delivery = computeDeliveryFee(totalWeightGrams, tiers || []);
    }
  }

  const total = Math.max(0, subtotal - discount + delivery);

  return {
    invoiceId: genInvoiceId(),
    subtotal,
    discount,
    delivery,
    total,
    couponCode: appliedCoupon,
    lineItems,
  };
}

/**
 * Decrement variant stock for a paid online order. Mirrors what the POS
 * path does in `store.addOrder`, but resolves the variant from the stored
 * product_id + size + color since online order_items don't carry variant_id.
 *
 * MUST be called exactly once per order — the webhook invokes this only from
 * inside the atomic "this call flipped the row to completed" guard, so a
 * retried webhook never double-decrements. Uses the service-role client.
 *
 * Non-atomic read-modify-write, consistent with the POS path: exactly-once
 * delivery is guaranteed by the caller's status guard, so there is no
 * concurrent decrement of the same variant to race against.
 */
export async function decrementStockForOrder(orderId: string): Promise<void> {
  const { data: items, error: iErr } = await adminSupabase
    .from('order_items')
    .select('product_id, size, color, quantity')
    .eq('order_id', orderId);
  if (iErr) throw iErr;
  if (!items || items.length === 0) return;

  const productIds = Array.from(
    new Set(items.map((i: any) => i.product_id).filter(Boolean)),
  );
  if (productIds.length === 0) return;

  const { data: variants, error: vErr } = await adminSupabase
    .from('product_variants')
    .select('id, product_id, size, color_name, stock')
    .in('product_id', productIds);
  if (vErr) throw vErr;

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    if (!item.product_id || qty <= 0) continue;

    // Match the exact variant the same way priceCheckout does.
    const variant = (variants || []).find(
      (v: any) =>
        v.product_id === item.product_id &&
        (v.size ?? 'Default') === (item.size ?? 'Default') &&
        (v.color_name ?? 'Default') === (item.color ?? 'Default'),
    );
    if (!variant) {
      console.error(
        `decrementStockForOrder: no variant for order ${orderId}, product ${item.product_id} (size=${item.size}, color=${item.color})`,
      );
      continue;
    }

    const next = Math.max(0, (Number(variant.stock) || 0) - qty);
    const { error: uErr } = await adminSupabase
      .from('product_variants')
      .update({ stock: next })
      .eq('id', variant.id);
    if (uErr) {
      // Log and keep going — a stock-update failure must not throw away the
      // rest of the order's decrements or the webhook's success response.
      console.error(
        `decrementStockForOrder: failed to update variant ${variant.id} for order ${orderId}:`,
        uErr,
      );
    }
  }
}

/**
 * Persist a freshly-priced order as `pending`. Uses the service-role
 * client so it works regardless of who the customer is.
 */
export async function persistPendingOrder(
  priced: PricedOrder,
  input: CheckoutInput,
): Promise<void> {
  const { error: oErr } = await adminSupabase.from('orders').insert({
    id: priced.invoiceId,
    customer_name: (input.customerName || '').trim() || 'Online Customer',
    customer_phone: (input.customerPhone || '').trim(),
    customer_email: (input.customerEmail || '').trim(),
    customer_address: (input.customerAddress || '').trim(),
    source: 'online',
    subtotal: priced.subtotal,
    discount: priced.discount,
    coupon_code: priced.couponCode,
    delivery: priced.delivery,
    total: priced.total,
    amount_received: 0,
    status: 'pending',
  });
  if (oErr) throw oErr;

  if (priced.lineItems.length > 0) {
    const { error: iErr } = await adminSupabase.from('order_items').insert(
      priced.lineItems.map((li) => ({
        order_id: priced.invoiceId,
        product_id: li.productId,
        name: li.name,
        size: li.size,
        color: li.color,
        quantity: li.quantity,
        price: li.price,
      })),
    );
    if (iErr) throw iErr;
  }
}
