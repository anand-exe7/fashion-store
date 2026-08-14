'use client';
import { motion } from 'framer-motion';

export const Marquee = () => {
  return (
    <section className="py-8 border-y border-neutral-200 overflow-hidden flex whitespace-nowrap bg-neutral-50 relative">
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        className="flex gap-12 items-center font-bold text-3xl md:text-4xl tracking-wider text-black w-max"
      >
        {/* Duplicate the items to make the scrolling seamless */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-12 items-center">
            <span>DESIGNED TO MOVE</span>
            <span className="text-2xl text-neutral-300">✳</span>
            <span>MADE TO LAST</span>
            <span className="text-2xl text-neutral-300">✳</span>
            <span>DESIGNED TO MOVE</span>
            <span className="text-2xl text-neutral-300">✳</span>
            <span>MADE TO LAST</span>
            <span className="text-2xl text-neutral-300">✳</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
};
