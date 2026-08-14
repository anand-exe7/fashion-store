'use client';
import { motion } from 'framer-motion';

export const Categories = () => {
  return (
    <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl font-semibold mb-10 tracking-tight"
      >
        Shop by Categories
      </motion.h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left large category */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-[#f2f2f2] rounded-3xl p-10 relative min-h-[500px] flex flex-col justify-start overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow"
        >
          <div className="z-20 relative transition-transform duration-500 group-hover:-translate-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-600 mb-4 block font-bold">Men</span>
            <h3 className="text-4xl lg:text-5xl font-semibold mb-8 max-w-[300px] leading-tight tracking-tight text-black">Half-Zip Cozy Confidence</h3>
            <button className="bg-black text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-lg active:scale-95">Shop Now</button>
          </div>
          <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=800&auto=format&fit=crop" alt="Men Category" className="absolute bottom-0 right-0 w-[80%] md:w-[70%] h-auto rounded-tl-[3rem] transition-transform duration-700 group-hover:scale-105 origin-bottom-right z-10 drop-shadow-2xl" />
        </motion.div>

        <div className="flex flex-col gap-6">
          {/* Top right category */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#faf9f6] rounded-3xl p-10 relative flex-1 flex flex-col justify-center overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow min-h-[250px]"
          >
            <div className="z-20 relative max-w-[50%] transition-transform duration-500 group-hover:-translate-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-3 block font-bold">Women</span>
              <h3 className="text-2xl lg:text-3xl font-semibold mb-6 leading-tight tracking-tight text-black">Elegant & Minimalist</h3>
              <button className="bg-black text-white px-6 py-3 rounded-full text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-lg active:scale-95">Shop Now</button>
            </div>
            <img src="https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=800&auto=format&fit=crop" alt="Women Category" className="absolute top-0 right-0 w-[55%] h-full object-cover transition-transform duration-700 group-hover:scale-105 origin-right z-10 mask-image-gradient" />
          </motion.div>

          {/* Bottom right category */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-[#f5f5f5] rounded-3xl p-10 relative flex-1 flex flex-col justify-center overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow min-h-[250px]"
          >
            <div className="z-20 relative max-w-[50%] transition-transform duration-500 group-hover:-translate-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-3 block font-bold">Kids</span>
              <h3 className="text-2xl lg:text-3xl font-semibold mb-6 leading-tight tracking-tight text-black">Comfort For Every Weather</h3>
              <button className="bg-black text-white px-6 py-3 rounded-full text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-lg active:scale-95">Shop Now</button>
            </div>
            <img src="https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=800&auto=format&fit=crop" alt="Kids Category" className="absolute bottom-0 right-0 w-[50%] h-[120%] object-cover rounded-tl-[40px] transition-transform duration-700 group-hover:scale-105 origin-bottom-right z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
