'use client';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Search,
  X,
  ArrowLeft,
  MessageCircle,
  Phone,
  MapPin,
} from 'lucide-react';
import { NAV, REQUESTS, inr, type OrderRequest, type Status } from './data';

const BRAND = 'SHALISTONE';
type Range = 'all' | 'today' | 'week' | 'month' | 'custom';

const STATUS_STYLE: Record<Status, string> = {
  pending: 'text-amber-700 bg-amber-50 border-amber-300',
  contacted: 'text-blue-700 bg-blue-50 border-blue-300',
  completed: 'text-emerald-700 bg-emerald-50 border-emerald-300',
};

function inRange(iso: string, range: Range): boolean {
  if (range === 'all' || range === 'custom') return true;
  const d = new Date(iso);
  const now = new Date();
  const diffDays = (now.getTime() - d.getTime()) / 86400000;
  if (range === 'today') return d.toDateString() === now.toDateString();
  if (range === 'week') return diffDays >= 0 && diffDays <= 7;
  if (range === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  return true;
}

export default function AdminDashboard() {
  const [active, setActive] = useState('whatsapp');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [range, setRange] = useState<Range>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [requests, setRequests] = useState<OrderRequest[]>(REQUESTS);
  const [refreshing, setRefreshing] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const rangeFiltered = useMemo(() => requests.filter((r) => inRange(r.date, range)), [requests, range]);

  const stats = useMemo(() => {
    const s = { total: rangeFiltered.length, pending: 0, contacted: 0, completed: 0, value: 0 };
    rangeFiltered.forEach((r) => {
      s[r.status] += 1;
      s.value += r.total;
    });
    return s;
  }, [rangeFiltered]);

  const tableList = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rangeFiltered.filter(
      (r) => !q || r.id.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q) || r.phone.includes(q),
    );
    return [...list].sort((a, b) =>
      sort === 'newest'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [rangeFiltered, query, sort]);

  const setStatus = (id: string, status: Status) =>
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 650);
  };

  const detail = requests.find((r) => r.id === detailId) || null;
  const activeNav = NAV.find((n) => n.key === active);

  return (
    <div className="flex min-h-screen w-full bg-[#f4f2ec] text-neutral-900">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-y-auto border-r border-black/[0.06] bg-white transition-all duration-300 lg:static lg:z-auto lg:translate-x-0 ${
          collapsed ? 'lg:w-[80px]' : 'lg:w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo row */}
        <div
          className={`flex h-[73px] shrink-0 items-center gap-2.5 border-b border-black/[0.06] px-4 lg:px-5 ${
            collapsed ? 'lg:justify-center lg:px-0' : ''
          }`}
        >
          <button
            onClick={() => collapsed && setCollapsed(false)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neutral-900 text-white"
            aria-label={collapsed ? 'Expand sidebar' : 'Shalistone'}
          >
            <Store className="h-[18px] w-[18px]" />
          </button>
          <span className={`flex items-baseline gap-1.5 overflow-hidden ${collapsed ? 'lg:hidden' : ''}`}>
            <span className="font-black tracking-[0.12em] text-neutral-900" style={{ fontFamily: "'Arial Black', sans-serif" }}>
              {BRAND}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Admin</span>
          </span>
          {/* desktop collapse toggle (only when expanded) */}
          <button
            onClick={() => setCollapsed(true)}
            className={`ml-auto hidden h-7 w-7 place-items-center rounded-md text-neutral-400 hover:bg-black/[0.04] hover:text-neutral-700 lg:grid ${
              collapsed ? 'lg:hidden' : ''
            }`}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {/* mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto grid h-8 w-8 place-items-center rounded-md text-neutral-400 hover:bg-black/[0.04] hover:text-neutral-700 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const on = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActive(item.key);
                  setMobileOpen(false);
                }}
                title={item.label}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
                  on ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:bg-black/[0.04] hover:text-neutral-900'
                } ${collapsed ? 'lg:justify-center' : ''}`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-[73px] shrink-0 items-center justify-between border-b border-black/[0.06] bg-[#f4f2ec]/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-black/[0.06] bg-white text-neutral-700 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-neutral-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="/" className="flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">View Store</span>
            </a>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-900 text-sm font-bold text-white">A</span>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6">
          {active === 'whatsapp' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5 md:rounded-3xl md:p-7"
            >
              {/* Header row */}
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">WhatsApp Center</h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">{stats.pending} pending</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="-mx-1 max-w-full overflow-x-auto px-1">
                    <div className="flex w-max items-center rounded-xl bg-black/[0.04] p-1">
                      {(['all', 'today', 'week', 'month', 'custom'] as Range[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRange(r)}
                          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                            range === r ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={refresh}
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-xs font-bold text-neutral-600 transition-colors hover:bg-black/[0.03]"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Stat cards */}
              <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                <StatCard label="Total Requests" value={stats.total} tone="neutral" />
                <StatCard label="Pending" value={stats.pending} tone="amber" />
                <StatCard label="Contacted" value={stats.contacted} tone="blue" />
                <StatCard label="Completed" value={stats.completed} tone="emerald" />
              </div>

              {/* Requests panel */}
              <div className="rounded-2xl border border-black/[0.06]">
                <div className="flex flex-col gap-3 border-b border-black/[0.06] p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">Customer Requests</p>
                      <p className="text-[11px] text-neutral-400">{inr(stats.value)} est. value · status updates only</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-0 flex-1 sm:flex-none">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search requests…"
                        className="w-full rounded-lg border border-black/[0.08] bg-white py-2 pl-9 pr-3 text-xs text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-neutral-400 sm:w-56"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
                        className="appearance-none rounded-lg border border-black/[0.08] bg-white py-2 pl-3 pr-8 text-xs font-medium text-neutral-700 outline-none focus:border-neutral-400"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                    </div>
                    <span className="ml-auto text-xs font-medium text-neutral-400 sm:ml-0">{tableList.length} requests</span>
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[900px] text-left">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        <th className="px-5 py-3">Ord ID</th>
                        <th className="px-3 py-3">Customer</th>
                        <th className="px-3 py-3">Phone</th>
                        <th className="px-3 py-3">Address</th>
                        <th className="px-3 py-3 text-center">Products</th>
                        <th className="px-3 py-3">Est. Total</th>
                        <th className="px-3 py-3">Date &amp; Time</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableList.map((r) => (
                        <tr key={r.id} className="border-t border-black/[0.05] hover:bg-black/[0.015]">
                          <td className="px-5 py-4 text-sm font-medium text-neutral-500">{r.id}</td>
                          <td className="px-3 py-4 text-sm font-bold text-neutral-900">{r.customer}</td>
                          <td className="px-3 py-4 text-sm text-neutral-600">{r.phone}</td>
                          <td className="max-w-[160px] truncate px-3 py-4 text-sm text-neutral-500">{r.addressShort}</td>
                          <td className="px-3 py-4 text-center">
                            <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                              {r.products.length}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm font-bold text-neutral-900">{inr(r.total)}</td>
                          <td className="px-3 py-4">
                            <p className="text-sm text-neutral-700">{r.dateLabel}</p>
                            <p className="text-[11px] text-neutral-400">{r.timeLabel}</p>
                          </td>
                          <td className="px-3 py-4">
                            <StatusSelect value={r.status} onChange={(s) => setStatus(r.id, s)} />
                          </td>
                          <td className="px-3 py-4 text-right">
                            <button onClick={() => setDetailId(r.id)} className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline">
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                      {tableList.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-5 py-16 text-center text-sm text-neutral-400">
                            No requests match your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / tablet cards */}
                <div className="space-y-3 p-3 lg:hidden">
                  {tableList.map((r) => (
                    <div key={r.id} className="rounded-xl border border-black/[0.07] bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-neutral-400">{r.id}</p>
                          <p className="truncate text-sm font-bold text-neutral-900">{r.customer}</p>
                        </div>
                        <StatusSelect value={r.status} onChange={(s) => setStatus(r.id, s)} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                        <Cell label="Phone" value={r.phone} />
                        <Cell label="Est. Total" value={inr(r.total)} strong />
                        <Cell label="Products" value={`${r.products.length} item${r.products.length > 1 ? 's' : ''}`} />
                        <Cell label="Date" value={`${r.dateLabel} · ${r.timeLabel}`} />
                        <div className="col-span-2">
                          <Cell label="Address" value={r.addressShort} />
                        </div>
                      </div>
                      <button
                        onClick={() => setDetailId(r.id)}
                        className="mt-4 w-full rounded-lg bg-neutral-900 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-neutral-800"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                  {tableList.length === 0 && (
                    <p className="py-14 text-center text-sm text-neutral-400">No requests match your filters.</p>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <Placeholder title={activeNav?.label ?? ''} Icon={activeNav?.icon} />
          )}
        </main>

        {/* Footer */}
        <footer className="flex flex-col items-center gap-2 border-t border-black/[0.06] px-6 py-5 text-center text-[11px] tracking-wide text-neutral-400 md:flex-row md:justify-between">
          <span className="font-medium uppercase">© 2026 All Rights Reserved. {BRAND}.</span>
          <span className="font-semibold uppercase tracking-widest">
            Powered by <span className="text-neutral-600">Cenexa Systems</span> ©2026
          </span>
          <span className="font-bold italic text-neutral-500">• Premium Wardrobe Experiences.</span>
        </footer>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailId(null)} />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-black/[0.06] bg-white shadow-2xl sm:rounded-3xl"
            >
              <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-black/[0.06] bg-white p-5 sm:p-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Request</p>
                  <p className="text-xl font-extrabold tracking-tight text-neutral-900">{detail.id}</p>
                </div>
                <span className={`rounded-md border px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[detail.status]}`}>{detail.status}</span>
                <button
                  onClick={() => setDetailId(null)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-400 hover:bg-black/[0.05] hover:text-neutral-800"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Customer" value={detail.customer} />
                  <Field label="Phone" value={detail.phone} icon={<Phone className="h-3.5 w-3.5" />} />
                  <div className="sm:col-span-2">
                    <Field label="Address" value={detail.addressFull} icon={<MapPin className="h-3.5 w-3.5" />} />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-neutral-400">Products ({detail.products.length})</p>
                  <div className="divide-y divide-black/[0.05] rounded-xl border border-black/[0.06]">
                    {detail.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="text-neutral-700">
                          {p.name} <span className="text-neutral-400">× {p.qty}</span>
                        </span>
                        <span className="font-semibold text-neutral-900">{inr(p.price * p.qty)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-bold text-neutral-900">Est. Total</span>
                      <span className="text-base font-extrabold text-neutral-900">{inr(detail.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <select
                      value={detail.status}
                      onChange={(e) => setStatus(detail.id, e.target.value as Status)}
                      className={`w-full appearance-none rounded-xl border px-3 py-2.5 text-sm font-bold capitalize outline-none ${STATUS_STYLE[detail.status]}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="completed">Completed</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
                  </div>
                  <a
                    href={`https://wa.me/91${detail.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- small building blocks ---------- */

function StatusSelect({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  return (
    <div className="relative inline-block shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Status)}
        className={`appearance-none rounded-md border py-1.5 pl-2.5 pr-7 text-xs font-bold capitalize outline-none ${STATUS_STYLE[value]}`}
      >
        <option value="pending">Pending</option>
        <option value="contacted">Contacted</option>
        <option value="completed">Completed</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-60" />
    </div>
  );
}

const TONE: Record<string, { card: string; value: string }> = {
  neutral: { card: 'bg-white border-black/[0.06]', value: 'text-blue-600' },
  amber: { card: 'bg-amber-50/70 border-amber-200/70', value: 'text-amber-600' },
  blue: { card: 'bg-blue-50/70 border-blue-200/70', value: 'text-blue-600' },
  emerald: { card: 'bg-emerald-50/70 border-emerald-200/70', value: 'text-emerald-600' },
};

function StatCard({ label, value, tone }: { label: string; value: number; tone: keyof typeof TONE }) {
  const t = TONE[tone];
  return (
    <div className={`rounded-2xl border p-4 text-center sm:p-5 ${t.card}`}>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500 sm:text-[11px] sm:tracking-[0.15em]">{label}</p>
      <p className={`text-3xl font-extrabold tabular-nums sm:text-4xl ${t.value}`}>{value}</p>
    </div>
  );
}

function Cell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className={`truncate text-sm ${strong ? 'font-bold text-neutral-900' : 'text-neutral-700'}`}>{value}</p>
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className="flex items-center gap-1.5 text-sm font-medium text-neutral-800">
        {icon && <span className="text-neutral-400">{icon}</span>}
        {value}
      </p>
    </div>
  );
}

function Placeholder({ title, Icon }: { title: string; Icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="grid min-h-[55vh] place-items-center rounded-2xl border border-dashed border-black/10 bg-white/60 md:rounded-3xl">
      <div className="flex flex-col items-center px-6 text-center">
        <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-neutral-900 text-white">
          {Icon && <Icon className="h-7 w-7" />}
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900">{title}</h2>
        <p className="mt-2 max-w-sm text-sm text-neutral-500">
          This module is on the way. The {title} workspace will live here — wired to the same data and styling as the WhatsApp Center.
        </p>
        <span className="mt-6 rounded-full bg-black/[0.05] px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-500">Coming soon</span>
      </div>
    </div>
  );
}
