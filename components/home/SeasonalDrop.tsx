'use client';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { RevealText } from '../ui/RevealText';
import { Magnetic } from '../ui/Magnetic';

export const SeasonalDrop = () => {
  return (
    <section className="mx-auto max-w-7xl border-t border-black/10 px-6 py-24 md:px-12 md:py-32">
      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end">
        <div>
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Autumn / Winter</span>
          <RevealText as="h2" text={"Seasonal\nDrop"} className="text-5xl font-bold uppercase leading-[0.85] tracking-tighter md:text-7xl" />
        </div>
        <Magnetic strength={0.3}>
          <a
            href="/products"
            className="group flex items-center gap-3 rounded-full border border-black/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-600 transition-colors hover:border-black/30 hover:text-black"
          >
            Shop The Edit
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </a>
        </Magnetic>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Large feature image */}
        <motion.a
          href="/products"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 shadow-md md:aspect-[16/10] lg:col-span-8"
        >
          <img
            src="https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1200&auto=format&fit=crop"
            alt="The Statement Jacket"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2s] group-hover:scale-105"
          />
          {/* Always-visible caption for context */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-black shadow-sm backdrop-blur-sm">
            Featured
          </span>
          <div className="absolute inset-x-5 bottom-5 flex items-end justify-between text-white md:inset-x-8 md:bottom-8">
            <div>
              <h3 className="mb-1 font-serif text-2xl italic md:text-3xl">The Statement Jacket</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">Outerwear Collection</p>
            </div>
            <p className="text-lg font-bold md:text-xl">₹34,000</p>
          </div>
        </motion.a>

        {/* Side images */}
        <div className="flex flex-col gap-6 sm:flex-row lg:col-span-4 lg:flex-col lg:gap-8">
          <motion.a
            href="/products"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="group relative block flex-1 overflow-hidden rounded-2xl bg-neutral-100 shadow-md aspect-square"
          >
            <img
              src="https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800&auto=format&fit=crop"
              alt="Just In"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2s] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
            <span className="absolute left-4 top-4 rounded bg-white/90 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-black shadow-sm backdrop-blur-md">
              Just In
            </span>
            <span className="absolute bottom-4 left-4 font-serif text-lg italic text-white">Knitwear</span>
          </motion.a>

          <motion.a
            href="/products"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="group relative block flex-1 overflow-hidden rounded-2xl bg-neutral-100 shadow-md aspect-[4/5] sm:aspect-square lg:aspect-[4/5]"
          >
            <img
              src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop"
              alt="Essentials"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2s] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
            <span className="absolute bottom-4 left-4 font-serif text-lg italic text-white">Essentials</span>
          </motion.a>
        </div>
      </div>
    </section>
  );
};
