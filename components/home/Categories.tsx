'use client';
import { motion } from 'framer-motion';

export const Categories = () => {
  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col mb-16">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-500 mb-2">Explore Collections</span>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.85]"
        >
          Shop<br/>Categories
        </motion.h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left large category */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-[2rem] overflow-hidden flex flex-col md:flex-row min-h-[500px] group cursor-pointer hover:shadow-2xl border border-black/5 transition-all duration-500"
        >
          <div className="w-full md:w-1/2 p-10 md:p-12 flex flex-col justify-between z-20 bg-white">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4 block font-bold">Men</span>
              <h3 className="text-4xl lg:text-5xl font-bold mb-8 leading-[0.95] tracking-tighter text-black uppercase">Half-Zip Cozy Confidence</h3>
            </div>
            <button className="bg-black text-white px-8 py-4 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all shadow-md hover:shadow-lg active:scale-95 w-max">Shop Now</button>
          </div>
          <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-full overflow-hidden bg-neutral-100">
            <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=800&auto=format&fit=crop" alt="Men Category" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ease-out" />
          </div>
        </motion.div>

        <div className="flex flex-col gap-8">
          {/* Top right category */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-[2rem] overflow-hidden flex flex-col sm:flex-row min-h-[240px] group cursor-pointer hover:shadow-2xl border border-black/5 transition-all duration-500"
          >
            <div className="w-full sm:w-1/2 p-8 md:p-10 flex flex-col justify-between bg-white z-20">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3 block font-bold">Women</span>
                <h3 className="text-2xl lg:text-3xl font-bold mb-6 leading-[0.95] tracking-tighter text-black uppercase">Elegant & Minimalist</h3>
              </div>
              <button className="bg-black text-white px-6 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all shadow-md hover:shadow-lg active:scale-95 w-max">Shop Now</button>
            </div>
            <div className="w-full sm:w-1/2 relative min-h-[200px] sm:min-h-full overflow-hidden bg-neutral-100">
              <img src="https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=800&auto=format&fit=crop" alt="Women Category" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ease-out" />
            </div>
          </motion.div>

          {/* Bottom right category */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-[2rem] overflow-hidden flex flex-col sm:flex-row min-h-[240px] group cursor-pointer hover:shadow-2xl border border-black/5 transition-all duration-500"
          >
            <div className="w-full sm:w-1/2 p-8 md:p-10 flex flex-col justify-between bg-white z-20">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3 block font-bold">Kids</span>
                <h3 className="text-2xl lg:text-3xl font-bold mb-6 leading-[0.95] tracking-tighter text-black uppercase">Comfort For Every Weather</h3>
              </div>
              <button className="bg-black text-white px-6 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all shadow-md hover:shadow-lg active:scale-95 w-max">Shop Now</button>
            </div>
            <div className="w-full sm:w-1/2 relative min-h-[200px] sm:min-h-full overflow-hidden bg-neutral-100">
              <img src="https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=800&auto=format&fit=crop" alt="Kids Category" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ease-out" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
