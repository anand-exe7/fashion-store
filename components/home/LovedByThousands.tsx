'use client';
import { ArrowRight } from 'lucide-react';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { useRef, useState } from 'react';
import { RevealText } from '../ui/RevealText';

const SPEED = 50; // px per second

export const LovedByThousands = () => {
  const images = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1485231183945-fdc92215a3c1?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515347619253-12a84360a775?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop"
  ];

  // Duplicate images to create a seamless infinite scroll effect
  const marqueeImages = [...images, ...images];

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
    <section className="py-24 bg-white text-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-500 mb-2 block">Our Community</span>
        <RevealText as="h2" text="Loved by Thousands" className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter uppercase leading-[0.85]" />
        <p className="text-neutral-500 mb-16 text-sm font-semibold tracking-widest uppercase">Join our community of happy customers</p>
      </motion.div>

      <div
        className="w-full overflow-hidden flex relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex gap-4 px-4 w-max"
        >
          {marqueeImages.map((img, i) => (
            <div 
              key={i} 
              className="w-[220px] md:w-[280px] aspect-[4/5] bg-neutral-200 rounded-2xl flex-shrink-0 relative overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow"
            >
              <img src={img} alt="User Generated Content" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center z-10">
                <div className="flex gap-1 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                  {[1,2,3,4,5].map(star => <span key={star} className="text-yellow-500 text-[10px]">★</span>)}
                </div>
                <div className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300 shadow-sm hover:scale-110">
                  <ArrowRight className="w-4 h-4 text-black" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
