'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export const Banner = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);

  return (
    <section ref={containerRef} className="my-24 relative h-[70vh] bg-neutral-900 flex flex-col items-center justify-center overflow-hidden group">
      <motion.img 
        style={{ scale }}
        src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=2000&auto=format&fit=crop" 
        className="absolute inset-0 w-full h-full object-cover opacity-50"
        alt="Banner Background"
      />
      
      <motion.h2 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-white text-4xl md:text-6xl lg:text-8xl font-semibold opacity-90 mix-blend-overlay tracking-tighter text-center max-w-5xl px-4"
      >
        Jacket. Pants. Tees. Hoodies.
      </motion.h2>
      
      <motion.div 
        style={{ y: y1 }}
        className="absolute left-4 md:left-24 top-[30%] w-28 h-40 md:w-48 md:h-64 rounded-xl border-4 border-white shadow-2xl z-20 overflow-hidden -rotate-6 hover:rotate-0 transition-transform duration-500 cursor-pointer"
      >
        <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover" alt="Floating 1" />
      </motion.div>

      <motion.div 
        style={{ y: y2 }}
        className="absolute right-4 md:right-24 top-[40%] w-28 h-40 md:w-48 md:h-64 rounded-xl border-4 border-white shadow-2xl z-20 overflow-hidden rotate-6 hover:rotate-0 transition-transform duration-500 cursor-pointer"
      >
        <img src="https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover" alt="Floating 2" />
      </motion.div>
    </section>
  );
};
