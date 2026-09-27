'use client';
import { useMemo, useState } from 'react';
import { Search, Download, Trash2, ShoppingCart, ChevronDown, MessageCircle, FileText, Package, Zap, Check } from 'lucide-react';
import { useAdminData, deleteOrder, setFulfillment, inr, type Order, type Source, type FulfillmentStatus } from '@/lib/store';
import { Card, Modal, ModalHeader, EmptyState } from '../ui';

type TypeFilter = 'all' | Source;
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// Opens the shareable/printable invoice for an order in a new tab.
function openInvoice(id: string) {
  window.open(`/invoice/${encodeURIComponent(id)}`, '_blank');
}

// Sends the bill summary + invoice link to the customer over WhatsApp.
function sendWhatsApp(o: Order) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const lineText = o.items.map((l) => `• ${l.name} x${l.qty} — ${inr(l.price * l.qty)}`).join('\n');
  const msg =
    `*Shalistone — Invoice ${o.id}*\n` +
    `Hi ${o.customer || 'there'}, thank you for shopping with us!\n\n` +
    `${lineText}\n` +
    `Subtotal: ${inr(o.subtotal)}` +
    (o.discount ? `\nDiscount: -${inr(o.discount)}` : '') +
    (o.delivery ? `\nDelivery: ${inr(o.delivery)}` : '') +
    `\n*Total: ${inr(o.total)}*\n\n` +
    (origin ? `View / download your invoice:\n${origin}/invoice/${o.id}\n\n` : '') +
    `Follow us on Instagram 📸\n@shalistone · https://www.instagram.com/shalistone/\n\n` +
    `— Shalistone`;
  const base = o.phone.trim() ? `https://wa.me/91${o.phone.trim()}` : 'https://wa.me/';
  window.open(`${base}?text=${encodeURIComponent(msg)}`, '_blank');
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

