'use client';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, PanelLeft, X, ArrowLeft } from 'lucide-react';
import { NAV, type Role } from './data';
import Billing from './sections/Billing';
import Analytics from './sections/Analytics';
import Orders from './sections/Orders';
import Inventory from './sections/Inventory';
import Categories from './sections/Categories';
import Coupons from './sections/Coupons';
import Birthdays from './sections/Birthdays';
import Delivery from './sections/Delivery';
import Users from './sections/Users';
import Reviews from './sections/Reviews';
import Reels from './sections/Reels';
import WholesaleBilling from './sections/WholesaleBilling';
import WholesaleInventory from './sections/WholesaleInventory';
import WholesaleAnalytics from './sections/WholesaleAnalytics';
import { Toast } from './ui';
import { currentToast, useAdminData } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';

const BRAND = 'SHALISTONE';

export default function AdminDashboard() {
  const [active, setActive] = useState('billing');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Until the profile loads, assume admin so nothing flashes hidden for the owner.
  const [role, setRole] = useState<Role>('admin');
  const { orders } = useAdminData();

  // Resolve the signed-in user's role so staff see a restricted sidebar.
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role === 'staff') setRole('staff');
    })();
  }, []);

  // Sections this role may see.
  const nav = useMemo(() => NAV.filter((item) => (item.roles ?? ['admin']).includes(role)), [role]);

  // Staff never land on the (hidden) billing tab — start them on Orders.
  useEffect(() => {
    if (!nav.some((n) => n.key === active)) setActive(nav[0]?.key ?? 'orders');
  }, [nav, active]);

  // New online orders awaiting packing (paid, not yet packed/shipped) — the alert.
  const newOnlineCount = useMemo(
    () =>
      orders.filter(
        (o) => o.source === 'online' && o.status === 'completed' && (o.fulfillmentStatus ?? 'pending') === 'pending',
      ).length,
    [orders],
  );

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-[#f4f2ec] text-neutral-800"
      style={{ fontFamily: 'var(--font-poppins), system-ui, sans-serif' }}
    >
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
        className={`no-scrollbar fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-y-auto border-r border-black/[0.06] bg-white transition-all duration-300 lg:static lg:z-auto lg:translate-x-0 ${
          collapsed ? 'lg:w-[80px]' : 'lg:w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex h-[73px] shrink-0 items-center gap-2.5 border-b border-black/[0.06] px-4 lg:px-5 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <img src="/logo.jpeg" alt="Shalistone" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
          <span className={`flex items-baseline gap-1.5 overflow-hidden ${collapsed ? 'lg:hidden' : ''}`}>
            <span className="font-extrabold tracking-[0.14em] text-neutral-900">{BRAND}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{role === 'staff' ? 'Staff' : 'Admin'}</span>
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto grid h-8 w-8 place-items-center rounded-md text-neutral-400 hover:bg-black/[0.04] hover:text-neutral-700 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const on = active === item.key;
            const showBadge = item.key === 'orders' && newOnlineCount > 0;
            return (
              <div key={item.key}>
                {item.group && !collapsed && (
                  <p className="mb-1 mt-3 px-3.5 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-300">{item.group}</p>
                )}
                <button
                  onClick={() => { setActive(item.key); setMobileOpen(false); }}
                  title={item.label}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
                    on ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:bg-black/[0.04] hover:text-neutral-900'
                  } ${collapsed ? 'lg:justify-center' : ''}`}
                >
                  <span className="relative">
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {showBadge && collapsed && (
                      <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />
                    )}
                  </span>
                  <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                  {showBadge && !collapsed && (
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-extrabold ${on ? 'bg-amber-400 text-amber-950' : 'bg-amber-400 text-amber-950'}`}>
                      {newOnlineCount}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="no-scrollbar flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-[73px] shrink-0 items-center justify-between border-b border-black/[0.06] bg-[#f4f2ec]/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="hidden h-9 w-9 place-items-center rounded-lg border border-black/[0.06] bg-white text-neutral-700 hover:text-black lg:grid"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-black/[0.06] bg-white text-neutral-700 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-neutral-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {newOnlineCount > 0 && (
              <button
                onClick={() => setActive('orders')}
                className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-200"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                {newOnlineCount} new online order{newOnlineCount === 1 ? '' : 's'}
              </button>
            )}
            <a href="/" className="flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">View Store</span>
            </a>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-900 text-sm font-bold text-white">{role === 'staff' ? 'S' : 'A'}</span>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6">
          {active === 'billing' && <Billing go={setActive} />}
          {active === 'analytics' && <Analytics />}
          {active === 'orders' && <Orders go={setActive} />}
          {active === 'inventory' && <Inventory />}
          {active === 'reviews' && <Reviews />}
          {active === 'categories' && <Categories />}
          {active === 'coupons' && <Coupons />}
          {active === 'birthdays' && <Birthdays />}
          {active === 'reels' && <Reels />}
          {active === 'delivery' && <Delivery />}
          {active === 'users' && <Users />}
          {active === 'ws-billing' && <WholesaleBilling />}
          {active === 'ws-inventory' && <WholesaleInventory />}
          {active === 'ws-analytics' && <WholesaleAnalytics />}
        </main>

        {/* Footer */}
        <footer className="flex flex-col items-center gap-2 border-t border-black/[0.06] px-6 py-5 text-center text-[11px] tracking-wide text-neutral-400 md:flex-row md:justify-between">
          <span className="font-medium uppercase">© 2026 All Rights Reserved. {BRAND}.</span>
          <span className="font-semibold uppercase tracking-widest">
            Powered by{' '}
            <a href="https://www.cenexasystems.com" target="_blank" rel="noreferrer" className="text-neutral-700 underline-offset-2 hover:underline">
              Cenexa Systems
            </a>{' '}
            ©2026
          </span>
          <span className="font-bold italic text-neutral-500">• Kids &amp; Mens Fashion.</span>
        </footer>
      </div>
      <Toast show={!!currentToast} message={currentToast || ''} />
    </div>
  );
}
