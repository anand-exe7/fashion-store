'use client';
import { motion } from 'framer-motion';
import { RevealText } from '../ui/RevealText';

export const ShoppableLook = () => {
  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full relative overflow-hidden">
      {/* Huge Faded Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-[0.03]">
        <span className="text-[35vw] font-serif italic text-black tracking-tighter whitespace-nowrap">
          Essence
        </span>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-24 w-full">
        {/* Left Side: Minimalist Block */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full md:w-[35%] aspect-[4/5] bg-neutral-100 flex flex-col relative shadow-xl rounded-sm group overflow-hidden"
        >
          <img 
            src="https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop" 
            alt="Editorial Look 1"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" 
          />
          <div className="absolute top-4 left-4 text-xs font-bold uppercase tracking-widest text-neutral-500 z-10 group-hover:text-white transition-colors">
            Editorial Look 1
          </div>
          {/* Default blank state */}
          <div className="absolute inset-0 bg-[#F5F2EB]/50 group-hover:opacity-0 transition-opacity duration-700" />
        </motion.div>

        {/* Center Text */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full md:w-[30%] flex flex-col items-center text-center px-4"
        >
          <RevealText as="h2" text="The New" className="text-3xl md:text-5xl font-light tracking-[0.2em] uppercase text-neutral-800 mb-2" />
          <RevealText as="h3" text="classics" className="text-5xl md:text-7xl font-serif italic text-neutral-900 mb-6 drop-shadow-sm" />
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-500 mb-10 leading-relaxed max-w-[280px]">
            Elevating everyday essentials with timeless craftsmanship and modern sensibility.
          </p>
          <a href="/products" className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-800 border-b border-neutral-400 pb-1 hover:text-black hover:border-black transition-colors">
            Explore Collection
          </a>
        </motion.div>

        {/* Right Side Image */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full md:w-[35%] aspect-square md:aspect-[4/5] relative shadow-2xl rounded-sm overflow-hidden"
        >
          <img 
            src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop" 
            alt="Essentials Display"
            className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-[2s] ease-out" 
          />
        </motion.div>
      </div>
    </section>
  );
};
