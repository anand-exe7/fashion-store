'use client';
import { Search, ShoppingBag, Menu, X, User, ArrowRight, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CartDrawer } from '../ui/CartDrawer';
import { createClient } from '@/lib/supabase/client';

const NAV_LINKS = [
  { label: 'Home', href: '/', subtitle: 'Return to flagship' },
  { label: 'Products', href: '/products', subtitle: 'Curated wardrobe & collections' },
  { label: 'New Arrivals', href: '/new-arrivals', subtitle: 'Latest limited silhouettes', isNew: true },
];

export const Navbar = () => {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  // Sync cart item count
  const syncCartCount = () => {
    try {
      const items = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    syncCartCount();
    const onCartEvent = () => syncCartCount();
    window.addEventListener('storage', onCartEvent);
    window.addEventListener('open-cart', onCartEvent);
    window.addEventListener('cart-updated', onCartEvent);
    return () => {
      window.removeEventListener('storage', onCartEvent);
      window.removeEventListener('open-cart', onCartEvent);
      window.removeEventListener('cart-updated', onCartEvent);
    };
  }, []);

  // Smooth scroll hide: only hide when scrolled deep and moving down fast
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    const diff = latest - previous;
    setIsScrolled(latest > 30);
    if (!searchOpen && !menuOpen) {
      if (latest > 200 && diff > 10) {
        setHidden(true);
      } else if (diff < -5 || latest <= 50) {
        setHidden(false);
      }
    }
  });

  // Determine whether the signed-in user is an admin (controls admin link visibility)
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (!cancelled) setIsAdmin(profile?.role === 'admin');
    }

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Focus search
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Keyboard shortcut for escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    const onOpenCart = () => setCartOpen(true);

    window.addEventListener('keydown', onKey);
    window.addEventListener('open-cart', onOpenCart);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-cart', onOpenCart);
    };
  }, []);

  const toggleSearch = () => {
    setMenuOpen(false);
    setSearchOpen((v) => !v);
  };

  const toggleMenu = () => {
    setSearchOpen(false);
    setMenuOpen((v) => !v);
  };

  const openCart = () => {
    setMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(true);
  };

  return (
    <>
      <motion.header
        variants={{ visible: { y: 0, opacity: 1 }, hidden: { y: '-120%', opacity: 0 } }}
        animate={hidden ? 'hidden' : 'visible'}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-2.5 sm:px-6 sm:pt-4"
      >
        <div className="max-w-7xl mx-auto">
          <nav
            className={`relative flex items-center justify-between rounded-full transition-all duration-300 ${
              isScrolled || searchOpen || menuOpen
                ? 'border border-black/10 bg-[#F5F2EB]/95 px-3 py-2 sm:px-5 sm:py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-md'
                : 'border border-black/[0.08] bg-[#F5F2EB]/90 px-3 py-2 sm:px-5 sm:py-2.5 shadow-xs backdrop-blur-sm'
            }`}
          >
            {/* Logo + Wordmark */}
            <a href="/" className="group flex items-center gap-2 pl-0.5 sm:pl-1 shrink-0">
              <img
                src="/logo.jpeg"
                alt="Shalistone"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-cover shadow-2xs group-hover:scale-105 transition-transform"
              />
              <span
                className="text-[13px] sm:text-base md:text-lg font-black tracking-[0.14em] sm:tracking-[0.18em] text-neutral-900 transition-opacity group-hover:opacity-75"
                style={{ fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif" }}
              >
                SHALISTONE
              </span>
            </a>

            {/* Center Desktop Links */}
            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
              {NAV_LINKS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="group relative flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-700 py-1"
                  >
                    <span className={`transition-colors ${isActive ? 'text-black font-bold' : 'group-hover:text-black'}`}>
                      {item.label}
                    </span>
                    {item.isNew && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <span className={`absolute -bottom-0.5 left-0 h-0.5 bg-black transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                  </a>
                );
              })}
            </div>

            {/* Desktop Action Controls */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-black/10 bg-white/95 p-1 shadow-xs">
              <button
                type="button"
                onClick={toggleSearch}
                aria-label="Search"
                aria-expanded={searchOpen}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors cursor-pointer ${
                  searchOpen ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                <Search className="h-3.5 w-3.5" strokeWidth={2.2} />
                <span>Search</span>
              </button>

              <span className="h-3.5 w-px bg-neutral-300" />

              <a
                href="/profile"
                aria-label="Profile"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-black"
              >
                <User className="h-3.5 w-3.5" strokeWidth={2.2} />
                <span>Profile</span>
              </a>

              <button
                onClick={openCart}
                aria-label="Cart"
                className="relative flex items-center gap-2 rounded-full bg-black px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-all hover:bg-neutral-800 cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.2} />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-white text-black text-[9px] font-black">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Action Controls (Clean, Compact & Non-Overflowing) */}
            <div className="flex lg:hidden items-center gap-1">
              {/* Mobile Quick Search Button */}
              <button
                type="button"
                onClick={toggleSearch}
                aria-label="Search"
                className={`grid h-8 w-8 place-items-center rounded-full text-neutral-700 hover:text-black transition-colors ${
                  searchOpen ? 'bg-black text-white' : 'hover:bg-black/5'
                }`}
              >
                <Search className="h-4 w-4" strokeWidth={2.2} />
              </button>

              {/* Mobile Cart Button */}
              <button
                type="button"
                onClick={openCart}
                aria-label="Shopping Cart"
                className="relative flex items-center justify-center h-8 px-2.5 rounded-full bg-black text-white hover:bg-neutral-800 transition-colors gap-1"
              >
                <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.2} />
                {cartCount > 0 && (
                  <span className="flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-white text-black text-[9px] font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Hamburger Toggle */}
              <button
                type="button"
                onClick={toggleMenu}
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={menuOpen}
                className="grid h-8 w-8 place-items-center rounded-full text-neutral-800 hover:bg-black/5 transition-colors cursor-pointer"
              >
                {menuOpen ? <X className="h-4 w-4" strokeWidth={2.2} /> : <Menu className="h-4 w-4" strokeWidth={2.2} />}
              </button>
            </div>
          </nav>

          {/* Expandable Search Bar Panel */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mt-2.5 overflow-hidden rounded-2xl border border-black/10 bg-white/95 p-2 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md"
              >
                <form
                  action="/products"
                  className="flex items-center gap-2.5 px-3"
                  onSubmit={() => setSearchOpen(false)}
                >
                  <Search className="h-4 w-4 shrink-0 text-neutral-400" strokeWidth={2.2} />
                  <input
                    ref={searchRef}
                    name="search"
                    type="text"
                    placeholder="Search collections, shirts, pants, hoodies..."
                    className="w-full bg-transparent py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    aria-label="Close search"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-neutral-400 hover:bg-black/5 hover:text-black"
                  >
                    <X className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Full Luxury Mobile Menu Drawer with Backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
            />

            {/* Mobile Drawer Content */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-3 top-16 z-50 rounded-3xl border border-black/10 bg-[#F5F2EB] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)] lg:hidden max-h-[85vh] overflow-y-auto"
            >
              {/* Quick Search inside Drawer */}
              <form
                action="/products"
                onSubmit={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-full border border-black/10 bg-white px-4 py-2.5 shadow-2xs mb-5"
              >
                <Search className="h-4 w-4 shrink-0 text-neutral-400" strokeWidth={2.2} />
                <input
                  ref={mobileSearchRef}
                  name="search"
                  type="text"
                  placeholder="Search pieces, styles, drops..."
                  className="w-full bg-transparent text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="grid h-6 w-6 place-items-center rounded-full bg-black text-white shrink-0"
                >
                  <ArrowRight className="h-3 w-3" />
                </button>
              </form>

              {/* Main Navigation Links */}
              <div className="space-y-1 mb-6">
                <span className="block px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-2">
                  Navigation
                </span>
                {NAV_LINKS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 transition-colors ${
                        isActive ? 'bg-black text-white' : 'hover:bg-black/5 text-neutral-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold uppercase tracking-wider">
                            {item.label}
                          </span>
                          {item.isNew && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-wider">
                              New
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] mt-0.5 ${isActive ? 'text-white/70' : 'text-neutral-500'}`}>
                          {item.subtitle}
                        </p>
                      </div>
                      <ChevronRight className={`h-4 w-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                    </a>
                  );
                })}
              </div>

              {/* Quick Actions (Cart, Profile, Admin) */}
              <div className="pt-4 border-t border-black/10 space-y-2 mb-6">
                <span className="block px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-2">
                  Account & Bag
                </span>

                <button
                  type="button"
                  onClick={openCart}
                  className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 bg-white border border-black/5 hover:border-black/15 transition-all text-neutral-800 text-xs font-semibold uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="h-4 w-4 text-black" />
                    <span>View Shopping Bag</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                    {cartCount} {cartCount === 1 ? 'item' : 'items'}
                  </span>
                </button>

                <a
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-2.5 bg-white border border-black/5 hover:border-black/15 transition-all text-neutral-800 text-xs font-semibold uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="h-4 w-4 text-neutral-700" />
                    <span>My Profile & Orders</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </a>

                {isAdmin && (
                  <a
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-2.5 bg-neutral-900 text-white transition-all text-xs font-semibold uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="h-4 w-4 text-neutral-300" />
                      <span>Store Admin Portal</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/70" />
                  </a>
                )}
              </div>

              {/* Studio Info Footer in Drawer */}
              <div className="rounded-2xl bg-black/[0.04] p-4 text-neutral-500 text-[11px] leading-relaxed">
                <p className="font-bold text-neutral-800 uppercase tracking-wider mb-1">
                  Shalistone Bengaluru
                </p>
                <p>No.69.1/2, 1st Fl, Ramachandrapuram · Mon–Sat 10AM–7PM</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

