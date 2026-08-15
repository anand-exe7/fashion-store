'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export const Banner = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  return (
    <section ref={containerRef} className="my-32 relative h-[80vh] bg-[#f5f5f0] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 max-w-[1400px] mx-auto px-6 grid grid-cols-12 gap-6 items-center">
        {/* Left Editorial Image */}
        <motion.div 
          style={{ y: y1 }}
          className="col-span-4 hidden md:block h-[60vh] relative z-10"
        >
          <img 
            src="https://images.unsplash.com/photo-1550614000-4b95d466f272?q=80&w=800&auto=format&fit=crop" 
            className="w-full h-full object-cover shadow-xl" 
            alt="Editorial Look 1" 
          />
        </motion.div>

        {/* Center Typography */}
        <div className="col-span-12 md:col-span-4 flex flex-col items-center justify-center text-center z-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-[#3c3c3a] text-5xl md:text-6xl font-light tracking-widest uppercase mb-6"
          >
            The New
            <br />
            <span className="font-serif italic text-6xl md:text-7xl lowercase">Classics</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-neutral-500 max-w-sm text-sm uppercase tracking-wider mb-8"
          >
            Elevating everyday essentials with timeless craftsmanship and modern sensibility.
          </motion.p>
          <motion.a
            href="#"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="inline-block border-b border-[#3c3c3a] text-[#3c3c3a] uppercase tracking-widest text-xs pb-1 hover:text-neutral-500 hover:border-neutral-500 transition-colors"
          >
            Explore Collection
          </motion.a>
        </div>

        {/* Right Editorial Image */}
        <motion.div 
          style={{ y: y2 }}
          className="col-span-4 hidden md:block h-[50vh] mt-24 relative z-10"
        >
          <img 
            src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=800&auto=format&fit=crop" 
            className="w-full h-full object-cover shadow-xl" 
            alt="Editorial Look 2" 
          />
        </motion.div>
      </div>
      
      {/* Background Graphic */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
        <span className="text-[20vw] font-serif italic text-black">Essence</span>
      </div>
    </section>
  );
};
