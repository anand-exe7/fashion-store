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
  date: string;
  status: OrderStatus;
}

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
  weightGrams?: number;
  stock: number;
  lowStock: number;
  image?: string;
  images?: string[];
  variants?: ProductVariant[];
  isNew?: boolean;
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

async function refreshAll() {
  if (isFetching) return;
  isFetching = true;
  try {
    const [dbOrders, dbProducts, dbCoupons, dbCategories, dbDepartments] = await Promise.all([
      db.fetchOrders(),
      db.fetchProducts(),
      db.fetchCoupons(),
      db.fetchCategories(),
      db.fetchDepartments(),
    ]);
    
    const mappedOrders: Order[] = dbOrders.map(o => ({
      id: o.id,
      customer: o.customerName || 'Walk-in Customer',
      phone: o.customerPhone || '',
      source: o.source as Source,
      items: o.items.map(i => ({
        name: i.name,
        price: i.price,
        qty: i.quantity,
        productId: i.productId,
        size: i.size,
        color: i.color,
      })),
      subtotal: o.subtotal,
      couponCode: o.couponCode || null,
      discount: o.discount,
      delivery: o.delivery,
      total: o.total,
      amountReceived: o.amountReceived || null,
      date: o.createdAt,
      status: o.status as OrderStatus
    }));

    const mappedProducts: Product[] = dbProducts.map(p => {
      const defaultVariant = p.variants[0];
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        department: p.department,
        ageMinMonths: p.ageMinMonths,
        ageMaxMonths: p.ageMaxMonths,
        description: p.description || '',
        price: p.price,
        weightGrams: p.weightGrams || 500,
        stock: defaultVariant?.stock || 0,
        lowStock: 6,
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
        discountLabel: p.discountLabel
      };
    });

    const mappedCoupons: Coupon[] = dbCoupons.map(c => ({
      code: c.code,
      discountPct: c.discountPct,
      minOrder: c.minOrder,
      expiry: c.expiry || '2026-12-31',
      usageLimit: c.usageLimit,
      used: c.used
    }));

    globalState = { 
      orders: mappedOrders, 
      products: mappedProducts, 
      coupons: mappedCoupons,
      categories: dbCategories,
      departments: dbDepartments
    };
    notify();
  } catch (err) {
    console.error("Failed to load store data:", err);
  } finally {
    isFetching = false;
  }
}

// Initial fetch
if (typeof window !== 'undefined') {
  refreshAll();
}

export function useAdminData(): StoreState {
  const [state, setState] = useState(globalState);
  useEffect(() => {
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
    createdAt: new Date().toISOString(),
    items: order.items.map(i => ({
      name: i.name,
      price: i.price,
      quantity: i.qty,
      productId: i.productId,
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

  refreshAll();
}

export async function deleteOrder(id: string) {
  globalState = { ...globalState, orders: globalState.orders.filter(o => o.id !== id) };
  notify();
  await db.deleteOrder(id);
  refreshAll();
}

export async function addProduct(p: Product) {
  globalState = { ...globalState, products: [p, ...globalState.products] };
  notify();
  await db.upsertProduct({
    id: p.id,
    name: p.name,
    category: p.category,
    department: p.department,
    price: p.price,
    weightGrams: p.weightGrams,
    image: p.image,
    isNew: p.isNew,
    discountLabel: p.discountLabel || undefined,
    isAvailable: true
  }, p.images, p.variants);
  // Note: we can't easily insert default variant here using db.upsertProduct without changing db.ts, 
  // but refreshing will pull any changes. For full fidelity we would insert a variant here.
  refreshAll();
}

export async function updateProduct(id: string, patch: Partial<Product>) {
  const existing = globalState.products.find(p => p.id === id);
  if (!existing) return;
  
  const updated = { ...existing, ...patch };

  // If doing a quick stock patch (e.g. from the alert modal or adjustStock),
  // sync the stock to the first variant so upsertProduct saves it to the database correctly.
  if (patch.stock !== undefined && updated.variants && updated.variants.length > 0) {
    updated.variants[0] = { ...updated.variants[0], stock: patch.stock };
  }
  
  globalState = { ...globalState, products: globalState.products.map(p => p.id === id ? updated : p) };
  notify();
  
  await db.upsertProduct({
    id,
    name: updated.name,
    category: updated.category,
    department: updated.department,
    price: updated.price,
    weightGrams: updated.weightGrams,
    description: updated.description,
    image: updated.image,
    isNew: updated.isNew,
    discountLabel: updated.discountLabel || undefined
  }, updated.images, updated.variants);
  
  refreshAll();
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
  refreshAll();
}

export async function adjustStock(id: string, delta: number) {
  const p = globalState.products.find(x => x.id === id);
  if (!p) return;
  const newStock = Math.max(0, p.stock + delta);
  await updateProduct(id, { stock: newStock });
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
  refreshAll();
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
  refreshAll();
}

export async function deleteCoupon(code: string) {
  globalState = { ...globalState, coupons: globalState.coupons.filter(c => c.code !== code) };
  notify();
  await db.deleteCoupon(code);
  refreshAll();
}

export async function updateCategory(name: string, isActive: boolean) {
  globalState = { ...globalState, categories: globalState.categories.map(c => c.name === name ? { ...c, isActive } : c) };
  notify();
  await db.updateCategory(name, isActive);
  refreshAll();
}

export async function updateDepartment(name: string, isActive: boolean) {
  globalState = { ...globalState, departments: globalState.departments.map(d => d.name === name ? { ...d, isActive } : d) };
  notify();
  await db.updateDepartment(name, isActive);
  refreshAll();
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
      refreshAll();
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
  refreshAll();
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
