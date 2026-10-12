import crypto from 'crypto';
import { adminSupabase } from '@/lib/supabase/admin';
import { variantPrice } from '@/lib/price';

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
  /** The exact variant row this line sells, so payment can decrement it. */
  variantId: string | null;
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
        .select('id, product_id, size, color_name, price, weight_grams, stock, is_available')
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

    // Match the exact variant. Its id is what payment decrements, its price is
    // what we charge, and its weight feeds delivery — each falling back to the
    // product's own value (mirrors the storefront).
    const variant = (variants || []).find(
      (v: any) =>
        v.product_id === n.productId &&
        (v.size ?? 'Default') === (n.size ?? 'Default') &&
        (v.color_name ?? 'Default') === (n.color ?? 'Default'),
    );

    // Authoritative unit price. A size priced differently from the product's
    // base wins — this used to always take the base, so a pant priced ₹999 per
    // size was charged at its ₹799 base.
    const unitPrice = variantPrice(product.price, variant ? { price: variant.price } : null);
    const unitWeight = Number(variant?.weight_grams ?? product.weight_grams ?? 500) || 0;

    // Stock gate. The browser caps the quantity picker, but the cart lives in
    // localStorage where anyone can edit it, so the real check belongs here —
    // without it an order for 20 of a 1-piece size was priced and taken.
    if (variant) {
      if (variant.is_available === false) {
        throw new Error(`"${product.name}" (${n.size ?? 'Default'}) is no longer available`);
      }
      const available = Number(variant.stock) || 0;
      if (available <= 0) {
        throw new Error(`"${product.name}" (${n.size ?? 'Default'}) is out of stock`);
      }
      if (n.quantity > available) {
        throw new Error(
          `Only ${available} left of "${product.name}" (${n.size ?? 'Default'}). Please reduce the quantity.`,
        );
      }
    }

    subtotal += unitPrice * n.quantity;
    totalWeightGrams += unitWeight * n.quantity;

    return {
      productId: n.productId,
      name: product.name,
      size: n.size,
      color: n.color,
      price: unitPrice,
      quantity: n.quantity,
      variantId: variant?.id ?? null,
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
    const baseRows = priced.lineItems.map((li) => ({
      order_id: priced.invoiceId,
      product_id: li.productId,
      name: li.name,
      size: li.size,
      color: li.color,
      quantity: li.quantity,
      price: li.price,
    }));

    const { error: iErr } = await adminSupabase
      .from('order_items')
      .insert(baseRows.map((row, i) => ({ ...row, variant_id: priced.lineItems[i].variantId })));

    // 42703 = order_items.variant_id doesn't exist yet (migration 0005 not
    // applied). Save the order without the link rather than failing a paid
    // checkout; applyOrderStock falls back to matching on size/colour.
    if (iErr?.code === '42703') {
      console.error('[stock] order_items.variant_id is missing — run supabase/migrations/0005_order_stock.sql');
      const { error: retryErr } = await adminSupabase.from('order_items').insert(baseRows);
      if (retryErr) throw retryErr;
    } else if (iErr) {
      throw iErr;
    }
  }
}

// ============================================================
// STOCK ON PAYMENT
// ============================================================

/**
 * Decrement stock for every line of a paid order, exactly once.
 *
 * Online orders used to never touch inventory at all — only the POS path
 * decremented, so a website sale left stock untouched and oversold.
 *
 * Idempotency is a dedicated `orders.stock_applied` flag rather than the
 * order status: Razorpay retries deliveries, and the status alone cannot
 * distinguish a retry from a first delivery that died mid-decrement.
 *
 * Never throws — the caller is a webhook, and a non-2xx there buys nothing
 * (the retry would hit the same failure). Problems are logged with the order
 * id so they can be reconciled by hand.
 */
export async function applyOrderStock(orderId: string): Promise<void> {
  try {
    // Claim the work. Only the caller that flips false -> true gets a row
    // back, so concurrent deliveries can't both decrement.
    const { data: claimed, error: claimErr } = await adminSupabase
      .from('orders')
      .update({ stock_applied: true })
      .eq('id', orderId)
      .eq('stock_applied', false)
      .select('id')
      .maybeSingle();

    if (claimErr) {
      if (claimErr.code === '42703') {
        // Without the guard column a retry would double-consume. Under-
        // decrementing loudly beats over-decrementing silently.
        console.error(
          `[stock] orders.stock_applied is missing — run supabase/migrations/0005_order_stock.sql. Stock NOT adjusted for order ${orderId}.`,
        );
        return;
      }
      throw claimErr;
    }
    if (!claimed) return; // already applied by an earlier delivery

    const { data: items, error: itemsErr } = await adminSupabase
      .from('order_items')
      .select('variant_id, product_id, name, size, color, quantity')
      .eq('order_id', orderId);
    if (itemsErr) throw itemsErr;

    for (const item of items || []) {
      const qty = Math.floor(Number(item.quantity) || 0);
      if (qty <= 0) continue;

      // Orders placed before 0005 (and any line whose variant was since
      // retired) carry no id — fall back to the same size/colour match
      // priceCheckout uses.
      const variantId = item.variant_id || (await resolveVariantId(item.product_id, item.size, item.color));
      if (!variantId) {
        console.error(`[stock] order ${orderId}: no variant matches "${item.name}" (${item.size ?? '-'}/${item.color ?? '-'}) — stock not adjusted`);
        continue;
      }

      try {
        await decrementVariant(variantId, qty);
      } catch (err) {
        console.error(`[stock] order ${orderId}: failed to decrement ${qty} x "${item.name}" (variant ${variantId}):`, err);
      }
    }
  } catch (err) {
    console.error(`[stock] could not apply stock for order ${orderId}:`, err);
  }
}

async function resolveVariantId(
  productId: string | null,
  size: string | null,
  color: string | null,
): Promise<string | null> {
  if (!productId) return null;
  const { data } = await adminSupabase
    .from('product_variants')
    .select('id, size, color_name')
    .eq('product_id', productId);
  const rows = (data || []) as { id: string; size: string | null; color_name: string | null }[];
  const match = rows.find(
    (v) => (v.size ?? 'Default') === (size ?? 'Default') && (v.color_name ?? 'Default') === (color ?? 'Default'),
  );
  return match?.id ?? null;
}

// Prefers the atomic RPC from migration 0004; falls back to read-then-write
// when that function isn't there yet.
async function decrementVariant(variantId: string, qty: number): Promise<void> {
  const { error } = await adminSupabase.rpc('adjust_variant_stock', {
    p_variant_id: variantId,
    p_delta: -qty,
  });
  if (!error) return;
  if (error.code !== 'PGRST202' && error.code !== '42883') throw error;

  console.warn('[stock] adjust_variant_stock RPC unavailable — using a non-atomic update. Run supabase/migrations/0004_pricing_and_stock.sql.');
  const { data, error: readErr } = await adminSupabase
    .from('product_variants')
    .select('stock')
    .eq('id', variantId)
    .single();
  if (readErr || !data) throw readErr || new Error('Variant not found');
  const { error: writeErr } = await adminSupabase
    .from('product_variants')
    .update({ stock: Math.max(0, (data.stock || 0) - qty) })
    .eq('id', variantId);
  if (writeErr) throw writeErr;
}
