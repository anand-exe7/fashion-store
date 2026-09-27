'use client';
import { useEffect, useMemo, useState } from 'react';
import { IndianRupee, Receipt, Package, Users } from 'lucide-react';
import { fetchWholesaleOrders, type WholesaleOrder } from '@/lib/db';
import { Card, EmptyState } from '../ui';

const inr = (n: number) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso: string) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

export default function WholesaleAnalytics() {
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Wholesale Analytics</h2>
        <p className="text-xs text-neutral-500 sm:text-sm">Performance of the wholesale billing centre.</p>
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
          <p className="text-sm font-bold text-neutral-900">Recent Wholesale Bills</p>
        </div>
        {loading ? (
          <EmptyState message="Loading…" />
        ) : orders.length === 0 ? (
          <EmptyState message="No wholesale bills yet." />
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
