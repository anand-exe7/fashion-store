'use client';
import { Search, User, ShoppingCart } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

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
    <motion.nav 
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: "-100%", opacity: 0 }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`fixed top-0 w-full z-50 flex items-center justify-between px-6 md:px-12 py-5 transition-colors duration-500 ${
        isScrolled ? 'bg-black/80 backdrop-blur-md text-white shadow-xl' : 'bg-transparent text-white mix-blend-difference'
      }`}
    >
      <div className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform group">
        <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm group-hover:rotate-180 transition-transform duration-700">*</div>
        <span className="font-bold tracking-widest text-xl">ECOM</span>
      </div>
      
      <div className="hidden lg:flex items-center gap-10 text-[11px] font-bold tracking-[0.15em] uppercase">
        {['Men', 'Women', 'Kids', 'Accessories', 'Footwear'].map(item => (
          <a key={item} href="#" className="relative py-2 overflow-hidden group">
            <span className="relative z-10 group-hover:-translate-y-full inline-block transition-transform duration-300">{item}</span>
            <span className="absolute left-0 z-10 translate-y-full group-hover:translate-y-0 inline-block transition-transform duration-300">{item}</span>
          </a>
        ))}
        <a href="#" className="text-red-400 relative py-2 overflow-hidden group">
            <span className="relative z-10 group-hover:-translate-y-full inline-block transition-transform duration-300">Sale</span>
            <span className="absolute left-0 z-10 translate-y-full group-hover:translate-y-0 inline-block transition-transform duration-300">Sale</span>
        </a>
      </div>

      <div className="flex items-center gap-6">
        <Search className="w-5 h-5 cursor-pointer hover:opacity-70 transition-opacity hover:scale-110" strokeWidth={1.5} />
        <User className="w-5 h-5 cursor-pointer hover:opacity-70 transition-opacity hover:scale-110" strokeWidth={1.5} />
        <div className="relative cursor-pointer group">
          <ShoppingCart className="w-5 h-5 group-hover:opacity-70 transition-opacity group-hover:scale-110" strokeWidth={1.5} />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">2</span>
        </div>
        <div className="hidden md:flex items-center gap-1 cursor-pointer hover:opacity-70 text-[11px] font-bold tracking-widest uppercase">
          <span>EN / USD</span>
        </div>
      </div>
    </motion.nav>
  );
};
