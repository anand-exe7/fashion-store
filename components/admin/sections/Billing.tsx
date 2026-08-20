'use client';
import { useMemo, useState } from 'react';
import { Trash2, Plus, Minus, List, ShoppingBag, MessageCircle, User, X } from 'lucide-react';
import {
  useAdminData,
  addOrder,
  updateCoupon,
  evaluateCoupon,
  genInvoiceId,
  inr,
  type Source,
  type OrderItem,
} from '@/lib/store';
import { Card, Modal, ModalHeader, Toast, Field, inputCls, inputBase } from '../ui';

interface Line extends OrderItem {
  key: number;
}

let keySeq = 1;
const newLine = (): Line => ({ key: keySeq++, name: '', price: 0, qty: 1 });

export default function Billing({ go }: { go?: (k: string) => void }) {
  const { products, coupons } = useAdminData();
  const [source, setSource] = useState<Source>('offline');
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [couponCode, setCouponCode] = useState('');
  const [discMode, setDiscMode] = useState<'₹' | '%'>('₹');
  const [discValue, setDiscValue] = useState('');
  const [delivery, setDelivery] = useState('');
  const [received, setReceived] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [toast, setToast] = useState('');

  const validLines = lines.filter((l) => l.name.trim() && l.price > 0);
  const subtotal = validLines.reduce((a, l) => a + l.price * l.qty, 0);
  const itemCount = validLines.reduce((a, l) => a + l.qty, 0);

  const couponEval = useMemo(
    () => (couponCode ? evaluateCoupon(couponCode, subtotal, coupons) : null),
    [couponCode, subtotal, coupons],
  );
  const couponDiscount = couponEval?.ok ? couponEval.discount : 0;

  const manualDiscount = Math.min(
    subtotal - couponDiscount,
    discMode === '₹' ? Number(discValue) || 0 : Math.round((subtotal * (Number(discValue) || 0)) / 100),
  );
  const discount = Math.max(0, couponDiscount + Math.max(0, manualDiscount));
  const deliveryNum = Number(delivery) || 0;
  const grandTotal = Math.max(0, subtotal - discount + deliveryNum);
  const receivedNum = Number(received) || 0;
  const change = receivedNum - grandTotal;

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const setLine = (key: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const addCatalog = (name: string, price: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.name.trim().toLowerCase() === name.toLowerCase());
      if (existing) return prev.map((l) => (l.key === existing.key ? { ...l, qty: l.qty + 1 } : l));
      const blank = prev.find((l) => !l.name.trim());
      if (blank) return prev.map((l) => (l.key === blank.key ? { ...l, name, price, qty: 1 } : l));
      return [...prev, { key: keySeq++, name, price, qty: 1 }];
    });
  };

  const clearOrder = () => {
    setLines([newLine()]);
    setCustomer('');
    setPhone('');
    setCouponCode('');
    setDiscValue('');
    setDelivery('');
    setReceived('');
  };

  const createBill = (openWhatsApp: boolean) => {
    if (validLines.length === 0) {
      flash('Add at least one item with a name and price.');
      return;
    }
    const id = genInvoiceId();
    addOrder({
      id,
      customer: customer.trim() || 'Walk-in Customer',
      phone: phone.trim(),
      source,
      items: validLines.map(({ name, price, qty }) => ({ name: name.trim(), price, qty })),
      subtotal,
      couponCode: couponEval?.ok ? couponEval.coupon.code : null,
      discount,
      delivery: deliveryNum,
      total: grandTotal,
      amountReceived: source === 'offline' ? receivedNum || grandTotal : grandTotal,
      date: new Date().toISOString(),
      status: 'completed',
    });
    if (couponEval?.ok) updateCoupon(couponEval.coupon.code, { used: couponEval.coupon.used + 1 });

    if (openWhatsApp && phone.trim()) {
      const lineText = validLines.map((l) => `• ${l.name} x${l.qty} — ${inr(l.price * l.qty)}`).join('\n');
      const msg = `*Shalistone — Invoice ${id}*\n${lineText}\nSubtotal: ${inr(subtotal)}${
        discount ? `\nDiscount: -${inr(discount)}` : ''
      }${deliveryNum ? `\nDelivery: ${inr(deliveryNum)}` : ''}\n*Total: ${inr(grandTotal)}*\n\nThank you for shopping with us!`;
      window.open(`https://wa.me/91${phone.trim()}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    flash(`Bill ${id} saved${source === 'online' ? ' (online)' : ''}.`);
    clearOrder();
  };

  return (
    <Card className="p-4 sm:p-5 md:p-7">
      {/* header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="h-7 w-1.5 rounded-full bg-neutral-900" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">POS Billing Panel</h2>
            <p className="text-xs text-neutral-500 sm:text-sm">Quick invoice generator · synced to Orders & Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-1 self-start rounded-xl border border-black/[0.08] bg-black/[0.03] p-1">
          {(['offline', 'online'] as Source[]).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                source === s ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {s === 'offline' ? 'Offline (POS)' : 'Online Order'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        {/* left */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-black/[0.06] p-4 sm:p-5">
            <p className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-900">
              <User className="h-4 w-4" /> Customer Details
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Customer Name">
                <input className={inputCls} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Enter name" />
              </Field>
              <Field label="Mobile Number (WhatsApp)">
                <input
                  className={inputCls}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit number"
                  inputMode="numeric"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-black/[0.06] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                <ShoppingBag className="h-4 w-4" /> Order Items
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearOrder}
                  className="rounded-lg border border-black/[0.08] px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-black/[0.03]"
                >
                  Clear Order
                </button>
                <button
                  onClick={() => setCatalogOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800"
                >
                  <List className="h-3.5 w-3.5" /> Catalog
                </button>
                <button
                  onClick={() => setLines((p) => [...p, newLine()])}
                  className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-black/[0.03]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {lines.map((l) => (
                <div key={l.key} className="flex flex-col gap-2 rounded-xl border border-black/[0.06] p-2.5 sm:flex-row sm:items-center">
                  <input
                    className={`${inputCls} flex-1`}
                    value={l.name}
                    onChange={(e) => setLine(l.key, { name: e.target.value })}
                    placeholder="Item name / description…"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className={`${inputBase} w-20 shrink-0 sm:w-24`}
                      value={l.price || ''}
                      onChange={(e) => setLine(l.key, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                      placeholder="Price ₹"
                      inputMode="numeric"
                    />
                    <div className="flex shrink-0 items-center rounded-xl border border-black/[0.09]">
                      <button onClick={() => setLine(l.key, { qty: Math.max(1, l.qty - 1) })} className="grid h-8 w-8 place-items-center text-neutral-500 hover:text-black sm:h-9 sm:w-9">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold sm:w-8">{l.qty}</span>
                      <button onClick={() => setLine(l.key, { qty: l.qty + 1 })} className="grid h-8 w-8 place-items-center text-neutral-500 hover:text-black sm:h-9 sm:w-9">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => setLines((p) => (p.length > 1 ? p.filter((x) => x.key !== l.key) : [newLine()]))}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-red-500 hover:bg-red-50 sm:h-9 sm:w-9"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* right — summary */}
        <div className="rounded-2xl border border-black/[0.06] bg-[#faf9f6] p-4 sm:p-5">
          <div className="mb-4 space-y-2 border-b border-dashed border-black/10 pb-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Source</span>
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${source === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {source}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Customer</span>
              <span className="font-semibold text-neutral-800">{customer.trim() || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Phone</span>
              <span className="font-semibold text-neutral-800">{phone.trim() || '—'}</span>
            </div>
          </div>

          {validLines.length === 0 ? (
            <p className="py-4 text-center text-xs text-neutral-400">No items added yet</p>
          ) : (
            <div className="mb-4 space-y-1.5 text-sm">
              {validLines.map((l) => (
                <div key={l.key} className="flex justify-between">
                  <span className="truncate pr-2 text-neutral-600">
                    {l.name} <span className="text-neutral-400">×{l.qty}</span>
                  </span>
                  <span className="font-semibold text-neutral-800">{inr(l.price * l.qty)}</span>
                </div>
              ))}
            </div>
          )}

          <Field label="Apply Coupon">
            <select className={inputCls} value={couponCode} onChange={(e) => setCouponCode(e.target.value)}>
              <option value="">No Coupon</option>
              {coupons.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.discountPct}% off
                </option>
              ))}
            </select>
          </Field>
          {couponCode && couponEval && !couponEval.ok && (
            <p className="mt-1 text-[11px] font-semibold text-red-500">{couponEval.reason}</p>
          )}

          <div className="mt-4">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-neutral-500">Manual Discount</span>
            <div className="flex flex-wrap gap-2">
              <select className={`${inputBase} w-16 shrink-0`} value={discMode} onChange={(e) => setDiscMode(e.target.value as '₹' | '%')}>
                <option value="₹">₹</option>
                <option value="%">%</option>
              </select>
              <input className={`${inputCls} min-w-[100px] flex-1`} value={discValue} onChange={(e) => setDiscValue(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" inputMode="numeric" />
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-dashed border-black/10 pt-4 text-sm">
            <Row label={`Subtotal (${itemCount} item${itemCount === 1 ? '' : 's'})`} value={inr(subtotal)} />
            {discount > 0 && <Row label="Discount" value={`- ${inr(discount)}`} valueClass="text-emerald-600" />}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Delivery</span>
              <input
                className="w-24 rounded-lg border border-black/[0.09] px-2 py-1 text-right text-sm outline-none focus:border-neutral-400"
                value={delivery}
                onChange={(e) => setDelivery(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
            <span className="text-sm font-bold uppercase tracking-widest text-neutral-900">Grand Total</span>
            <span className="text-2xl font-extrabold text-neutral-900">{inr(grandTotal)}</span>
          </div>

          {source === 'offline' && (
            <div className="mt-4 rounded-xl border border-black/[0.06] bg-white p-3">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-neutral-500">Cash Payment</p>
              <input
                className={inputCls}
                value={received}
                onChange={(e) => setReceived(e.target.value.replace(/\D/g, ''))}
                placeholder="Amount received (₹)"
                inputMode="numeric"
              />
              {receivedNum > 0 && (
                <p className={`mt-2 text-xs font-bold ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {change >= 0 ? `Change to return: ${inr(change)}` : `Short by ${inr(-change)}`}
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => createBill(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" /> Send Bill via WhatsApp
          </button>
          <button
            onClick={() => createBill(false)}
            className="mt-2 w-full rounded-xl border border-black/[0.1] py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-700 hover:bg-black/[0.03]"
          >
            Save Bill Only
          </button>
        </div>
      </div>

      {/* Catalog picker */}
      <Modal open={catalogOpen} onClose={() => setCatalogOpen(false)} size="md">
        <ModalHeader title="Product Catalog" onClose={() => setCatalogOpen(false)} />
        <div className="divide-y divide-black/[0.05] p-2">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                addCatalog(p.name, p.price);
                setCatalogOpen(false);
              }}
              disabled={p.stock <= 0}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900">{p.name}</p>
                <p className="truncate text-xs text-neutral-400">
                  {p.category} · {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-neutral-900">{inr(p.price)}</span>
            </button>
          ))}
        </div>
      </Modal>

      <Toast show={!!toast} message={toast} />
    </Card>
  );
}

function Row({ label, value, valueClass = 'text-neutral-800' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}
