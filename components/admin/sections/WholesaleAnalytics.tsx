'use client';
import { useEffect, useMemo, useState } from 'react';
import { IndianRupee, Receipt, Package, Users } from 'lucide-react';
import { fetchWholesaleOrders, type WholesaleOrder } from '@/lib/db';
import { Card, EmptyState } from '../ui';

const inr = (n: number) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso: string) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

// Same period filter as the main POS Analytics screen.
type Period = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
const PERIODS: Period[] = ['all', 'today', 'week', 'month', 'year', 'custom'];

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
  if (from && d < new Date(from)) return false;
  if (to && d > new Date(to + 'T23:59:59')) return false;
  return true;
}

export default function WholesaleAnalytics() {
  const [allOrders, setOrders] = useState<WholesaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const orders = useMemo(
    () => allOrders.filter((o) => inPeriod(o.createdAt, period, from, to)),
    [allOrders, period, from, to],
  );

  useEffect(() => {
    fetchWholesaleOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const revenue = orders.reduce((a, o) => a + (o.total || 0), 0);
    const units = orders.reduce((a, o) => a + o.items.reduce((s, i) => s + (i.quantity || 0), 0), 0);
    const customers = new Set(orders.map((o) => (o.customerPhone || o.customerName || o.id).toLowerCase())).size;
    return { revenue, orders: orders.length, units, customers };
  }, [orders]);

  const cards = [
    { label: 'Total Revenue', value: inr(stats.revenue), Icon: IndianRupee },
    { label: 'Bills', value: String(stats.orders), Icon: Receipt },
    { label: 'Units Sold', value: String(stats.units), Icon: Package },
    { label: 'Customers', value: String(stats.customers), Icon: Users },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Wholesale Analytics</h2>
          <p className="text-xs text-neutral-500 sm:text-sm">Performance of the wholesale billing centre.</p>
        </div>
        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-black/[0.06] bg-white p-1 sm:rounded-full">
            <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Period</span>
            {PERIODS.map((p) => (
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
          {period === 'custom' && (
            <div className="flex w-full max-w-full flex-wrap items-center gap-2 rounded-2xl border border-black/[0.06] bg-white px-3 py-2 sm:w-auto sm:flex-nowrap sm:rounded-full sm:py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">From</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="min-w-0 flex-1 rounded border border-black/[0.09] px-2 py-1 text-xs outline-none focus:border-neutral-400 sm:w-[130px] sm:flex-none" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">To</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="min-w-0 flex-1 rounded border border-black/[0.09] px-2 py-1 text-xs outline-none focus:border-neutral-400 sm:w-[130px] sm:flex-none" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, Icon }) => (
          <Card key={label} className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-neutral-400">
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-neutral-900">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-black/[0.06] px-5 py-3.5">
          <p className="text-sm font-bold text-neutral-900">Wholesale Bills</p>
        </div>
        {loading ? (
          <EmptyState message="Loading…" />
        ) : orders.length === 0 ? (
          <EmptyState message={allOrders.length === 0 ? 'No wholesale bills yet.' : 'No wholesale bills in this period.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3 text-center">Items</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-black/[0.05] hover:bg-black/[0.01]">
                    <td className="px-5 py-3.5 text-sm font-bold text-neutral-900">{o.id}</td>
                    <td className="px-3 py-3.5 text-sm text-neutral-700">{o.customerName || '—'}</td>
                    <td className="px-3 py-3.5 text-sm text-neutral-500">{fmtDate(o.createdAt)}</td>
                    <td className="px-3 py-3.5 text-center text-sm text-neutral-700">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="px-3 py-3.5 text-right text-sm font-bold text-teal-600">{inr(o.total)}</td>
                    <td className="px-3 py-3.5 text-right">
                      <button onClick={() => window.open(`/invoice/${encodeURIComponent(o.id)}`, '_blank')} className="rounded-lg bg-sky-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-sky-600">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
