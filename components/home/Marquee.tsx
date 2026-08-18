'use client';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { useRef, useState } from 'react';

const SPEED = 40; // px per second

export const Marquee = () => {
  const x = useMotionValue(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const halfWidthRef = useRef(0);

  useAnimationFrame((_, delta) => {
    if (paused || !trackRef.current) return;
    if (!halfWidthRef.current) {
      halfWidthRef.current = trackRef.current.scrollWidth / 2;
    }
    let next = x.get() - (SPEED * delta) / 1000;
    if (next <= -halfWidthRef.current) next += halfWidthRef.current;
    x.set(next);
  });

  return (
    <section
      className="py-8 border-y border-neutral-200 overflow-hidden flex whitespace-nowrap bg-neutral-50 relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        ref={trackRef}
        style={{ x }}
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
