'use client';
import { motion } from 'framer-motion';

export const Newsletter = () => {
  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="bg-[#1c1f1d] rounded-[2rem] p-10 md:p-24 relative overflow-hidden flex items-center min-h-[500px] shadow-2xl group"
      >
        <div className="relative z-10 max-w-lg text-white">
          <h2 className="text-4xl md:text-6xl font-semibold mb-6 tracking-tight leading-tight">Join Our<br/>Newsletter</h2>
          <p className="text-neutral-400 mb-10 text-sm md:text-base leading-relaxed max-w-md">Get 15% off your first order and be the first to know about new drops, collections, and exclusive early access offers.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="email" placeholder="Email Address" className="px-6 py-4 rounded-full flex-1 text-black outline-none font-medium placeholder:text-neutral-500 shadow-inner focus:ring-4 ring-neutral-500/20 transition-all" />
            <button className="bg-white text-black px-10 py-4 rounded-full font-semibold hover:bg-neutral-200 transition-colors shadow-lg active:scale-95">Subscribe</button>
          </div>
        </div>
        {/* Background image */}
        <div className="absolute right-0 top-0 w-1/2 h-full hidden md:block">
           <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1000&auto=format&fit=crop" alt="Newsletter background" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80" />
           <div className="absolute inset-0 bg-gradient-to-r from-[#1c1f1d] via-[#1c1f1d]/80 to-transparent" />
        </div>
      </motion.div>
    </section>
  );
};
