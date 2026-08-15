'use client';
import { Search, User, ShoppingCart, Menu } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export const Navbar = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setIsScrolled(latest > 50);
  });

  return (
    <motion.div 
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: "-100%", opacity: 0 }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-6 px-4 pointer-events-none"
    >
      <nav className={`pointer-events-auto flex items-center justify-between px-6 py-3 transition-all duration-500 rounded-full ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-xl text-black shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-black/5 w-[95%] md:w-[85%] lg:w-[70%]' 
          : 'bg-white/40 backdrop-blur-md text-neutral-900 shadow-sm border border-black/5 w-full md:w-[90%] lg:w-[80%]'
      }`}>
        <a href="/" className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform duration-500 bg-black text-white">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 22h20L12 2z" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-bold tracking-widest text-lg ml-1 hidden sm:block">APEX</span>
        </a>
        
        <div className="hidden lg:flex items-center gap-8 text-[11px] font-semibold tracking-[0.2em] uppercase">
          {['Collections', 'New Arrivals', 'Runway', 'Journal'].map(item => (
            <a key={item} href="/product" className="relative group px-2 py-1">
              <span className="relative z-10 transition-colors duration-300 group-hover:text-black text-neutral-500">{item}</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full bg-black"></span>
            </a>
          ))}
          <a href="/product" className="text-red-500 relative group px-2 py-1">
              <span className="relative z-10 transition-colors duration-300 group-hover:text-red-600">Sale</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-red-500 transition-all duration-300 group-hover:w-full"></span>
          </a>
        </div>

        <div className="flex items-center gap-5">
          <button className="transition-colors hover:scale-110 transform duration-300 hover:text-black text-neutral-500"><Search className="w-4 h-4" strokeWidth={2} /></button>
          <a href="/login" className="transition-colors hover:scale-110 transform duration-300 hidden sm:block hover:text-black text-neutral-500"><User className="w-4 h-4" strokeWidth={2} /></a>
          <a href="/cart" className="relative group transition-colors hover:scale-110 transform duration-300 block hover:text-black text-neutral-500">
            <ShoppingCart className="w-4 h-4" strokeWidth={2} />
            <span className="absolute -top-2 -right-2 text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full transition-colors bg-black text-white group-hover:bg-neutral-800">3</span>
          </a>
          <button className="lg:hidden transition-colors hover:scale-110 transform duration-300 ml-2 hover:text-black text-neutral-500">
            <Menu className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </nav>
    </motion.div>
  );
};
