'use client';
import { motion } from 'framer-motion';
import { RevealText } from '../ui/RevealText';

export const Newsletter = () => {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="relative flex flex-col overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_30px_80px_rgba(60,50,40,0.10)] md:flex-row"
      >
        {/* Left: studio details */}
        <div className="flex w-full flex-col justify-center p-8 md:w-[38%] md:p-12">
          <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Visit Us</span>
          <RevealText as="h2" text={"Our\nStudio"} className="mb-6 text-4xl font-bold uppercase leading-[0.9] tracking-tighter md:text-5xl" />
          <p className="mb-8 text-xs font-medium uppercase leading-relaxed tracking-widest text-neutral-500 md:text-sm">
            Experience Shalistone in person. Explore the collections, meet our stylists, and discover exclusive pieces.
          </p>

          <div className="mb-8 space-y-5">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <div className="text-sm font-bold leading-relaxed tracking-wide text-black">
                123 FASHION AVENUE
                <span className="block font-medium text-neutral-500">NEW YORK, NY 10012</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <div className="text-sm font-bold leading-relaxed tracking-wide text-black">
                MON – SAT · 10AM – 7PM
                <span className="block font-medium text-neutral-500">SUN · 11AM – 5PM</span>
              </div>
            </div>
          </div>

          <a
            href="https://www.google.com/maps/dir/?api=1&destination=Washington+Square+Park+New+York"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex w-fit items-center gap-2 rounded-full bg-black px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800"
          >
            Get Directions
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" viewBox="0 0 15 15" fill="none">
              <path d="M8.146 3.146a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L11.293 8H2.5a.5.5 0 0 1 0-1h8.793L8.146 3.854a.5.5 0 0 1 0-.708Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
            </svg>
          </a>
        </div>

        {/* Right: brand-styled abstract map (no raw Google chrome to clash with the theme) */}
        <div className="relative h-[280px] w-full overflow-hidden sm:h-[360px] md:h-auto md:w-[62%] md:min-h-[520px]">
          <svg
            viewBox="0 0 600 520"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <rect width="600" height="520" fill="#EDE6D6" />
            {/* park block */}
            <rect x="60" y="70" width="200" height="170" rx="18" fill="#E1D8C2" />
            <rect x="340" y="270" width="210" height="180" rx="18" fill="#E1D8C2" />
            {/* streets */}
            <g stroke="#D8CDB4" strokeWidth="10">
              <line x1="0" y1="260" x2="600" y2="260" />
              <line x1="0" y1="400" x2="600" y2="400" />
              <line x1="300" y1="0" x2="300" y2="520" />
              <line x1="150" y1="0" x2="150" y2="520" />
              <line x1="450" y1="0" x2="450" y2="520" />
            </g>
            <g stroke="#D8CDB4" strokeWidth="4">
              <line x1="0" y1="130" x2="600" y2="130" />
              <line x1="0" y1="335" x2="600" y2="335" />
              <line x1="75" y1="0" x2="75" y2="520" />
              <line x1="225" y1="0" x2="225" y2="520" />
              <line x1="375" y1="0" x2="375" y2="520" />
              <line x1="525" y1="0" x2="525" y2="520" />
            </g>
            {/* dashed route to the pin */}
            <path d="M60 400 Q 220 380 300 260" fill="none" stroke="#141414" strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round" opacity="0.35" />
          </svg>

          {/* soft edge so the graphic reads as a framed card, not a flat cutout */}
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/10 to-transparent" />

          {/* Pin marker */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[calc(50%+10px)]">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-black text-white shadow-[0_10px_25px_rgba(0,0,0,0.3)] ring-4 ring-white/70">
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </span>
            <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-black" />
          </div>

          {/* Open in Google Maps — real navigation, kept subtle */}
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=Washington+Square+Park+New+York"
            target="_blank"
            rel="noreferrer"
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-700 shadow-sm transition-colors hover:bg-white sm:right-5 sm:top-5"
          >
            Open in Maps
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>

          {/* Glass pin card */}
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:bottom-5 sm:left-5 sm:right-5 sm:p-4 md:left-6 md:right-auto md:max-w-xs">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-neutral-900">Shalistone Flagship</p>
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> Open now · until 7PM
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