const fulfillmentOf = (o: Order) => (o.fulfillmentStatus ?? 'pending') as FulfillmentStatus;
// An online order still needs the shop's attention until it has shipped.
const needsAction = (o: Order) => o.source === 'online' && o.status === 'completed' && fulfillmentOf(o) !== 'shipped';

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

  // Online orders awaiting packing/shipping — surfaced in a queue at the top so
  // the shop never has to hunt for what needs processing.
  const queue = useMemo(
    () =>
      orders
        .filter(needsAction)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), // oldest first — process in order
    [orders],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = orders.filter(
      (o) =>
        // Only completed sales are shown. Abandoned online checkouts stay
        // "pending" in the DB (payment never finished) and are hidden here so
        // Orders matches Analytics — no phantom bills.
        o.status === 'completed' &&
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
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Order Management</h2>
          <p className="text-xs text-neutral-500 sm:text-sm">Online orders to pack are pinned to the top.</p>
        </div>
        <button
          onClick={() => go?.('billing')}
          className="flex items-center gap-2 self-start rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
        >
          <ShoppingCart className="h-4 w-4" /> Open POS
        </button>
      </div>

      {/* Online fulfillment queue — the primary focus of this page */}
      {queue.length > 0 && (
        <Card className="overflow-hidden border-amber-200/70 bg-gradient-to-b from-amber-50/80 to-white">
          <div className="flex items-center gap-2.5 border-b border-amber-200/60 px-4 py-3 sm:px-5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-400 text-amber-950">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-neutral-900">Online orders to process</p>
              <p className="text-[11px] text-neutral-500">{queue.length} order{queue.length === 1 ? '' : 's'} waiting to be packed or shipped</p>
            </div>
          </div>
          <div className="divide-y divide-amber-100/80">
            {queue.map((o) => (
              <QueueRow key={o.id} order={o} onDetail={() => setDetail(o)} />
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-12 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Type</span>
              {(['all', 'online', 'offline'] as TypeFilter[]).map((t) => (
                <button key={t} onClick={() => setType(t)} className={chip(type === t)}>
                  {t === 'all' ? 'All Bills' : t === 'online' ? 'Online' : 'In-Store'}
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
        <p className="text-sm font-medium text-neutral-500">{list.length} order{list.length === 1 ? '' : 's'}</p>
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

      {/* Order cards — one clean, roomy card per order on every screen size */}
      {list.length === 0 ? (
        <Card><EmptyState message="No orders match your filters." /></Card>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <OrderCard key={o.id} order={o} onDetail={() => setDetail(o)} onDelete={() => setConfirmId(o.id)} />
          ))}
        </div>
      )}

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

// A single order rendered as a spacious, tidy card — replaces the cramped table.
function OrderCard({ order: o, onDetail, onDelete }: { order: Order; onDetail: () => void; onDelete: () => void }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Identity */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-neutral-900">{o.id}</span>
            <SourceBadge source={o.source} />
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-neutral-800">{o.customer}</p>
          <p className="text-xs text-neutral-400">{o.phone || '—'} · {fmtDate(o.date)} · {fmtTime(o.date)}</p>
        </div>
        {/* Amount */}
        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
          <span className="text-xl font-extrabold text-teal-600">{inr(o.total)}</span>
          <StatusBadge status={o.status} />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/[0.05] pt-3">
        {o.source === 'online' && <FulfillmentControl order={o} />}
        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          <button
            onClick={() => sendWhatsApp(o)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-emerald-600"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </button>
          <button
            onClick={() => openInvoice(o.id)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-sky-600"
          >
            <FileText className="h-3.5 w-3.5" /> Invoice
          </button>
          <button
            onClick={onDetail}
            className="rounded-lg border border-black/[0.09] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-700 hover:bg-black/[0.03]"
          >
            Details
          </button>
          <button
            onClick={onDelete}
            className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-500 transition-colors hover:bg-red-50"
            aria-label="Delete order"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

// Compact row for the online fulfillment queue — action-forward.
function QueueRow({ order: o, onDetail }: { order: Order; onDetail: () => void }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-neutral-900">{o.customer}</span>
          <span className="text-xs font-semibold text-neutral-400">{o.id}</span>
        </div>
        <p className="text-xs text-neutral-500">{o.phone || '—'} · {fmtDate(o.date)}, {fmtTime(o.date)} · <span className="font-bold text-teal-600">{inr(o.total)}</span></p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FulfillmentControl order={o} />
        <button onClick={() => sendWhatsApp(o)} className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-white transition-colors hover:bg-emerald-600" aria-label="WhatsApp">
          <MessageCircle className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => openInvoice(o.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500 text-white transition-colors hover:bg-sky-600" aria-label="Invoice">
          <FileText className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDetail} className="rounded-lg border border-black/[0.09] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-700 hover:bg-black/[0.03]">
          Details
        </button>
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: Source }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        source === 'online' ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-rose-300 bg-rose-50 text-rose-500'
      }`}
    >
      {source === 'online' ? 'Online' : 'In-Store'}
    </span>
  );
}
// Online-order packing workflow control. Advances pending → packed → shipped,
// and shows the current stage. Retail POS bills don't get one.
const FULFILL_NEXT: Record<FulfillmentStatus, FulfillmentStatus | null> = {
  pending: 'packed',
  packed: 'shipped',
  shipped: null,
};
const FULFILL_STYLE: Record<FulfillmentStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  packed: 'bg-sky-50 text-sky-700 border-sky-200',
  shipped: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};
function FulfillmentControl({ order }: { order: Order }) {
  if (order.source !== 'online') return null;
  const current = (order.fulfillmentStatus ?? 'pending') as FulfillmentStatus;
  const next = FULFILL_NEXT[current];
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${FULFILL_STYLE[current]}`}>
        {current === 'shipped' ? <Check className="h-3 w-3" /> : <Package className="h-3 w-3" />} {current}
      </span>
      {next && (
        <button
          onClick={() => setFulfillment(order.id, next)}
          className="rounded-lg bg-neutral-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-black"
        >
          Mark {next}
        </button>
      )}
    </div>
  );
}
function StatusBadge({ status }: { status: Order['status'] }) {
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
        status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
      }`}
    >
      {status}
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
