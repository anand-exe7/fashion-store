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

        {/* Right: framed map with a glass pin card */}
        <div className="relative h-[320px] w-full md:h-auto md:w-[62%] md:min-h-[520px]">
          <iframe
            title="Shalistone studio location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.366224168019!2d-73.99849208459424!3d40.73200787932938!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259972b9a7c35%3A0xc66df952112e4b47!2sWashington%20Square%20Park!5e0!3m2!1sen!2sus!4v1655132204780!5m2!1sen!2sus"
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'grayscale(100%) contrast(1.05)' }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full"
          />
          {/* subtle warm tint so the map sits inside the theme */}
          <div className="pointer-events-none absolute inset-0 bg-[#F5F2EB]/10 mix-blend-multiply" />

          {/* Glass pin card */}
          <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl md:left-6 md:right-auto md:max-w-xs">
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
