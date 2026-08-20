'use client';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { RevealText } from '../ui/RevealText';

const SPEED = 45; // px per second

const REVIEWS = [
  { img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop', name: 'Aria M.', note: 'Impeccable fit' },
  { img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=600&auto=format&fit=crop', name: 'Devin K.', note: 'Buttery fabric' },
  { img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop', name: 'Noor S.', note: 'Worth every penny' },
  { img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop', name: 'Priya R.', note: 'My new staple' },
  { img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop', name: 'Leo T.', note: 'Elevated basics' },
  { img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop', name: 'Maya J.', note: 'So well made' },
];

export const LovedByThousands = () => {
  const marquee = [...REVIEWS, ...REVIEWS];

  const x = useMotionValue(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const halfWidthRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // Only run the marquee's per-frame loop while the section is on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (paused || !inView || !trackRef.current) return;
    if (!halfWidthRef.current) halfWidthRef.current = trackRef.current.scrollWidth / 2;
    let next = x.get() - (SPEED * delta) / 1000;
    if (next <= -halfWidthRef.current) next += halfWidthRef.current;
    x.set(next);
  });

  return (
    <section ref={sectionRef} className="overflow-hidden bg-gradient-to-b from-[#efe7d9] to-[#f5f2eb] py-24 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-6">
        <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Our Community</span>
        <RevealText as="h2" text="Loved by Thousands" className="mb-6 text-4xl font-bold uppercase leading-[0.85] tracking-tighter md:text-6xl" />

        {/* Aggregate rating */}
        <div className="mb-16 inline-flex items-center gap-3 rounded-full border border-black/5 bg-white px-5 py-2.5 shadow-sm">
          <span className="text-sm tracking-tight text-amber-500">★★★★★</span>
          <span className="text-xs font-bold tracking-wide text-neutral-800">4.9 / 5</span>
          <span className="hidden text-[11px] font-medium uppercase tracking-widest text-neutral-500 sm:inline">
            from 2,000+ happy customers
          </span>
        </div>
      </motion.div>

      <div
        className="relative flex w-full overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Edge fades keep the marquee feeling seamless */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#efe7d9] to-transparent md:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#f5f2eb] to-transparent md:w-28" />

        <motion.div ref={trackRef} style={{ x }} className="flex w-max gap-4 px-4 md:gap-5">
          {marquee.map((r, i) => (
            <a
              href="/products"
              key={i}
              className="group relative aspect-[4/5] w-[210px] flex-shrink-0 overflow-hidden rounded-2xl bg-neutral-200 shadow-sm transition-shadow hover:shadow-xl md:w-[280px]"
            >
              <img
                src={r.img}
                alt={`${r.name} review`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

              <div className="absolute left-4 top-4 flex gap-1 rounded-full bg-white/90 px-2.5 py-1 shadow-sm">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-[9px] text-amber-500">★</span>
                ))}
              </div>

              <div className="absolute inset-x-4 bottom-4 text-left text-white">
                <p className="font-serif text-base italic leading-tight">“{r.note}”</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] opacity-90">— {r.name}</p>
              </div>
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
