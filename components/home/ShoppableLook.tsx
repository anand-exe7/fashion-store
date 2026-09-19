'use client';
import { motion } from 'framer-motion';
import { RevealText } from '../ui/RevealText';

const LOOKS = {
  left: {
    src: '/child3.png',
    label: 'Collection 01',
    caption: 'Play-Ready Sets',
  },
  right: {
    src: '/child2.png',
    label: 'Collection 02',
    caption: 'Comfort First',
  },
};

const ImageCard = ({
  src,
  label,
  caption,
  className = '',
  delay = 0,
}: {
  src: string;
  label: string;
  caption: string;
  className?: string;
  delay?: number;
}) => (
  <motion.figure
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay }}
    className={`group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(60,50,40,0.14)] ring-1 ring-black/5 ${className}`}
  >
    <img
      src={src}
      alt={caption}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
    <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-700 md:left-4 md:top-4 md:text-[9px]">
      {label}
    </span>
    <figcaption className="absolute inset-x-3 bottom-3 flex items-end justify-between text-white md:inset-x-4 md:bottom-4">
      <span className="font-serif text-base italic md:text-lg">{caption}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 transition-transform group-hover:translate-x-1 md:text-[10px]">
        View →
      </span>
    </figcaption>
    <a href="/products" aria-label={caption} className="absolute inset-0 z-10" />
  </motion.figure>
);

export const ShoppableLook = () => {
  return (
    <section className="relative w-full overflow-hidden px-6 py-24 md:px-12 md:py-32">
      {/* Huge faded background word — sized so the whole word stays visible instead of bleeding off-screen */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none overflow-hidden opacity-[0.05]">
        <span className="whitespace-nowrap font-serif text-[15vw] italic tracking-tighter text-black sm:text-[16vw] md:text-[20vw] lg:text-[24vw]">
          Essence
        </span>
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-2 items-center gap-4 sm:gap-6 md:grid-cols-3 md:gap-10 lg:gap-16">
        {/* Center text — full width on mobile, middle column on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="order-1 col-span-2 mb-2 flex flex-col items-center px-2 text-center md:order-2 md:col-span-1 md:mb-0"
        >
          <span className="mb-4 text-[10px] font-bold uppercase tracking-[0.35em] text-neutral-500">The Edit</span>
          <RevealText as="h2" text="The New" className="mb-1 text-3xl font-light uppercase tracking-[0.2em] text-neutral-800 md:text-5xl" />
          <RevealText as="h3" text="classics" className="mb-6 font-serif text-5xl italic text-neutral-900 md:text-7xl" />
          <p className="mb-8 max-w-[280px] text-[11px] font-bold uppercase leading-relaxed tracking-widest text-neutral-500 md:text-xs">
            Adorable outfits crafted with care — play-ready, comfy, and always in style.
          </p>
          <a
            href="/products"
            className="group inline-flex items-center gap-2 border-b border-neutral-400 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-800 transition-colors hover:border-black hover:text-black"
          >
            Explore Collection
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </motion.div>

        <ImageCard {...LOOKS.left} className="order-2 md:order-1" />
        <ImageCard {...LOOKS.right} className="order-3 md:order-3" delay={0.3} />
      </div>
    </section>
  );
};
