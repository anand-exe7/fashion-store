import { useSyncExternalStore } from 'react';

/* ------------------------------------------------------------------ *
 * Shalistone admin — shared client-side store (demo only, no backend).
 * Persists to localStorage and is shared by the admin panel AND the
 * storefront checkout, so an online (Razorpay) order or an offline POS
 * bill both land in the same Orders / Analytics views.
 * ------------------------------------------------------------------ */

export type Source = 'offline' | 'online';
export type OrderStatus = 'completed' | 'pending';

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  customer: string;
  phone: string;
  source: Source; // offline = POS billing, online = Razorpay
  items: OrderItem[];
  subtotal: number;
  couponCode: string | null;
  discount: number;
  delivery: number;
  total: number;
  amountReceived: number | null;
  date: string; // ISO
  status: OrderStatus;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lowStock: number; // threshold
  image?: string; // URL or data-URI
}

export interface Coupon {
  code: string;
  discountPct: number;
  minOrder: number;
  expiry: string; // yyyy-mm-dd
  usageLimit: number;
  used: number;
}

export interface StoreState {
  orders: Order[];
  products: Product[];
  coupons: Coupon[];
}

/* ----------------------------- seed data ----------------------------- */

const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?q=80&w=400&auto=format&fit=crop`;
const SEED_PRODUCTS: Product[] = [
  { id: 'P01', name: 'Cotton Hoodie', category: 'Hoodies', price: 2193, stock: 24, lowStock: 6, image: IMG('1556821840-3a63f95609a7') },
  { id: 'P02', name: 'Denim Jacket', category: 'Outerwear', price: 3500, stock: 11, lowStock: 6, image: IMG('1576871337622-98d48d1cf531') },
  { id: 'P03', name: 'Ribbed Knit Top', category: 'Tops', price: 3240, stock: 3, lowStock: 6, image: IMG('1544441893-675973e31985') },
  { id: 'P04', name: 'Wool Overcoat', category: 'Outerwear', price: 8900, stock: 0, lowStock: 6, image: IMG('1591047139829-d91aecb6caea') },
  { id: 'P05', name: 'Silk Blouse', category: 'Tops', price: 4300, stock: 9, lowStock: 6, image: IMG('1520975954732-35dd22299614') },
  { id: 'P06', name: 'Linen Overshirt', category: 'Shirts', price: 2150, stock: 18, lowStock: 6, image: IMG('1602810318383-e386cc2a3ccf') },
  { id: 'P07', name: 'Wide-Leg Trouser', category: 'Bottoms', price: 4240, stock: 14, lowStock: 6, image: IMG('1594633312681-425c7b97ccd1') },
  { id: 'P08', name: 'Cream Crewneck', category: 'Knitwear', price: 2240, stock: 4, lowStock: 6, image: IMG('1620799140408-edc6dcb6d633') },
  { id: 'P09', name: 'Cashmere Scarf', category: 'Accessories', price: 2040, stock: 26, lowStock: 6, image: IMG('1542272604-787c3835535d') },
  { id: 'P10', name: 'Leather Belt', category: 'Accessories', price: 2000, stock: 7, lowStock: 6, image: IMG('1553062407-98eeb64c6a62') },
];

const SEED_ORDERS: Order[] = [
  {
    id: 'INV-2026-CBPOI2U', customer: 'Ganesh', phone: '8754443806', source: 'offline',
    items: [{ name: 'Wool Overcoat', price: 8900, qty: 2 }, { name: 'Denim Jacket', price: 3500, qty: 1 }],
    subtotal: 21300, couponCode: 'WELCOME15', discount: 3195, delivery: 0, total: 18105,
    amountReceived: 20000, date: '2026-08-09T11:20:00', status: 'completed',
  },
  {
    id: 'INV-2026-KINEY1A', customer: 'Ravi Kumar', phone: '8220566254', source: 'offline',
    items: [{ name: 'Cotton Hoodie', price: 2193, qty: 3 }, { name: 'Leather Belt', price: 2000, qty: 1 }],
    subtotal: 8579, couponCode: null, discount: 0, delivery: 200, total: 8779,
    amountReceived: 9000, date: '2026-08-07T15:05:00', status: 'completed',
  },
  {
    id: 'INV-2026-ARIA015', customer: 'Aria Menon', phone: '9840123456', source: 'online',
    items: [{ name: 'Silk Blouse', price: 4300, qty: 1 }, { name: 'Cashmere Scarf', price: 2040, qty: 1 }],
    subtotal: 6340, couponCode: 'SHALISTONE10', discount: 634, delivery: 0, total: 5706,
    amountReceived: 5706, date: '2026-08-15T09:42:00', status: 'completed',
  },
  {
    id: 'INV-2026-KARAN12', customer: 'Karan Shah', phone: '9123456780', source: 'online',
    items: [{ name: 'Wide-Leg Trouser', price: 4240, qty: 1 }],
    subtotal: 4240, couponCode: null, discount: 0, delivery: 0, total: 4240,
    amountReceived: 4240, date: '2026-08-12T18:30:00', status: 'completed',
  },
  {
    id: 'INV-2026-UHX59L5', customer: 'Kumbha Venkata', phone: '9032638948', source: 'offline',
    items: [{ name: 'Wool Overcoat', price: 8900, qty: 1 }, { name: 'Wide-Leg Trouser', price: 4240, qty: 2 }],
    subtotal: 17380, couponCode: 'WELCOME15', discount: 2607, delivery: 0, total: 14773,
    amountReceived: 15000, date: '2026-07-22T13:10:00', status: 'completed',
  },
  {
    id: 'INV-2026-PRIYA07', customer: 'Priya R', phone: '9176508333', source: 'online',
    items: [{ name: 'Ribbed Knit Top', price: 3240, qty: 1 }, { name: 'Cream Crewneck', price: 2240, qty: 1 }],
    subtotal: 5480, couponCode: 'SHALISTONE10', discount: 548, delivery: 150, total: 5082,
    amountReceived: 5082, date: '2026-08-18T08:20:00', status: 'completed',
  },
  {
    id: 'INV-2026-G7LFTN0', customer: 'Walk-in Customer', phone: '8610710434', source: 'offline',
    items: [{ name: 'Linen Overshirt', price: 2150, qty: 1 }],
    subtotal: 2150, couponCode: null, discount: 0, delivery: 0, total: 2150,
    amountReceived: 2150, date: '2026-08-16T12:00:00', status: 'completed',
  },
  {
    id: 'INV-2026-DEVAN08', customer: 'Devan Rao', phone: '9700456789', source: 'online',
    items: [{ name: 'Denim Jacket', price: 3500, qty: 1 }, { name: 'Cotton Hoodie', price: 2193, qty: 1 }],
    subtotal: 5693, couponCode: null, discount: 0, delivery: 200, total: 5893,
    amountReceived: 5893, date: '2026-08-14T20:15:00', status: 'completed',
  },
];

const SEED_COUPONS: Coupon[] = [
  { code: 'SHALISTONE10', discountPct: 10, minOrder: 0, expiry: '2026-12-31', usageLimit: 500, used: 64 },
  { code: 'WELCOME15', discountPct: 15, minOrder: 10000, expiry: '2026-10-31', usageLimit: 50, used: 11 },
  { code: 'FESTIVE20', discountPct: 20, minOrder: 15000, expiry: '2026-09-30', usageLimit: 30, used: 6 },
];

const SEED: StoreState = { orders: SEED_ORDERS, products: SEED_PRODUCTS, coupons: SEED_COUPONS };

/* --------------------------- persistence ---------------------------- */

const KEY = 'shalistone_admin_v1';
const listeners = new Set<() => void>();
let cache: StoreState | null = null;

function normalize(raw: unknown): StoreState {
  const r = (raw ?? {}) as Partial<StoreState>;
  return {
    orders: Array.isArray(r.orders) ? r.orders : SEED_ORDERS,
    products: Array.isArray(r.products) ? r.products : SEED_PRODUCTS,
    coupons: Array.isArray(r.coupons) ? r.coupons : SEED_COUPONS,
  };
}

function read(): StoreState {
  if (typeof window === 'undefined') return SEED;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? normalize(JSON.parse(raw)) : SEED;
  } catch {
    cache = SEED;
  }
  return cache;
}

function write(next: StoreState) {
  cache = next;
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private-mode errors */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      read();
      cb();
    }
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

/* ------------------------------ hook -------------------------------- */

export function useAdminData(): StoreState {
  return useSyncExternalStore(subscribe, read, () => SEED);
}

/* ----------------------------- actions ------------------------------ */

export function addOrder(order: Order) {
  const s = read();
  write({ ...s, orders: [order, ...s.orders] });
  // reduce stock for any items that match catalog products (by name)
  decrementStockForItems(order.items);
}

export function deleteOrder(id: string) {
  const s = read();
  write({ ...s, orders: s.orders.filter((o) => o.id !== id) });
}

export function addProduct(p: Product) {
  const s = read();
  write({ ...s, products: [p, ...s.products] });
}

export function updateProduct(id: string, patch: Partial<Product>) {
  const s = read();
  write({ ...s, products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
}

export function deleteProduct(id: string) {
  const s = read();
  write({ ...s, products: s.products.filter((p) => p.id !== id) });
}

export function adjustStock(id: string, delta: number) {
  const s = read();
  write({
    ...s,
    products: s.products.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)),
  });
}

function decrementStockForItems(items: OrderItem[]) {
  const s = read();
  const products = s.products.map((p) => {
    const hit = items.find((it) => it.name.trim().toLowerCase() === p.name.trim().toLowerCase());
    return hit ? { ...p, stock: Math.max(0, p.stock - hit.qty) } : p;
  });
  write({ ...s, products });
}

export function addCoupon(c: Coupon) {
  const s = read();
  if (s.coupons.some((x) => x.code === c.code)) return;
  write({ ...s, coupons: [c, ...s.coupons] });
}

export function updateCoupon(code: string, patch: Partial<Coupon>) {
  const s = read();
  write({ ...s, coupons: s.coupons.map((c) => (c.code === code ? { ...c, ...patch } : c)) });
}

export function deleteCoupon(code: string) {
  const s = read();
  write({ ...s, coupons: s.coupons.filter((c) => c.code !== code) });
}

export function resetDemo() {
  write({ orders: SEED_ORDERS, products: SEED_PRODUCTS, coupons: SEED_COUPONS });
}

/* validate a coupon against a subtotal; returns discount amount or an error */
export function evaluateCoupon(code: string, subtotal: number, coupons: Coupon[]) {
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c) return { ok: false as const, reason: 'Invalid coupon code' };
  if (new Date(c.expiry) < new Date(new Date().toDateString())) return { ok: false as const, reason: 'Coupon expired' };
  if (c.used >= c.usageLimit) return { ok: false as const, reason: 'Usage limit reached' };
  if (subtotal < c.minOrder) return { ok: false as const, reason: `Minimum order ₹${c.minOrder.toLocaleString('en-IN')}` };
  return { ok: true as const, coupon: c, discount: Math.round((subtotal * c.discountPct) / 100) };
}

/* ----------------------------- helpers ------------------------------ */

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
