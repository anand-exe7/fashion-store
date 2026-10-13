'use client';
import { useState, useEffect } from 'react';
import * as db from './db';

/* ------------------------------------------------------------------ *
 * Shalistone admin — Adapter for Supabase backend.
 * Replaces the old local storage mock with real Supabase calls,
 * while keeping the same hook signature for the admin panel.
 * ------------------------------------------------------------------ */

export type Source = 'offline' | 'online';
export type OrderStatus = 'completed' | 'pending';
// How an offline (POS) bill was paid. Online orders are Razorpay and leave this null.
export type PaymentMethod = 'cash' | 'gpay' | 'split';

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  productId?: string;
  variantId?: string;
  size?: string;
  color?: string;
}

export interface Order {
  id: string;
  customer: string;
  phone: string;
  source: Source;
  items: OrderItem[];
  subtotal: number;
  couponCode: string | null;
  discount: number;
  delivery: number;
  total: number;
  amountReceived: number | null;
  // Offline bills: how the customer paid. null for online / legacy bills.
  // NOT yet persisted in Supabase — see the hand-off note by addOrder below.
  paymentMethod?: PaymentMethod | null;
  // Customer date of birth (ISO yyyy-mm-dd) captured at billing/checkout, used
  // for the Birthdays offers list.
  dob?: string | null;
  // Online-order packing workflow. null for POS bills.
  fulfillmentStatus?: FulfillmentStatus | null;
  date: string;
  status: OrderStatus;
}

// Online-order packing lifecycle (retail POS bills leave this null).
export type FulfillmentStatus = 'pending' | 'packed' | 'shipped';

export interface ProductVariant {
  id?: string;
  size?: string;
  colorName?: string;
  price?: number;
  weightGrams?: number;
  stock: number;
  ageMinMonths?: number | null;
  ageMaxMonths?: number | null;
  isAvailable?: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  department?: string;
  ageMinMonths?: number | null;
  ageMaxMonths?: number | null;
  description?: string;
  details?: string;
  benefits?: string[];
  price: number;
  // Struck-through MRP shown beside the selling price. null = no MRP set.
  originalPrice?: number | null;
  weightGrams?: number;
  // Derived, never authored: the SUM of every variant's stock. To change it,
  // change a variant (updateProduct with `variants`, or adjustVariantStock).
  stock: number;
  // "Alert below N", compared against the product total above.
  lowStock: number;
  image?: string;
  images?: string[];
  variants?: ProductVariant[];
  isNew?: boolean;
  // Ticked in the product form; drives the home page's Best Sellers row.
  isBestSeller?: boolean;
  discountLabel?: string | null;
}

export interface Coupon {
  code: string;
  discountPct: number;
  minOrder: number;
  expiry: string;
  usageLimit: number;
  used: number;
}

export interface StoreState {
  orders: Order[];
  products: Product[];
  coupons: Coupon[];
  categories: db.Category[];
  departments: db.Department[];
}

let globalState: StoreState = { orders: [], products: [], coupons: [], categories: [], departments: [] };
let listeners = new Set<() => void>();
let isFetching = false;
export let currentToast: string | null = null;
let toastTimeout: any = null;

export function showToast(message: string) {
  currentToast = message;
  notify();
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    currentToast = null;
    notify();
  }, 3000);
}

function notify() {
  for (const l of listeners) l();
}

// Which slices of the store a refresh re-downloads. Every write used to reload
// ALL of them (every order with its items, the whole catalogue, coupons,
// taxonomy) — so a single stock tweak re-pulled the entire orders table. Callers
// now name just what they changed; the initial load still fetches everything.
type Scope = 'orders' | 'products' | 'coupons' | 'taxonomy';
const ALL_SCOPES: Scope[] = ['orders', 'products', 'coupons', 'taxonomy'];

// Scopes requested while a fetch was already running. They're re-fetched when it
// ends rather than dropped, since that fetch may have read data from before the
// write that asked for the refresh.
const pendingScopes = new Set<Scope>();
// Callers that asked for a refresh mid-fetch; resolved once the follow-up fetch lands.
let pendingWaiters: Array<() => void> = [];

