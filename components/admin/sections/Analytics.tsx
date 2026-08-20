'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useAdminData, inr, type Order, type Source } from '@/lib/store';
import { Card } from '../ui';

type Period = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
type Channel = 'all' | Source;
type Tab = 'revenue' | 'today' | 'products' | 'coupons';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR = 2026;

function inPeriod(iso: string, p: Period, from: string, to: string) {
  if (p === 'all') return true;
  const d = new Date(iso);
  const now = new Date();
  if (p === 'today') return d.toDateString() === now.toDateString();
  if (p === 'week') {
    const diff = (now.getTime() - d.getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  }
  if (p === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (p === 'year') return d.getFullYear() === now.getFullYear();
  if (p === 'custom') {
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to + 'T23:59:59')) return false;
    return true;
  }
  return true;
}

const itemsOf = (o: Order) => o.items.reduce((x, i) => x + i.qty, 0);

export default function Analytics() {
  const { orders, products } = useAdminData();
  const [period, setPeriod] = useState<Period>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [channel, setChannel] = useState<Channel>('all');
  const [tab, setTab] = useState<Tab>('revenue');

  const periodOrders = useMemo(() => orders.filter((o) => inPeriod(o.date, period, from, to)), [orders, period, from, to]);
  const view = useMemo(() => periodOrders.filter((o) => channel === 'all' || o.source === channel), [periodOrders, channel]);

  return (
    <div className="space-y-6">
      {/* Header + period */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">POS Analytics</h2>
          <p className="text-sm text-neutral-500">Real-time store &amp; channel insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="-mx-1 max-w-full overflow-x-auto px-1">
            <div className="flex w-max items-center gap-1 rounded-full border border-black/[0.06] bg-white p-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Period</span>
              {(['all', 'today', 'week', 'month', 'year', 'custom'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                    period === p ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {p === 'all' ? 'All Time' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : p}
                </button>
              ))}
            </div>
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">From</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-black/[0.09] px-2 py-1 text-xs outline-none focus:border-neutral-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">To</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-black/[0.09] px-2 py-1 text-xs outline-none focus:border-neutral-400" />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-black/[0.06]">
        {(['revenue', 'today', 'products', 'coupons'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              tab === t ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            {t === 'today' ? "Today's Sales" : t}
          </button>
        ))}
      </div>

      {tab === 'revenue' && <RevenueTab view={view} periodOrders={periodOrders} channel={channel} setChannel={setChannel} />}
      {tab === 'today' && <TodayTab orders={orders} />}
      {tab === 'products' && <ProductsTab view={view} products={products} />}
      {tab === 'coupons' && <CouponsTab periodOrders={periodOrders} />}
    </div>
  );
}

/* ------------------------------- REVENUE ------------------------------- */

function RevenueTab({ view, periodOrders, channel, setChannel }: { view: Order[]; periodOrders: Order[]; channel: Channel; setChannel: (c: Channel) => void }) {
  const offline = periodOrders.filter((o) => o.source === 'offline');
  const online = periodOrders.filter((o) => o.source === 'online');
  const sum = (a: Order[]) => a.reduce((s, o) => s + o.total, 0);
  const revenue = sum(view);
  const items = view.reduce((s, o) => s + itemsOf(o), 0);

  const topMap: Record<string, number> = {};
  view.forEach((o) => o.items.forEach((i) => (topMap[i.name] = (topMap[i.name] || 0) + i.qty)));
  const topProduct = Object.entries(topMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  const monthly = Array(12).fill(0) as number[];
  view.forEach((o) => { const d = new Date(o.date); if (d.getFullYear() === YEAR) monthly[d.getMonth()] += o.total; });
  const monthlyMax = Math.max(1, ...monthly);
  const yearTotal = monthly.reduce((a, b) => a + b, 0);

  const revMap: Record<string, number> = {};
  view.forEach((o) => o.items.forEach((i) => (revMap[i.name] = (revMap[i.name] || 0) + i.price * i.qty)));
  const topItems = Object.entries(revMap).map(([name, rev]) => ({ name, rev })).sort((a, b) => b.rev - a.rev).slice(0, 5);
  const topRevMax = Math.max(1, ...topItems.map((t) => t.rev));
  const srcTotal = Math.max(1, sum(offline) + sum(online));

  return (
    <div className="space-y-5">
      {/* channel switch */}
      <div className="flex items-center gap-1 rounded-xl bg-black/[0.04] p-1">
        {(['all', 'offline', 'online'] as Channel[]).map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${channel === c ? 'bg-neutral-900 text-white' : 'text-neutral-500'}`}
          >
            {c !== 'all' && <span className={`h-1.5 w-1.5 rounded-full ${c === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />}
            {c === 'all' ? 'All Channels' : c === 'offline' ? 'Offline (POS)' : 'Online (Razorpay)'}
          </button>
        ))}
      </div>

      {/* stat cards — REVENUE tab only */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total Revenue" value={inr(revenue)} sub="POS + online combined" tone="emerald" big />
        <Stat label="Completed Bills" value={String(view.length)} sub="in current view" tone="neutral" big />
        <Stat label="Offline Bills" value={inr(sum(offline))} sub={`${offline.length} walk-in`} tone="amber" big />
        <Stat label="Online Bills" value={inr(sum(online))} sub={`${online.length} Razorpay`} tone="emerald" big />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total Items Sold" value={`${items} pcs`} tone="neutral" />
        <Stat label="Avg Order Value" value={inr(view.length ? Math.round(revenue / view.length) : 0)} tone="neutral" />
        <Stat label="Top Product" value={topProduct} tone="neutral" clamp />
        <Stat label="Offline / Online" value={`${offline.length} / ${online.length}`} sub="bill count" tone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-sm font-bold text-neutral-900">Revenue Trend · {YEAR}</p>
              <p className="mt-1 text-2xl font-extrabold text-neutral-900">{inr(yearTotal)}</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">Avg {inr(Math.round(yearTotal / 12))}/mo</span>
          </div>
          <div className="flex h-48 items-end gap-1.5">
            {monthly.map((v, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-2">
                <div className="relative w-full">
                  <div className="w-full rounded-t bg-neutral-900 transition-all group-hover:bg-neutral-700" style={{ height: `${Math.max(2, (v / monthlyMax) * 160)}px` }} />
                  {v > 0 && <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-neutral-500 opacity-0 group-hover:opacity-100">{inr(v)}</span>}
                </div>
                <span className="text-[9px] font-medium uppercase text-neutral-400">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <p className="mb-4 text-sm font-bold text-neutral-900">Order Source</p>
            <SrcBar label="Offline" count={offline.length} value={sum(offline)} pct={(sum(offline) / srcTotal) * 100} color="bg-amber-500" />
            <SrcBar label="Online" count={online.length} value={sum(online)} pct={(sum(online) / srcTotal) * 100} color="bg-emerald-500" />
          </Card>
          <Card className="p-5">
            <p className="mb-4 text-sm font-bold text-neutral-900">Top Items by Revenue</p>
            <div className="space-y-3">
              {topItems.map((t, i) => (
                <div key={t.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700">{i + 1}. {t.name}</span>
                    <span className="font-bold text-neutral-900">{inr(t.rev)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]"><div className="h-full rounded-full bg-neutral-900" style={{ width: `${(t.rev / topRevMax) * 100}%` }} /></div>
                </div>
              ))}
              {topItems.length === 0 && <p className="text-xs text-neutral-400">No sales in this view.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- TODAY ------------------------------- */

function TodayTab({ orders }: { orders: Order[] }) {
  const [q, setQ] = useState('');
  const today = orders.filter((o) => new Date(o.date).toDateString() === new Date().toDateString());
  const rev = today.reduce((s, o) => s + o.total, 0);
  const items = today.reduce((s, o) => s + itemsOf(o), 0);
  const rows = today.filter((o) => !q || o.phone.includes(q) || o.id.toLowerCase().includes(q.toLowerCase()));
  const off = today.filter((o) => o.source === 'offline');
  const on = today.filter((o) => o.source === 'online');
  const tot = Math.max(1, rev);

  const map: Record<string, number> = {};
  today.forEach((o) => o.items.forEach((i) => (map[i.name] = (map[i.name] || 0) + i.qty)));
  const tops = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Today's Revenue" value={inr(rev)} sub="Completed today" tone="emerald" big />
        <Stat label="Today's Bills" value={String(today.length)} sub="Completed today" tone="neutral" big />
        <Stat label="Today's Items Sold" value={`${items} pcs`} sub="Quantity sold today" tone="neutral" big />
        <Stat label="Today's Avg Order Value" value={inr(today.length ? Math.round(rev / today.length) : 0)} sub="Per invoice today" tone="amber" big />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-neutral-900">Today's Transactions</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contact no…" className="w-52 rounded-lg border border-black/[0.09] bg-white py-2 pl-9 pr-3 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-400" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="px-3 py-2.5">Invoice ID</th>
                  <th className="px-3 py-2.5">Customer No</th>
                  <th className="px-3 py-2.5">Source</th>
                  <th className="px-3 py-2.5 text-center">Items</th>
                  <th className="px-3 py-2.5 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-t border-black/[0.05]">
                    <td className="px-3 py-3 text-sm font-bold text-neutral-900">{o.id}</td>
                    <td className="px-3 py-3 text-sm text-neutral-600">{o.phone || '—'}</td>
                    <td className="px-3 py-3"><SrcTag s={o.source} /></td>
                    <td className="px-3 py-3 text-center text-sm text-neutral-700">{itemsOf(o)}</td>
                    <td className="px-3 py-3 text-right text-sm font-bold text-neutral-900">{inr(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="py-12 text-center text-sm italic text-neutral-400">No transactions found for today.</p>}
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <p className="mb-4 text-sm font-bold text-neutral-900">Today's Channel Split</p>
            {today.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">No sales today.</p>
            ) : (
              <>
                <SrcBar label="Offline" count={off.length} value={off.reduce((s, o) => s + o.total, 0)} pct={(off.reduce((s, o) => s + o.total, 0) / tot) * 100} color="bg-amber-500" />
                <SrcBar label="Online" count={on.length} value={on.reduce((s, o) => s + o.total, 0)} pct={(on.reduce((s, o) => s + o.total, 0) / tot) * 100} color="bg-emerald-500" />
              </>
            )}
          </Card>
          <Card className="p-5">
            <p className="mb-4 text-sm font-bold text-neutral-900">Today's Top Items</p>
            {tops.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">No items sold today.</p>
            ) : (
              <div className="space-y-2.5">
                {tops.map(([name, qty], i) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-700">{i + 1}. {name}</span>
                    <span className="font-bold text-neutral-900">{qty} pcs</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ PRODUCTS ----------------------------- */

function ProductsTab({ view, products }: { view: Order[]; products: { id: string; name: string; category: string; stock: number }[] }) {
  const [q, setQ] = useState('');
  const map: Record<string, { qty: number; rev: number }> = {};
  view.forEach((o) => o.items.forEach((i) => {
    map[i.name] = map[i.name] || { qty: 0, rev: 0 };
    map[i.name].qty += i.qty;
    map[i.name].rev += i.price * i.qty;
  }));
  const rows = products
    .map((p) => ({ ...p, ...(map[p.name] || { qty: 0, rev: 0 }) }))
    .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.rev - a.rev);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <p className="text-sm font-bold text-neutral-900">Product Performance</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product…" className="w-52 rounded-lg border border-black/[0.09] bg-white py-2 pl-9 pr-3 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-400" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <th className="px-5 py-3">Product</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3 text-center">Units Sold</th>
              <th className="px-3 py-3">Revenue</th>
              <th className="px-3 py-3 text-center">In Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-black/[0.05]">
                <td className="px-5 py-3.5 text-sm font-semibold text-neutral-900">{p.name}</td>
                <td className="px-3 py-3.5 text-sm text-neutral-500">{p.category}</td>
                <td className="px-3 py-3.5 text-center text-sm font-bold text-neutral-800">{p.qty}</td>
                <td className="px-3 py-3.5 text-sm font-bold text-neutral-900">{inr(p.rev)}</td>
                <td className="px-3 py-3.5 text-center text-sm text-neutral-600">{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ------------------------------ COUPONS ------------------------------ */

function CouponsTab({ periodOrders }: { periodOrders: Order[] }) {
  const [q, setQ] = useState('');
  const discounted = periodOrders.filter((o) => o.discount > 0);
  const total = discounted.reduce((s, o) => s + o.discount, 0);
  const avg = discounted.length ? Math.round(total / discounted.length) : 0;
  const rows = discounted.filter((o) => !q || o.id.toLowerCase().includes(q.toLowerCase()) || o.phone.includes(q) || String(o.discount).includes(q));

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
      <Card className="p-5 sm:p-6">
        <p className="mb-4 font-bold text-neutral-900">Discount Summary</p>
        <div className="space-y-3">
          <MiniStat label="Total Discounts Given" value={inr(total)} strong />
          <MiniStat label="Discounted Orders" value={String(discounted.length)} />
          <MiniStat label="Avg Discount Per Order" value={inr(avg)} />
        </div>
      </Card>
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold text-neutral-900">Promo Campaign Performance</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code/mobile/amount…" className="w-60 rounded-lg border border-black/[0.09] bg-white py-2 pl-9 pr-3 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-3 py-3">Customer Mobile</th>
                <th className="px-3 py-3">Coupon</th>
                <th className="px-3 py-3 text-right">Order Total</th>
                <th className="px-3 py-3 text-right">Discount Applied</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-black/[0.05]">
                  <td className="px-4 py-3.5 text-sm font-bold text-neutral-900">{o.id}</td>
                  <td className="px-3 py-3.5 text-sm text-neutral-600">{o.phone || '—'}</td>
                  <td className="px-3 py-3.5 text-sm text-neutral-500">{o.couponCode ?? 'Manual'}</td>
                  <td className="px-3 py-3.5 text-right text-sm font-semibold text-neutral-800">{inr(o.total)}</td>
                  <td className="px-3 py-3.5 text-right text-sm font-bold text-emerald-600">- {inr(o.discount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="py-12 text-center text-sm italic text-neutral-400">No discounted orders in this period.</p>}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------ shared ------------------------------- */

const TONES: Record<string, string> = { neutral: 'text-neutral-900', amber: 'text-amber-600', emerald: 'text-emerald-600' };
function Stat({ label, value, sub, tone, big, clamp }: { label: string; value: string; sub?: string; tone: keyof typeof TONES; big?: boolean; clamp?: boolean }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500 sm:text-[11px]">{label}</p>
      <p className={`font-extrabold tabular-nums ${big ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} ${TONES[tone]} ${clamp ? 'truncate' : ''}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-neutral-400">{sub}</p>}
    </Card>
  );
}
function MiniStat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-[#faf9f6] p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</p>
      <p className={`mt-1 font-extrabold ${strong ? 'text-2xl text-neutral-900' : 'text-xl text-neutral-800'}`}>{value}</p>
    </div>
  );
}
function SrcBar({ label, count, value, pct, color }: { label: string; count: number; value: number; pct: number; color: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-wide text-neutral-600">{label} <span className="text-neutral-400">· {count}</span></span>
        <span className="font-bold text-neutral-900">{inr(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.05]"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
    </div>
  );
}
function SrcTag({ s }: { s: Source }) {
  return <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${s === 'online' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{s}</span>;
}
