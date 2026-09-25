'use client';
import { useMemo, useState } from 'react';
import { Cake, Search, MessageCircle, Gift, ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
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

const pad = (n: number) => String(n).padStart(2, '0');
// A recurring birthday is identified by month-day only (year-agnostic), e.g.
// "10-05" for someone born on 5 October in any year.
const monthDayKey = (dob: string) => {
  const d = new Date(dob);
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// The next real calendar date this birthday will fall on (today if it's today,
// else this year or rolling into next year).
function nextBirthdayDate(dob: string): Date {
  const d = new Date(dob);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (next.getTime() < now.getTime()) next.setFullYear(now.getFullYear() + 1);
  return next;
}

function daysUntilBirthday(dob: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((nextBirthdayDate(dob).getTime() - now.getTime()) / 86400000);
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
    `Shop online at www.shalistone.com or visit us in store.\n` +
    `Follow us on Instagram 📸 @shalistone\nhttps://www.instagram.com/shalistone/\n\n` +
    `— Shalistone · Kids & Mens Fashion`;
  const base = c.phone.trim() ? `https://wa.me/91${c.phone.trim()}` : 'https://wa.me/';
  window.open(`${base}?text=${encodeURIComponent(msg)}`, '_blank');
}

// One-tap offers for the composer. The label is the chip; text fills the box.
const OFFER_PRESETS = [
  { label: '20% OFF', text: 'Flat 20% OFF — use code BDAY20 at checkout (valid 7 days).' },
  { label: 'Buy 1 Get 1', text: 'Buy 1 Get 1 FREE on your birthday week! 🎉 Visit us in store.' },
  { label: '₹500 OFF', text: '₹500 OFF on orders above ₹2,000 — use code BDAY500 (valid 7 days).' },
  { label: 'Free Gift', text: 'A free birthday gift with any purchase this week 🎁' },
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Grid of day-numbers for a month, padded with nulls so week 1 starts on the
// correct weekday and the last row is filled out.
function buildMonthCells(year: number, month: number): (number | null)[] {
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function Birthdays() {
  const { orders } = useAdminData();
  const [q, setQ] = useState('');
  const [offer, setOffer] = useState('Flat 20% OFF — use code BDAY20 at checkout (valid 7 days).');

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  // Selected calendar day as a month-day key ("10-05"), or null.
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // Upcoming-birthday date-range filter (real dates).
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const customers = useMemo(() => buildCustomers(orders), [orders]);
  const withDob = useMemo(() => customers.filter((c) => c.dob), [customers]);

  // month-day → customers born that day, for the calendar badges.
  const bdayMap = useMemo(() => {
    const m = new Map<string, Customer[]>();
    withDob.forEach((c) => {
      const k = monthDayKey(c.dob as string);
      m.set(k, [...(m.get(k) || []), c]);
    });
    return m;
  }, [withDob]);

  const next3 = useMemo(
    () =>
      withDob
        .filter((c) => daysUntilBirthday(c.dob as string) <= 3)
        .sort((a, b) => daysUntilBirthday(a.dob as string) - daysUntilBirthday(b.dob as string)),
    [withDob],
  );

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

  const hasRange = !!(fromDate && toDate);
  const rows = sorted.filter((c) => {
    if (q && !(c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q))) return false;
    if (selectedDay) {
      if (!c.dob || monthDayKey(c.dob) !== selectedDay) return false;
    }
    if (hasRange) {
      if (!c.dob) return false;
      const nb = nextBirthdayDate(c.dob);
      const f = new Date(fromDate); f.setHours(0, 0, 0, 0);
      const t = new Date(toDate); t.setHours(23, 59, 59, 999);
      if (nb < f || nb > t) return false;
    }
    return true;
  });

  const cells = buildMonthCells(calYear, calMonth);
  const shiftMonth = (delta: number) => {
    const d = new Date(calYear, calMonth + delta, 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };
  const isTodayCell = (day: number) =>
    calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();

  const selectedDayLabel = selectedDay
    ? new Date(2000, Number(selectedDay.slice(0, 2)) - 1, Number(selectedDay.slice(3))).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
      })
    : null;
  const filtersActive = !!selectedDay || hasRange;
  const clearFilters = () => {
    setSelectedDay(null);
    setFromDate('');
    setToDate('');
  };

  // Mirrors the actual WhatsApp message built in sendOffer(), with a sample
  // name, so the operator sees exactly what a customer receives.
  const previewMsg =
    `Hi Aarav! 🎂 Happy Birthday!\n\n` +
    `Here's a special treat from Shalistone:\n` +
    `🎁 ${offer.trim() || 'your birthday offer here'}\n\n` +
    `Shop online at www.shalistone.com or visit us in store.\n` +
    `Follow us on Instagram 📸 @shalistone\nhttps://www.instagram.com/shalistone/\n\n` +
    `— Shalistone · Kids & Mens Fashion`;

  // Year options for the calendar's year picker (a couple back, several ahead).
  const years: number[] = [];
  for (let y = today.getFullYear() - 2; y <= today.getFullYear() + 5; y++) years.push(y);
  const selectCls = 'rounded-lg border border-black/[0.1] bg-white px-2 py-1.5 text-sm font-bold text-neutral-800 outline-none focus:border-neutral-400';

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

      {/* Next 3 days — quick view */}
      {next3.length > 0 && (
        <Card className="border-pink-200/70 bg-pink-50/40 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Cake className="h-4 w-4 text-pink-500" />
            <p className="text-sm font-bold text-neutral-900">Birthdays in the next 3 days</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {next3.map((c, i) => {
              const cd = countdownLabel(c.dob as string);
              return (
                <div key={c.phone || c.name || i} className="flex items-center justify-between gap-2 rounded-xl border border-pink-200/60 bg-white p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">{c.name}</p>
                    <p className="text-[11px] text-neutral-500">
                      {fmtDayMonth(c.dob as string)} · <span className="font-bold text-pink-600">{cd.text}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => sendOffer(c, offer)}
                    disabled={!c.phone}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Offer
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Calendar + range filter */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Month calendar */}
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-neutral-500" />
              <select value={calMonth} onChange={(e) => setCalMonth(Number(e.target.value))} className={selectCls} aria-label="Month">
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <select value={calYear} onChange={(e) => setCalYear(Number(e.target.value))} className={selectCls} aria-label="Year">
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => shiftMonth(-1)} className="grid h-8 w-8 place-items-center rounded-lg border border-black/[0.08] text-neutral-500 hover:bg-black/[0.03]" aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); }}
                className="rounded-lg border border-black/[0.08] px-2.5 py-1.5 text-[11px] font-bold text-neutral-600 hover:bg-black/[0.03]"
              >
                Today
              </button>
              <button onClick={() => shiftMonth(1)} className="grid h-8 w-8 place-items-center rounded-lg border border-black/[0.08] text-neutral-500 hover:bg-black/[0.03]" aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center sm:gap-1">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className="pb-1 text-[9px] font-bold uppercase tracking-wide text-neutral-400 sm:text-[10px]">{d}</div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const key = `${pad(calMonth + 1)}-${pad(day)}`;
              const people = bdayMap.get(key);
              const has = !!people?.length;
              const isSel = selectedDay === key;
              return (
                <button
                  key={key}
                  disabled={!has}
                  onClick={() => setSelectedDay(isSel ? null : key)}
                  title={has ? people!.map((p) => p.name).join(', ') : undefined}
                  className={`relative flex h-8 items-center justify-center rounded-md text-[11px] transition-colors sm:h-9 sm:text-xs ${
                    isSel
                      ? 'bg-pink-500 font-bold text-white'
                      : has
                        ? 'bg-pink-50 font-semibold text-pink-700 hover:bg-pink-100'
                        : isTodayCell(day)
                          ? 'font-bold text-neutral-900 ring-1 ring-inset ring-neutral-300'
                          : 'text-neutral-500'
                  } ${has ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span>{day}</span>
                  {has && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 flex h-1.5 min-w-1.5 -translate-x-1/2 items-center justify-center rounded-full ${
                        people!.length > 1 ? 'px-1 text-[7px] font-bold leading-none' : ''
                      } ${isSel ? 'bg-white text-pink-600' : 'bg-pink-500 text-white'}`}
                    >
                      {people!.length > 1 ? people!.length : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-neutral-400 sm:text-[11px]">
            <span className="inline-block h-2 w-2 rounded-full bg-pink-500" /> Dot = day with a birthday · tap to filter the list.
          </p>
        </Card>

        {/* From–To range */}
        <Card className="p-4 sm:p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-neutral-900">
            <CalendarDays className="h-4 w-4 text-neutral-500" /> Filter by upcoming birthday
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-black/[0.09] bg-white px-2.5 py-2 text-xs outline-none focus:border-neutral-400"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">To</span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-black/[0.09] bg-white px-2.5 py-2 text-xs outline-none focus:border-neutral-400"
              />
            </label>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">Shows customers whose next birthday falls inside the chosen window.</p>
          {filtersActive && (
            <button
              onClick={clearFilters}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-black/[0.1] px-3 py-1.5 text-[11px] font-bold text-neutral-600 hover:bg-black/[0.03]"
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </Card>
      </div>

      {/* Offer message composer — full width */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-black/[0.06] bg-pink-50/60 px-4 py-3 sm:px-5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pink-100 text-pink-600">
            <Gift className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-neutral-900">Birthday Offer Message</p>
            <p className="text-[11px] text-neutral-500">Sent on WhatsApp when you tap “Send Offer”.</p>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="mx-auto max-w-xl space-y-4">
            {/* Quick presets */}
            <div className="flex flex-wrap justify-center gap-2">
              {OFFER_PRESETS.map((p) => {
                const active = offer.trim() === p.text;
                return (
                  <button
                    key={p.label}
                    onClick={() => setOffer(p.text)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                      active ? 'border-pink-500 bg-pink-500 text-white' : 'border-black/[0.1] text-neutral-600 hover:bg-black/[0.03]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <textarea
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-4 py-3 text-center text-base text-neutral-800 outline-none transition-colors focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              placeholder="e.g. Flat 20% OFF — use code BDAY20"
            />

            {/* Live WhatsApp preview */}
            <div>
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-400">Message Preview</p>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-center text-[15px] leading-relaxed text-neutral-800 sm:text-base">
                <span className="whitespace-pre-line">{previewMsg}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Search + active filter chips */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or phone…"
            className="w-full rounded-xl border border-black/[0.09] bg-white py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </div>
        {filtersActive && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedDay && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-[11px] font-bold text-pink-700">
                {selectedDayLabel}
                <button onClick={() => setSelectedDay(null)} aria-label="Clear day"><X className="h-3 w-3" /></button>
              </span>
            )}
            {hasRange && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-bold text-neutral-600">
                {new Date(fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                <button onClick={() => { setFromDate(''); setToDate(''); }} aria-label="Clear range"><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {customers.length === 0 ? (
        <Card><EmptyState message="No customers yet — completed bills will list their customers here." /></Card>
      ) : rows.length === 0 ? (
        <Card><EmptyState message="No customers match the current filters." /></Card>
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