async function refreshAll(scopes: Scope[] = ALL_SCOPES): Promise<void> {
  if (isFetching) {
    scopes.forEach(s => pendingScopes.add(s));
    return new Promise<void>(resolve => { pendingWaiters.push(resolve); });
  }
  isFetching = true;
  const want = new Set(scopes);
  try {
    const [dbOrders, dbProducts, dbCoupons, dbCategories, dbDepartments] = await Promise.all([
      want.has('orders') ? db.fetchOrders() : null,
      want.has('products') ? db.fetchProducts() : null,
      want.has('coupons') ? db.fetchCoupons() : null,
      want.has('taxonomy') ? db.fetchCategories() : null,
      want.has('taxonomy') ? db.fetchDepartments() : null,
    ]);

    const mappedOrders: Order[] | null = dbOrders && dbOrders.map(o => ({
      id: o.id,
      customer: o.customerName || 'Walk-in Customer',
      phone: o.customerPhone || '',
      source: o.source as Source,
      items: o.items.map(i => ({
        name: i.name,
        price: i.price,
        qty: i.quantity,
        productId: i.productId,
        variantId: i.variantId ?? undefined,
        size: i.size,
        color: i.color,
      })),
      subtotal: o.subtotal,
      couponCode: o.couponCode || null,
      discount: o.discount,
      delivery: o.delivery,
      total: o.total,
      amountReceived: o.amountReceived || null,
      paymentMethod: (o.paymentMethod as PaymentMethod) ?? null,
      dob: o.dob ?? null,
      fulfillmentStatus: (o.fulfillmentStatus as FulfillmentStatus) ?? null,
      date: o.createdAt,
      status: o.status as OrderStatus
    }));

    const mappedProducts: Product[] | null = dbProducts && dbProducts.map(p => {
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        department: p.department,
        ageMinMonths: p.ageMinMonths,
        ageMaxMonths: p.ageMaxMonths,
        description: p.description || '',
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        weightGrams: p.weightGrams || 500,
        // fetchProducts already sums the variants; this used to overwrite that
        // with variants[0].stock, so 5 colours x 5 sizes x 1 piece read as 1.
        stock: p.stock,
        lowStock: p.lowStock ?? db.DEFAULT_LOW_STOCK,
        image: p.images[0]?.url || p.image || '',
        images: p.images?.map(img => img.url) || [],
        variants: p.variants?.map(v => ({
          id: v.id,
          size: v.size || '',
          colorName: v.colorName || '',
          price: v.price,
          weightGrams: v.weightGrams,
          stock: v.stock || 0,
          ageMinMonths: v.ageMinMonths,
          ageMaxMonths: v.ageMaxMonths,
          isAvailable: v.isAvailable
        })) || [],
        isNew: p.isNew,
        isBestSeller: p.isBestSeller ?? false,
        discountLabel: p.discountLabel
      };
    });

    const mappedCoupons: Coupon[] | null = dbCoupons && dbCoupons.map(c => ({
      code: c.code,
      discountPct: c.discountPct,
      minOrder: c.minOrder,
      expiry: c.expiry || '2026-12-31',
      usageLimit: c.usageLimit,
      used: c.used
    }));

    // Only the slices that were fetched are replaced; the rest keep their state.
    globalState = {
      orders: mappedOrders ?? globalState.orders,
      products: mappedProducts ?? globalState.products,
      coupons: mappedCoupons ?? globalState.coupons,
      categories: dbCategories ?? globalState.categories,
      departments: dbDepartments ?? globalState.departments
    };
    notify();
  } catch (err) {
    console.error("Failed to load store data:", err);
  } finally {
    isFetching = false;
    if (pendingScopes.size > 0) {
      const next = [...pendingScopes];
      pendingScopes.clear();
      const waiters = pendingWaiters;
      pendingWaiters = [];
      refreshAll(next).finally(() => waiters.forEach(w => w()));
    }
  }
}

// Fetched lazily on first use by an admin screen. This used to run at module
// load, and because storefront components (CartDrawer) import `inr` from this
// file, EVERY customer page load pulled all orders, products, coupons and
// taxonomy before showing anything — a big cause of slow product pages.
let hasLoaded = false;
function ensureLoaded() {
  if (hasLoaded || typeof window === 'undefined') return;
  hasLoaded = true;
  refreshAll();
}

