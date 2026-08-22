'use client';
import { Search, ShoppingBag, Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { CartDrawer } from '../ui/CartDrawer';

const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Gifting', href: '/products' },
  { label: 'Accessories', href: '/products' },
  { label: 'Profile', href: '/profile' },
];

export const Navbar = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    // Don't auto-hide while a panel is open.
    setHidden(!searchOpen && !menuOpen && latest > previous && latest > 150);
    setIsScrolled(latest > 50);
  });

  // Focus the field when search opens; close panels on Escape.
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

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

  return (
    <>
    <motion.header
      variants={{ visible: { y: 0, opacity: 1 }, hidden: { y: '-120%', opacity: 0 } }}
      animate={hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-8 md:pt-6"
    >
      <nav
        className={`relative flex items-center justify-between rounded-full transition-all duration-500 ${
          isScrolled || searchOpen || menuOpen
            ? 'border border-white/50 bg-[#F5F2EB]/95 px-4 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.06)] md:px-6'
            : 'px-2 py-1'
        }`}
      >
        {/* Wordmark */}
        <a href="/" className="group flex items-center gap-2 pl-1 sm:pl-2">
          <span
            className="text-[15px] font-black tracking-[0.1em] text-neutral-900 transition-opacity group-hover:opacity-70 sm:text-lg sm:tracking-[0.18em]"
            style={{ fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif" }}
          >
            SHALISTONE
          </span>
        </a>

        {/* Center links */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 lg:flex">
          {LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group relative text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-700"
            >
              <span className="transition-colors group-hover:text-black">{item.label}</span>
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-black transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* Glass action pill */}
        <div className="flex items-center gap-1 rounded-full border border-white/60 bg-white/90 p-1 shadow-[0_6px_24px_rgba(0,0,0,0.06)] sm:gap-1.5 sm:p-1.5">
          <button
            type="button"
            onClick={toggleSearch}
            aria-label="Search"
            aria-expanded={searchOpen}
            className={`flex items-center gap-2 rounded-full px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors sm:px-3 ${
              searchOpen ? 'bg-black text-white' : 'text-neutral-700 hover:bg-white/70 hover:text-black'
            }`}
          >
            <Search className="h-4 w-4 sm:h-3.5 sm:w-3.5" strokeWidth={2.2} />
            <span className="hidden sm:inline">Search</span>
          </button>
          
          <span className="hidden h-4 w-px bg-neutral-400/50 sm:block" />
          
          <a
            href="/profile"
            aria-label="Profile"
            className="flex items-center gap-2 rounded-full px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-700 transition-colors hover:bg-white/70 hover:text-black sm:px-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-3.5 sm:w-3.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="hidden sm:inline">Profile</span>
          </a>

          <button
            onClick={() => setCartOpen(true)}
            aria-label="Cart"
            className="relative flex items-center gap-2 rounded-full bg-black px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-transform hover:scale-[1.03] sm:px-4"
          >
            <ShoppingBag className="h-4 w-4 sm:h-3.5 sm:w-3.5" strokeWidth={2.2} />
            <span className="hidden sm:inline">Cart</span>
          </button>
          <button
            type="button"
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="grid h-8 w-8 place-items-center rounded-full text-neutral-700 hover:text-black lg:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" strokeWidth={2.2} /> : <Menu className="h-4 w-4" strokeWidth={2.2} />}
          </button>
        </div>
      </nav>

      {/* Expandable glass search panel */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mx-auto mt-3 max-w-3xl rounded-2xl border border-white/50 bg-white/95 p-2 shadow-[0_16px_50px_rgba(0,0,0,0.12)]"
          >
            <form
              action="/products"
              className="flex items-center gap-3 px-3"
              onSubmit={() => setSearchOpen(false)}
            >
              <Search className="h-4 w-4 shrink-0 text-neutral-500" strokeWidth={2.2} />
              <input
                ref={searchRef}
                name="q"
                type="text"
                placeholder="Search for pieces, collections…"
                className="w-full bg-transparent py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="grid h-7 w-7 place-items-center rounded-full text-neutral-500 hover:bg-black/5 hover:text-black"
              >
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable glass mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mx-auto mt-3 overflow-hidden rounded-2xl border border-white/50 bg-white/95 p-2 shadow-[0_16px_50px_rgba(0,0,0,0.12)] lg:hidden"
          >
            {LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.15em] text-neutral-700 transition-colors hover:bg-black/5 hover:text-black"
              >
                {item.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
      
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};
