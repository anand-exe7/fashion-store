'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Store, Menu, PanelLeft, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { NAV } from './data';
import Billing from './sections/Billing';
import Analytics from './sections/Analytics';
import Orders from './sections/Orders';
import Inventory from './sections/Inventory';
import Coupons from './sections/Coupons';
import Users from './sections/Users';

const BRAND = 'SHALISTONE';

export default function AdminDashboard() {
  const [active, setActive] = useState('billing');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="flex min-h-screen w-full bg-[#f4f2ec] text-neutral-800"
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
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-y-auto border-r border-black/[0.06] bg-white transition-all duration-300 lg:static lg:z-auto lg:translate-x-0 ${
          collapsed ? 'lg:w-[80px]' : 'lg:w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex h-[73px] shrink-0 items-center gap-2.5 border-b border-black/[0.06] px-4 lg:px-5 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neutral-900 text-white">
            <Store className="h-[18px] w-[18px]" />
          </span>
          <span className={`flex items-baseline gap-1.5 overflow-hidden ${collapsed ? 'lg:hidden' : ''}`}>
            <span className="font-extrabold tracking-[0.14em] text-neutral-900">{BRAND}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Admin</span>
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
          {NAV.map((item) => {
            const Icon = item.icon;
            const on = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActive(item.key); setMobileOpen(false); }}
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
            {/* desktop collapse/expand toggle — always visible so the sidebar can be reopened */}
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="hidden h-9 w-9 place-items-center rounded-lg border border-black/[0.06] bg-white text-neutral-700 hover:text-black lg:grid"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            {/* mobile drawer opener */}
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
            <a href="/" className="flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">View Store</span>
            </a>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-900 text-sm font-bold text-white">A</span>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6">
          {active === 'billing' && <Billing go={setActive} />}
          {active === 'analytics' && <Analytics />}
          {active === 'orders' && <Orders go={setActive} />}
          {active === 'inventory' && <Inventory />}
          {active === 'coupons' && <Coupons />}
          {active === 'users' && <Users />}
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
          <span className="font-bold italic text-neutral-500">• Premium Wardrobe Experiences.</span>
        </footer>
      </div>
    </div>
  );
}
