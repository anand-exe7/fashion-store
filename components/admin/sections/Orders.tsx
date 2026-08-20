'use client';
import { useMemo, useState } from 'react';
import { Search, Download, Trash2, ExternalLink, ShoppingCart, ChevronDown } from 'lucide-react';
import { useAdminData, deleteOrder, inr, type Order, type Source } from '@/lib/store';
import { Card, Modal, ModalHeader, EmptyState } from '../ui';

type TypeFilter = 'all' | Source;
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function inDate(iso: string, f: DateFilter, from: string, to: string) {
  if (f === 'all') return true;
  const d = new Date(iso);
  const now = new Date();
  if (f === 'today') return d.toDateString() === now.toDateString();
  if (f === 'week') {
    const diff = (now.getTime() - d.getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  }
  if (f === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (f === 'custom') {
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to + 'T23:59:59')) return false;
    return true;
  }
  return true;
}

export default function Orders({ go }: { go?: (k: string) => void }) {
  const { orders } = useAdminData();
  const [type, setType] = useState<TypeFilter>('all');
  const [date, setDate] = useState<DateFilter>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'high' | 'low'>('newest');
  const [detail, setDetail] = useState<Order | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = orders.filter(
      (o) =>
        (type === 'all' || o.source === type) &&
        inDate(o.date, date, from, to) &&
        (!q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.phone.includes(q)),
    );
    return [...filtered].sort((a, b) => {
      if (sort === 'high') return b.total - a.total;
      if (sort === 'low') return a.total - b.total;
      const t = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sort === 'newest' ? t : -t;
    });
  }, [orders, type, date, from, to, query, sort]);

  const exportCsv = () => {
    const head = ['Invoice No', 'Customer', 'Phone', 'Bill Type', 'Coupon', 'Discount', 'Delivery', 'Total', 'Date', 'Status'];
    const rows = list.map((o) => [
      o.id, o.customer, o.phone, o.source, o.couponCode ?? '-', o.discount, o.delivery, o.total, fmtDate(o.date), o.status,
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `shalistone-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
      active ? 'bg-neutral-900 text-white' : 'bg-black/[0.04] text-neutral-600 hover:bg-black/[0.07]'
    }`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Order Management</h2>
        <button
          onClick={() => go?.('billing')}
          className="flex items-center gap-2 self-start rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
        >
          <ShoppingCart className="h-4 w-4" /> Open POS
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-12 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Type</span>
              {(['all', 'offline', 'online'] as TypeFilter[]).map((t) => (
                <button key={t} onClick={() => setType(t)} className={chip(type === t)}>
                  {t === 'all' ? 'All Bills' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-12 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Date</span>
              {(['today', 'week', 'month'] as DateFilter[]).map((d) => (
                <button key={d} onClick={() => setDate(date === d ? 'all' : d)} className={chip(date === d)}>
                  {d === 'today' ? 'Today' : d === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
              <button onClick={() => setDate('custom')} className={chip(date === 'custom')}>
                Custom Range
              </button>
              {date !== 'all' && (
                <button onClick={() => { setDate('all'); setFrom(''); setTo(''); }} className="px-2 text-xs font-bold text-red-500 hover:underline">
                  Clear Dates
                </button>
              )}
            </div>
            {date === 'custom' && (
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-black/[0.09] px-3 py-1.5 text-xs outline-none focus:border-neutral-400" />
                <span className="text-xs text-neutral-400">to</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-black/[0.09] px-3 py-1.5 text-xs outline-none focus:border-neutral-400" />
              </div>
            )}
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search invoice, name, phone…"
              className="w-full rounded-xl border border-black/[0.09] bg-white py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
            />
          </div>
        </div>
      </Card>

      {/* Result bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-neutral-500">{list.length} result(s)</p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="appearance-none rounded-lg border border-black/[0.09] bg-white py-2 pl-3 pr-8 text-xs font-medium text-neutral-700 outline-none focus:border-neutral-400"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="high">Total: High → Low</option>
              <option value="low">Total: Low → High</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          </div>
          <button onClick={exportCsv} className="flex items-center gap-2 text-sm font-bold text-neutral-700 hover:text-black">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table (desktop) */}
      <Card className="hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <th className="px-5 py-3">Invoice No</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Bill Type</th>
                <th className="px-3 py-3">Coupon</th>
                <th className="px-3 py-3">Discount</th>
                <th className="px-3 py-3">Delivery</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-t border-black/[0.05] hover:bg-black/[0.015]">
                  <td className="px-5 py-4">
                    <button onClick={() => setDetail(o)} className="flex items-center gap-1.5 text-sm font-bold text-neutral-900 hover:underline">
                      {o.id} <ExternalLink className="h-3 w-3 text-neutral-400" />
                    </button>
                  </td>
                  <td className="px-3 py-4 text-sm font-semibold text-neutral-800">{o.customer}</td>
                  <td className="px-3 py-4 text-sm text-neutral-600">{o.phone || '—'}</td>
                  <td className="px-3 py-4"><SourceBadge source={o.source} /></td>
                  <td className="px-3 py-4 text-sm text-neutral-500">{o.couponCode ?? '—'}</td>
                  <td className="px-3 py-4 text-sm text-neutral-500">{o.discount ? inr(o.discount) : '—'}</td>
                  <td className="px-3 py-4 text-sm text-neutral-500">{o.delivery ? inr(o.delivery) : '—'}</td>
                  <td className="px-3 py-4 text-sm font-bold text-neutral-900">{inr(o.total)}</td>
                  <td className="px-3 py-4 text-sm text-neutral-600">{fmtDate(o.date)}</td>
                  <td className="px-3 py-4">
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{o.status}</span>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <button onClick={() => setConfirmId(o.id)} className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <EmptyState message="No orders match your filters." />}
      </Card>

      {/* Cards (mobile) */}
      <div className="space-y-3 lg:hidden">
        {list.map((o) => (
          <Card key={o.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <button onClick={() => setDetail(o)} className="text-sm font-bold text-neutral-900 hover:underline">{o.id}</button>
              <SourceBadge source={o.source} />
            </div>
            <p className="mt-1 text-sm font-semibold text-neutral-800">{o.customer}</p>
            <p className="text-xs text-neutral-400">{o.phone || '—'} · {fmtDate(o.date)}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-extrabold text-neutral-900">{inr(o.total)}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setDetail(o)} className="rounded-lg border border-black/[0.09] px-3 py-1.5 text-xs font-bold text-neutral-700">View</button>
                <button onClick={() => setConfirmId(o.id)} className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </Card>
        ))}
        {list.length === 0 && <Card><EmptyState message="No orders match your filters." /></Card>}
      </div>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} size="md">
        {detail && (
          <>
            <ModalHeader title={detail.id} onClose={() => setDetail(null)} right={<SourceBadge source={detail.source} />} />
            <div className="space-y-4 p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Meta label="Customer" value={detail.customer} />
                <Meta label="Phone" value={detail.phone || '—'} />
                <Meta label="Date" value={fmtDate(detail.date)} />
                <Meta label="Status" value={detail.status} />
              </div>
              <div className="divide-y divide-black/[0.05] rounded-xl border border-black/[0.06]">
                {detail.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-neutral-700">{it.name} <span className="text-neutral-400">× {it.qty}</span></span>
                    <span className="font-semibold text-neutral-900">{inr(it.price * it.qty)}</span>
                  </div>
                ))}
                <Line label="Subtotal" value={inr(detail.subtotal)} />
                {detail.couponCode && <Line label={`Coupon (${detail.couponCode})`} value={`- ${inr(detail.discount)}`} green />}
                {!detail.couponCode && detail.discount > 0 && <Line label="Discount" value={`- ${inr(detail.discount)}`} green />}
                {detail.delivery > 0 && <Line label="Delivery" value={inr(detail.delivery)} />}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-bold text-neutral-900">Total</span>
                  <span className="text-base font-extrabold text-neutral-900">{inr(detail.total)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} size="sm">
        <div className="p-6 text-center">
          <p className="text-lg font-bold text-neutral-900">Delete this order?</p>
          <p className="mt-1 text-sm text-neutral-500">{confirmId} will be removed from Orders and Analytics. This can’t be undone.</p>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setConfirmId(null)} className="flex-1 rounded-xl border border-black/[0.1] py-2.5 text-sm font-bold text-neutral-700 hover:bg-black/[0.03]">Cancel</button>
            <button
              onClick={() => { if (confirmId) deleteOrder(confirmId); setConfirmId(null); }}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SourceBadge({ source }: { source: Source }) {
  return (
    <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${source === 'online' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      {source}
    </span>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className="font-semibold capitalize text-neutral-800">{value}</p>
    </div>
  );
}
function Line({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className={green ? 'font-semibold text-emerald-600' : 'font-semibold text-neutral-800'}>{value}</span>
    </div>
  );
}
