'use client';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { RevealText } from '../ui/RevealText';
import { Magnetic } from '../ui/Magnetic';

export const SeasonalDrop = () => {
  return (
    <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto border-t border-black/10">
      <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-500 mb-2 block">Autumn / Winter</span>
          <RevealText as="h2" text={"Seasonal\nDrop"} className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.85]" />
        </div>
        <Magnetic strength={0.3}>
          <a href="/products" className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors border border-black/10 hover:border-black/30 px-6 py-3 rounded-full">
            Shop The Edit
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </a>
        </Magnetic>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Large Feature Image */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-8 relative aspect-[4/3] md:aspect-[16/10] bg-neutral-100 rounded-2xl overflow-hidden group shadow-md"
        >
          <img 
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop" 
            alt="Seasonal Drop" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0 text-white">
            <div>
              <h3 className="text-2xl font-serif italic mb-1">The Trench Coat</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Outerwear Collection</p>
            </div>
            <p className="text-lg font-bold">₹34,000</p>
          </div>
        </motion.div>

        {/* Small Side Images */}
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 relative aspect-square bg-neutral-100 rounded-2xl overflow-hidden group shadow-md cursor-pointer"
            onClick={() => window.location.href = '/products'}
          >
            <img 
              src="https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800&auto=format&fit=crop" 
              alt="Seasonal Look 2" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" 
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[9px] font-bold uppercase tracking-widest text-black rounded shadow-sm">Just In</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex-1 relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] bg-neutral-100 rounded-2xl overflow-hidden group shadow-md cursor-pointer"
            onClick={() => window.location.href = '/products'}
          >
            <img 
              src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop" 
              alt="Seasonal Look 3" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
