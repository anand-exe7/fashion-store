'use client';
import { useMemo, useState } from 'react';
import { Search, Info, RefreshCw } from 'lucide-react';
import { useAdminData, addCoupon, updateCoupon, deleteCoupon, genCouponCode, type Coupon } from '@/lib/store';
import { Card, Field, inputCls, Toast } from '../ui';

const isExpired = (c: Coupon) => new Date(c.expiry) < new Date(new Date().toDateString());

export default function Coupons() {
  const { coupons } = useAdminData();
  const [code, setCode] = useState('');
  const [pct, setPct] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [limit, setLimit] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2400); };

  const reset = () => { setCode(''); setPct(''); setMinOrder(''); setExpiry(''); setLimit(''); setEditing(null); };

  const submit = () => {
    if (!code.trim() || !pct) { flash('Code and discount % are required.'); return; }
    const payload = {
      code: code.trim().toUpperCase(),
      discountPct: Math.min(100, Number(pct) || 0),
      minOrder: Number(minOrder) || 0,
      expiry: expiry || '2026-12-31',
      usageLimit: Number(limit) || 100,
    };
    if (editing) {
      updateCoupon(editing, payload);
      flash(`Coupon ${payload.code} updated.`);
    } else {
      if (coupons.some((c) => c.code === payload.code)) { flash('That code already exists.'); return; }
      addCoupon({ ...payload, used: 0 });
      flash(`Coupon ${payload.code} created.`);
    }
    reset();
  };

  const startEdit = (c: Coupon) => {
    setEditing(c.code);
    setCode(c.code);
    setPct(String(c.discountPct));
    setMinOrder(String(c.minOrder));
    setExpiry(c.expiry);
    setLimit(String(c.usageLimit));
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coupons.filter((c) => !q || c.code.toLowerCase().includes(q));
  }, [coupons, query]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Coupon Management</h2>

      <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info className="h-4 w-4 shrink-0" />
        Coupon discount applies to the product subtotal only — not the delivery charge.
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* form */}
        <Card className="p-5 sm:p-6">
          <p className="mb-5 font-bold text-neutral-900">{editing ? `Edit ${editing}` : '+ New Coupon'}</p>
          <div className="space-y-4">
            <div>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-neutral-500">Coupon Code *</span>
              <div className="flex gap-2">
                <input className={`${inputCls} uppercase`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="E.G. SUMMER20" disabled={!!editing} />
                {!editing && (
                  <button onClick={() => setCode(genCouponCode())} className="shrink-0 rounded-xl bg-neutral-900 px-4 text-xs font-bold text-white hover:bg-neutral-800">
                    Generate
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Discount % *"><input className={inputCls} value={pct} onChange={(e) => setPct(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="e.g. 15" inputMode="numeric" /></Field>
              <Field label="Min Order (₹)"><input className={inputCls} value={minOrder} onChange={(e) => setMinOrder(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 1000" inputMode="numeric" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Expiry Date"><input type="date" className={inputCls} value={expiry} onChange={(e) => setExpiry(e.target.value)} /></Field>
              <Field label="Usage Limit"><input className={inputCls} value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 50" inputMode="numeric" /></Field>
            </div>
            <div className="flex gap-2">
              <button onClick={submit} className="flex-1 rounded-xl bg-neutral-900 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-neutral-800">
                {editing ? 'Save Changes' : 'Create Coupon'}
              </button>
              {editing && (
                <button onClick={reset} className="rounded-xl border border-black/[0.1] px-4 text-sm font-bold text-neutral-700 hover:bg-black/[0.03]">Cancel</button>
              )}
            </div>
          </div>
        </Card>

        {/* list */}
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-neutral-900">All Coupons ({coupons.length})</p>
            <button onClick={() => flash('Coupons are live.')} className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-black/[0.03]">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search coupons by code…" className="w-full rounded-xl border border-black/[0.09] bg-white py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400" />
          </div>
          <div className="space-y-3">
            {list.map((c) => (
              <div key={c.code} className="rounded-xl border border-black/[0.06] bg-[#faf9f6] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-neutral-900">{c.code}</p>
                    <p className="text-sm font-semibold text-emerald-600">{c.discountPct}% off · min {c.minOrder ? `₹${c.minOrder.toLocaleString('en-IN')}` : '₹0'}</p>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      {Math.max(0, c.usageLimit - c.used)} remaining · expires {new Date(c.expiry).toLocaleDateString('en-GB')}
                    </p>
                    {isExpired(c) && <p className="mt-0.5 text-[11px] font-bold text-red-500">Expired</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <button onClick={() => startEdit(c)} className="text-blue-600 hover:underline">EDIT</button>
                    <button onClick={() => deleteCoupon(c.code)} className="text-red-500 hover:underline">DEL</button>
                  </div>
                </div>
              </div>
            ))}
            {list.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">No coupons found.</p>}
          </div>
        </Card>
      </div>

      <Toast show={!!toast} message={toast} />
    </div>
  );
}