export function useAdminData(): StoreState {
  const [state, setState] = useState(globalState);
  useEffect(() => {
    ensureLoaded();
    setState(globalState);
    const cb = () => setState(globalState);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);
  return state;
}

export async function addOrder(order: Order) {
  // Optimistic UI update
  globalState = { ...globalState, orders: [order, ...globalState.orders] };
  notify();

  // Payment method + DOB are persisted here (migration 0003 adds the columns).
  // Manually-entered online bills start their packing workflow at 'pending';
  // offline POS bills leave fulfillment null.
  await db.insertOrder({
    id: order.id,
    customerName: order.customer,
    customerPhone: order.phone,
    source: order.source,
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: order.couponCode || undefined,
    delivery: order.delivery,
    total: order.total,
    amountReceived: order.amountReceived || undefined,
    status: order.status,
    paymentMethod: order.paymentMethod ?? null,
    dob: order.dob ?? null,
    fulfillmentStatus: order.fulfillmentStatus ?? (order.source === 'online' ? 'pending' : null),
    createdAt: new Date().toISOString(),
    items: order.items.map(i => ({
      name: i.name,
      price: i.price,
      quantity: i.qty,
      productId: i.productId,
      variantId: i.variantId ?? null,
      size: i.size,
      color: i.color,
    }))
  });

  // Decrement stock for any lines tied to a specific variant. Free-form
  // lines (no variantId) are miscellaneous charges and don't touch inventory.
  for (const item of order.items) {
    if (item.variantId && item.qty > 0) {
      try {
        await db.decrementVariantStock(item.variantId, item.qty);
      } catch (err) {
        console.error(`Failed to decrement stock for variant ${item.variantId}:`, err);
      }
    }
  }

  // A sale changes the order list, variant stock, and (if a coupon was used) its used-count.
  refreshAll(['orders', 'products', 'coupons']);
}

export async function deleteOrder(id: string) {
  globalState = { ...globalState, orders: globalState.orders.filter(o => o.id !== id) };
  notify();
  await db.deleteOrder(id);
  refreshAll(['orders']); // deleting a bill only removes the order row; stock is not restored
}

// Advance an online order through its packing workflow (pending → packed → shipped).
export async function setFulfillment(id: string, fulfillmentStatus: FulfillmentStatus) {
  globalState = {
    ...globalState,
    orders: globalState.orders.map(o => (o.id === id ? { ...o, fulfillmentStatus } : o)),
  };
  notify();
  try {
    await db.updateOrderFulfillment(id, fulfillmentStatus);
  } catch (err) {
    console.error('Failed to update fulfillment status:', err);
    showToast("Couldn't update packing status.");
  }
  refreshAll(['orders']);
}

export interface SaveResult {
  ok: boolean;
  /** Fields the database can't store yet, e.g. "MRP price". */
  skipped: string[];
  error?: string;
}

const describeSkips = (skips: db.UpsertSkip[]) => skips.map(s => s.field);

export async function addProduct(p: Product): Promise<SaveResult> {
  // Shown immediately; removed again below if the write fails, so a refused
  // save can't leave a product on screen that was never stored.
  globalState = { ...globalState, products: [p, ...globalState.products] };
  notify();

  let result: { skipped: db.UpsertSkip[] };
  try {
    result = await db.upsertProduct({
    id: p.id,
    name: p.name,
    category: p.category,
    department: p.department,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice ?? null,
    weightGrams: p.weightGrams,
    stock: p.stock,
    lowStock: p.lowStock,
    image: p.image,
    isNew: p.isNew,
      isBestSeller: p.isBestSeller ?? false,
      discountLabel: p.discountLabel || undefined,
      isAvailable: true
    }, p.images, p.variants || []);
  } catch (err) {
    globalState = { ...globalState, products: globalState.products.filter(x => x.id !== p.id) };
    notify();
    console.error('Failed to add product:', err);
    return { ok: false, skipped: [], error: err instanceof Error ? err.message : 'Could not save the product.' };
  }

  refreshAll(['products', 'taxonomy']); // saving auto-creates a missing category
  return { ok: true, skipped: describeSkips(result.skipped) };
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<SaveResult> {
  const existing = globalState.products.find(p => p.id === id);
  if (!existing) return { ok: false, skipped: [], error: 'Product not found.' };

  const updated: Product = { ...existing, ...patch };

  // `stock` is a DERIVED total, so it is never written straight through.
  //
  // This used to copy patch.stock into variants[0]. The edit form sends the
  // sum of all variants, so every save added the whole total onto the first
  // variant — five variants of 1 piece became 9, then more on the next save —
  // and it overwrote whatever the admin had typed into variant 0. It also
  // mutated the variants array already held in state, before the DB write had
  // even been attempted.
  if (patch.variants !== undefined && patch.variants.length > 0) {
    // Variants are authoritative: copy them (never alias the caller's array)
    // and recompute the total from them.
    updated.variants = patch.variants.map(v => ({ ...v }));
    updated.stock = updated.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  } else if (patch.variants !== undefined) {
    // A product with no sized variants is stored as a single synthesised
    // "Default" row that upsertProduct fills from `stock`, so here the
    // caller's `stock` (the form's "Default Stock" box) IS the authority.
    updated.variants = [];
    updated.stock = patch.stock !== undefined ? patch.stock : existing.stock;
  } else if (patch.stock !== undefined) {
    const current = existing.variants || [];
    if (current.length > 1) {
      // There is no way to tell WHICH size/colour the caller meant. Guessing
      // variants[0] is exactly the bug above, so refuse instead.
      // The caller reports this; don't toast it twice.
      return { ok: false, skipped: [], error: 'Pick a size/colour to restock — this product has several variants.' };
    }
    // Simple product: one "Default" row (or none yet) carries the stock.
    updated.variants = current.length === 1
      ? [{ ...current[0], stock: patch.stock }]
      : current.map(v => ({ ...v }));
  }

  globalState = { ...globalState, products: globalState.products.map(p => p.id === id ? updated : p) };
  notify();

  let result: { skipped: db.UpsertSkip[] };
  try {
    result = await db.upsertProduct({
      id,
    name: updated.name,
    category: updated.category,
    department: updated.department,
    price: updated.price,
    originalPrice: updated.originalPrice ?? null,
    weightGrams: updated.weightGrams,
    lowStock: updated.lowStock,
    stock: updated.stock,
    description: updated.description,
    image: updated.image,
    isNew: updated.isNew,
      isBestSeller: updated.isBestSeller ?? false,
      discountLabel: updated.discountLabel || undefined
    }, updated.images, updated.variants);
  } catch (err) {
    // Put the row back as it was — the edit never reached the database.
    globalState = { ...globalState, products: globalState.products.map(p => p.id === id ? existing : p) };
    notify();
    console.error('Failed to update product:', err);
    return { ok: false, skipped: [], error: err instanceof Error ? err.message : 'Could not save the product.' };
  }

  refreshAll(['products', 'taxonomy']); // saving auto-creates a missing category
  return { ok: true, skipped: describeSkips(result.skipped) };
}

export async function fetchSuggestionIds(productId: string) {
  return db.fetchSuggestionIds(productId);
}

export async function updateSuggestions(productId: string, suggestedIds: string[]) {
  await db.updateSuggestions(productId, suggestedIds);
}

export async function deleteProduct(id: string) {
  globalState = { ...globalState, products: globalState.products.filter(p => p.id !== id) };
  notify();
  await db.deleteProduct(id);
  refreshAll(['products']);
}

// Restock/consume ONE variant. The old adjustStock(productId, delta) only ever
// touched variants[0], so the size or colour that actually ran out never got
// restocked. Stock is changed in a single atomic statement in Postgres.
export async function adjustVariantStock(productId: string, variantId: string, delta: number) {
  const product = globalState.products.find(x => x.id === productId);
  if (!product || !variantId) return;

  const variants = product.variants || [];
  const idx = variants.findIndex(v => v.id === variantId);
  if (idx === -1) return;

  // Optimistic update on copies only — nothing already in state is mutated.
  const optimistic = variants.map(v =>
    v.id === variantId ? { ...v, stock: Math.max(0, (v.stock || 0) + delta) } : { ...v }
  );
  const updated: Product = {
    ...product,
    variants: optimistic,
    stock: optimistic.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
  };
  globalState = { ...globalState, products: globalState.products.map(p => p.id === productId ? updated : p) };
  notify();

  try {
    await db.adjustVariantStock(variantId, delta);
  } catch (err) {
    console.error(`Failed to adjust stock for variant ${variantId}:`, err);
    showToast("Couldn't update stock.");
  }
  refreshAll(['products']);
}

export async function addCoupon(c: Coupon) {
  globalState = { ...globalState, coupons: [c, ...globalState.coupons] };
  notify();
  await db.upsertCoupon({
    code: c.code,
    discountPct: c.discountPct,
    minOrder: c.minOrder,
    expiry: c.expiry,
    usageLimit: c.usageLimit,
    used: c.used,
    isActive: true
  });
  refreshAll(['coupons']);
}

export async function updateCoupon(code: string, patch: Partial<Coupon>) {
  globalState = { ...globalState, coupons: globalState.coupons.map(c => c.code === code ? { ...c, ...patch } : c) };
  notify();
  const existing = globalState.coupons.find(c => c.code === code);
  if (existing) {
    await db.upsertCoupon({
      ...existing,
      isActive: true
    });
  }
  refreshAll(['coupons']);
}

export async function deleteCoupon(code: string) {
  globalState = { ...globalState, coupons: globalState.coupons.filter(c => c.code !== code) };
  notify();
  await db.deleteCoupon(code);
  refreshAll(['coupons']);
}

export async function updateCategory(name: string, isActive: boolean) {
  globalState = { ...globalState, categories: globalState.categories.map(c => c.name === name ? { ...c, isActive } : c) };
  notify();
  await db.updateCategory(name, isActive);
  refreshAll(['taxonomy']);
}

export async function updateDepartment(name: string, isActive: boolean) {
  globalState = { ...globalState, departments: globalState.departments.map(d => d.name === name ? { ...d, isActive } : d) };
  notify();
  await db.updateDepartment(name, isActive);
  refreshAll(['taxonomy']);
}

// Per-department debounce timers. The From/To age inputs are controlled and
// fire onChange on every keystroke; persisting (a Supabase write + a full
// refreshAll of orders/products/coupons/taxonomy) on each one caused input lag
// and network spam. We update local state synchronously so the inputs stay
// snappy, then debounce the write. Keyed by name so editing two departments
// doesn't cancel each other.
const ageRangeSaveTimers: Record<string, ReturnType<typeof setTimeout>> = {};
export function updateDepartmentAgeRange(name: string, ageMinMonths: number | null, ageMaxMonths: number | null) {
  globalState = {
    ...globalState,
    departments: globalState.departments.map(d => d.name === name ? { ...d, ageMinMonths, ageMaxMonths } : d),
  };
  notify();

  if (ageRangeSaveTimers[name]) clearTimeout(ageRangeSaveTimers[name]);
  ageRangeSaveTimers[name] = setTimeout(async () => {
    delete ageRangeSaveTimers[name];
    try {
      await db.updateDepartmentAgeRange(name, ageMinMonths, ageMaxMonths);
      refreshAll(['taxonomy']);
    } catch (err) {
      console.error(`Failed to save age range for ${name}:`, err);
      showToast(`Couldn't save age range for ${name}.`);
    }
  }, 500);
}

export async function deleteCategory(name: string) {
  globalState = { ...globalState, categories: globalState.categories.filter(c => c.name !== name) };
  notify();
  try {
    await db.deleteCategory(name);
  } catch (e) {
    showToast("Cannot delete category currently in use.");
  }
  refreshAll(['taxonomy']);
}

export function resetDemo() {
  refreshAll();
}

export function evaluateCoupon(code: string, subtotal: number, coupons: Coupon[]) {
  const c = coupons.find(x => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c) return { ok: false as const, reason: 'Invalid coupon code' };
  if (new Date(c.expiry) < new Date(new Date().toDateString())) return { ok: false as const, reason: 'Coupon expired' };
  if (c.used >= c.usageLimit) return { ok: false as const, reason: 'Usage limit reached' };
  if (subtotal < c.minOrder) return { ok: false as const, reason: `Minimum order ₹${c.minOrder.toLocaleString('en-IN')}` };
  return { ok: true as const, coupon: c, discount: Math.round((subtotal * c.discountPct) / 100) };
}

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

const RANDS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function rand(len: number) {
  let s = '';
  for (let i = 0; i < len; i++) s += RANDS[Math.floor(Math.random() * RANDS.length)];
  return s;
}
export function genInvoiceId() {
  return `INV-2026-${rand(6)}`;
}
export function genCouponCode() {
  return rand(8);
}
