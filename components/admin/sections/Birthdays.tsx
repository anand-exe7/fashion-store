'use client';
import { useMemo, useState } from 'react';
import { Cake, Search, MessageCircle, Gift } from 'lucide-react';
import { useAdminData, inr, type Order } from '@/lib/store';
import { Card, EmptyState } from '../ui';

type Customer = {
  name: string;
  phone: string;
  dob: string | null;
  orders: number;
  spent: number;
  lastDate: string;
};

// One row per unique customer (keyed by phone, else name), rolled up from the
// completed orders in the store. DOB comes from whichever of their bills
// captured it.
function buildCustomers(orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();
  orders.forEach((o) => {
    if (o.status !== 'completed') return;
    const key = (o.phone || o.customer || '').trim().toLowerCase();
    if (!key) return;
    const c =
      map.get(key) ||
      { name: o.customer || 'Walk-in Customer', phone: o.phone || '', dob: null, orders: 0, spent: 0, lastDate: o.date };
    c.orders += 1;
    c.spent += o.total;
    if (o.dob) c.dob = o.dob;
    if (new Date(o.date) >= new Date(c.lastDate)) {
      c.lastDate = o.date;
      if (o.customer) c.name = o.customer;
    }
    map.set(key, c);
  });
  return [...map.values()];
}

function daysUntilBirthday(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (next.getTime() < now.getTime()) next.setFullYear(now.getFullYear() + 1);
  return Math.round((next.getTime() - now.getTime()) / 86400000);
}

function ageFrom(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a -= 1;
  return a;
}

const fmtDob = (dob: string) => new Date(dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDayMonth = (dob: string) => new Date(dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });

function countdownLabel(dob: string): { text: string; soon: boolean; today: boolean } {
  const d = daysUntilBirthday(dob);
  if (d === 0) return { text: 'Today 🎂', soon: true, today: true };
  if (d === 1) return { text: 'Tomorrow', soon: true, today: false };
  return { text: `in ${d} days`, soon: d <= 30, today: false };
}

function sendOffer(c: Customer, offer: string) {
  const first = (c.name || 'there').split(' ')[0];
  let greeting = `Hi ${first}!`;
  if (c.dob) {
    const d = daysUntilBirthday(c.dob);
    if (d === 0) greeting = `Hi ${first}! 🎂 Happy Birthday!`;
    else if (d <= 30) greeting = `Hi ${first}! 🎉 Your birthday is coming up on ${fmtDayMonth(c.dob)} —`;
  }
  const msg =
    `${greeting}\n\n` +
    `Here's a special treat from Shalistone:\n` +
    `🎁 ${offer}\n\n` +
    `Shop online at www.shalistone.com or visit us in store.\n\n` +
    `— Shalistone · Kids & Mens Fashion`;
  const base = c.phone.trim() ? `https://wa.me/91${c.phone.trim()}` : 'https://wa.me/';
  window.open(`${base}?text=${encodeURIComponent(msg)}`, '_blank');
}

export default function Birthdays() {
  const { orders } = useAdminData();
  const [q, setQ] = useState('');
  const [offer, setOffer] = useState('Flat 20% OFF — use code BDAY20 at checkout (valid 7 days).');

  const customers = useMemo(() => buildCustomers(orders), [orders]);
  const withDob = customers.filter((c) => c.dob);
  const upcomingCount = withDob.filter((c) => daysUntilBirthday(c.dob as string) <= 30).length;

  const sorted = useMemo(
    () =>
      [...customers].sort((a, b) => {
        if (a.dob && b.dob) return daysUntilBirthday(a.dob) - daysUntilBirthday(b.dob);
        if (a.dob) return -1;
        if (b.dob) return 1;
        return b.spent - a.spent;
      }),
    [customers],
  );
  const rows = sorted.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-pink-100 text-pink-600"><Cake className="h-5 w-5" /></span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Date of Birth</h2>
            <p className="text-sm text-neutral-500">Customer birthdays &amp; one-tap offer sender</p>
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 sm:p-5">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500 sm:text-[11px]">Customers</p>
          <p className="text-2xl font-extrabold text-neutral-900 sm:text-3xl">{customers.length}</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500 sm:text-[11px]">With Birthday</p>
          <p className="text-2xl font-extrabold text-neutral-900 sm:text-3xl">{withDob.length}</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500 sm:text-[11px]">Next 30 days</p>
          <p className="text-2xl font-extrabold text-pink-600 sm:text-3xl">{upcomingCount}</p>
        </Card>
      </div>

      {/* Offer message editor */}
      <Card className="p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-2">
          <Gift className="h-4 w-4 text-pink-500" />
          <p className="text-sm font-bold text-neutral-900">Birthday Offer Message</p>
        </div>
        <p className="mb-3 text-xs text-neutral-500">Edit the offer below, then tap “Send Offer” on any customer — it opens WhatsApp to their number with a ready birthday message.</p>
        <textarea
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-neutral-400"
          placeholder="e.g. Flat 20% OFF — use code BDAY20"
        />
      </Card>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or phone…"
          className="w-full rounded-xl border border-black/[0.09] bg-white py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
        />
      </div>

      {customers.length === 0 ? (
        <Card><EmptyState message="No customers yet — completed bills will list their customers here." /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-3 py-3">Mobile</th>
                  <th className="px-3 py-3">Date of Birth</th>
                  <th className="px-3 py-3 text-center">Age</th>
                  <th className="px-3 py-3">Next Birthday</th>
                  <th className="px-3 py-3 text-right">Spent</th>
                  <th className="px-3 py-3 text-right">Offer</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => {
                  const cd = c.dob ? countdownLabel(c.dob) : null;
                  return (
                    <tr key={c.phone || c.name || i} className="border-t border-black/[0.05] hover:bg-black/[0.015]">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-neutral-900">{c.name}</p>
                        <p className="text-[11px] text-neutral-400">{c.orders} order{c.orders === 1 ? '' : 's'}</p>
                      </td>
                      <td className="px-3 py-3.5 text-sm text-neutral-600">{c.phone || '—'}</td>
                      <td className="px-3 py-3.5 text-sm text-neutral-700">{c.dob ? fmtDob(c.dob) : <span className="text-neutral-300">—</span>}</td>
                      <td className="px-3 py-3.5 text-center text-sm text-neutral-700">{c.dob ? ageFrom(c.dob) : '—'}</td>
                      <td className="px-3 py-3.5">
                        {cd ? (
                          <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${cd.soon ? 'bg-pink-50 text-pink-600' : 'bg-neutral-100 text-neutral-500'}`}>{cd.text}</span>
                        ) : (
                          <span className="text-[11px] text-neutral-300">No date on file</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right text-sm font-bold text-neutral-900">{inr(c.spent)}</td>
                      <td className="px-3 py-3.5 text-right">
                        <button
                          onClick={() => sendOffer(c, offer)}
                          disabled={!c.phone}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Send Offer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </div>
  );
}
