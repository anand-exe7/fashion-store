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
                NO.69.1/2, 1ST FL, 1ST MAIN RD
                <span className="block font-medium text-neutral-500">RAMACHANDRAPURAM, BENGALURU 560021</span>
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
            href="https://www.google.com/maps/dir/?api=1&destination=No.69.1%2F2%2C+1st+Main+Rd%2C+Ramachandrapuram%2C+Bengaluru%2C+Karnataka+560021"
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

        {/* Right: fixed, non-interactive map with a branded marker. The iframe is
            locked (pointer-events-none) so it can never be dragged, zoomed, or hijack
            the page scroll — the whole surface acts as one tap target that opens
            directions in Google Maps. */}
        <div className="group relative h-[280px] w-full overflow-hidden sm:h-[360px] md:h-auto md:w-[62%] md:min-h-[520px]">
          <iframe
            title="Shalistone flagship store location"
            width="100%"
            height="100%"
            className="pointer-events-none absolute inset-0 h-full w-full grayscale-[0.15] contrast-[1.05]"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=No.69.1/2,+1st+Main+Rd,+Ramachandrapuram,+Bengaluru,+Karnataka+560021&t=&z=16&ie=UTF8&iwloc=&output=embed"
          ></iframe>

          {/* Soft brand tint so Google's raw chrome blends into the studio palette */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10" />

          {/* Whole-surface tap target — opens turn-by-turn directions */}
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=No.69.1%2F2%2C+1st+Main+Rd%2C+Ramachandrapuram%2C+Bengaluru%2C+Karnataka+560021"
            target="_blank"
            rel="noreferrer"
            aria-label="Open Shalistone flagship location in Google Maps"
            className="absolute inset-0 z-10"
          />

          {/* Branded marker pinned dead-centre, with a pulsing ground ring. The tip
              sits on the map's centre point (the geocoded store address). */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-full">
            {/* Pulsing ground ring at the pin's tip */}
            <span className="absolute left-1/2 top-full h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/25 animate-ping" />
            <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow" />
            {/* Teardrop pin */}
            <svg
              width="46"
              height="56"
              viewBox="0 0 46 56"
              fill="none"
              className="drop-shadow-[0_8px_14px_rgba(0,0,0,0.35)]"
              style={{ animation: 'pinDrop 0.6s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              <path
                d="M23 2c-9.94 0-18 7.9-18 17.65 0 12.2 15.2 32.1 16.28 33.47a2.2 2.2 0 0 0 3.44 0C25.8 51.75 41 31.85 41 19.65 41 9.9 32.94 2 23 2Z"
                fill="#111111"
                stroke="#ffffff"
                strokeWidth="3"
              />
              <circle cx="23" cy="19.5" r="6.5" fill="#ffffff" />
            </svg>
          </div>

          {/* Open in Maps badge (real link, above the surface target) */}
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=No.69.1%2F2%2C+1st+Main+Rd%2C+Ramachandrapuram%2C+Bengaluru%2C+Karnataka+560021"
            target="_blank"
            rel="noreferrer"
            className="absolute right-4 top-4 z-30 flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white sm:right-5 sm:top-5"
          >
            Open in Maps
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>

          {/* Glass pin card */}
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-30 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:bottom-5 sm:left-5 sm:right-5 sm:p-4 md:left-6 md:right-auto md:max-w-xs">
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

          <style>{`
            @keyframes pinDrop {
              from { transform: translateY(-14px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      </motion.div>
    </section>
  );
};
