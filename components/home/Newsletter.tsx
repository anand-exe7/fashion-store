'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RevealText } from '../ui/RevealText';

const DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=No.69.1%2F2%2C+1st+Main+Rd%2C+Ramachandrapuram%2C+Bengaluru%2C+Karnataka+560021';
const STORE_PHONE = '+919110415639';
const STORE_PHONE_DISPLAY = '+91 91104 15639';

type StoreStatus = { open: boolean; label: string };

// Live open/closed from the store's own timezone (IST), independent of the
// visitor's clock. Hours: Mon–Sat 10:00–19:00, Sun 11:00–17:00.
function getStoreStatus(): StoreStatus {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const mins = hour * 60 + minute;

  const isSun = weekday === 'Sun';
  const openMin = isSun ? 11 * 60 : 10 * 60;
  const closeMin = isSun ? 17 * 60 : 19 * 60;

  const fmt = (m: number) => {
    const h = Math.floor(m / 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}${ampm}`;
  };

  if (mins >= openMin && mins < closeMin) {
    return { open: true, label: `Open now · until ${fmt(closeMin)}` };
  }
  // Closed — show when it opens next (today if before opening, else tomorrow).
  const opensToday = mins < openMin;
  return {
    open: false,
    label: opensToday ? `Closed · opens ${fmt(openMin)}` : 'Closed · opens tomorrow',
  };
}

export const Newsletter = () => {
  // Computed on the client only, to avoid a hydration mismatch on the clock.
  const [status, setStatus] = useState<StoreStatus | null>(null);
  useEffect(() => {
    setStatus(getStoreStatus());
    const id = setInterval(() => setStatus(getStoreStatus()), 60_000);
    return () => clearInterval(id);
  }, []);

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

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex w-fit items-center gap-2 rounded-full bg-black px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800"
            >
              Get Directions
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" viewBox="0 0 15 15" fill="none">
                <path d="M8.146 3.146a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L11.293 8H2.5a.5.5 0 0 1 0-1h8.793L8.146 3.854a.5.5 0 0 1 0-.708Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href={`tel:${STORE_PHONE}`}
              className="group inline-flex w-fit items-center gap-2 rounded-full border border-black/15 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-800 transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
              </svg>
              Call Store
            </a>
          </div>
        </div>

        {/* Right: fixed, non-interactive map with a branded marker. The iframe is
            locked (pointer-events-none) so it can never be dragged, zoomed, or hijack
            the page scroll — the whole surface acts as one tap target that opens
            directions in Google Maps. */}
        <div className="group relative h-[300px] w-full overflow-hidden sm:h-[380px] md:h-auto md:w-[62%] md:min-h-[540px]">
          <iframe
            title="Shalistone flagship store location"
            width="100%"
            height="100%"
            className="pointer-events-none absolute inset-0 h-full w-full grayscale-[0.35] contrast-[1.06] saturate-[0.85] brightness-[1.03]"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=No.69.1/2,+1st+Main+Rd,+Ramachandrapuram,+Bengaluru,+Karnataka+560021&t=&z=16&ie=UTF8&iwloc=&output=embed"
          ></iframe>

          {/* Warm brand duotone + edge vignette so Google's raw chrome blends into
              the studio palette and the overlays stay legible. */}
          <div className="pointer-events-none absolute inset-0 bg-[#C8A97E]/12 mix-blend-multiply" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(60,50,40,0.18)]" />

          {/* Whole-surface tap target — opens turn-by-turn directions */}
          <a
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Open Shalistone flagship location in Google Maps"
            className="absolute inset-0 z-10"
          />

          {/* Branded marker pinned dead-centre, with a layered pulsing ground ring.
              The tip sits on the map's centre point (the geocoded store address). */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-full">
            {/* Layered pulsing ground rings at the pin's tip */}
            <span className="absolute left-1/2 top-full h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/20 animate-ping" />
            <span className="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30 animate-ping [animation-delay:0.4s]" />
            <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-md" />
            {/* Teardrop pin with gradient + gloss */}
            <svg
              width="48"
              height="60"
              viewBox="0 0 46 56"
              fill="none"
              className="drop-shadow-[0_10px_16px_rgba(0,0,0,0.4)]"
              style={{ animation: 'pinDrop 0.6s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              <defs>
                <linearGradient id="pinBody" x1="23" y1="2" x2="23" y2="54" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3a3430" />
                  <stop offset="1" stopColor="#0d0b0a" />
                </linearGradient>
              </defs>
              <path
                d="M23 2c-9.94 0-18 7.9-18 17.65 0 12.2 15.2 32.1 16.28 33.47a2.2 2.2 0 0 0 3.44 0C25.8 51.75 41 31.85 41 19.65 41 9.9 32.94 2 23 2Z"
                fill="url(#pinBody)"
                stroke="#ffffff"
                strokeWidth="3"
              />
              {/* soft top gloss */}
              <ellipse cx="17.5" cy="13" rx="6" ry="3.4" fill="#ffffff" opacity="0.18" />
              <circle cx="23" cy="19.5" r="6.5" fill="#ffffff" />
              <circle cx="23" cy="19.5" r="3" fill="#111111" />
            </svg>
          </div>

          {/* Open in Maps badge (real link, above the surface target) */}
          <a
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noreferrer"
            className="absolute right-4 top-4 z-30 flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white sm:right-5 sm:top-5"
          >
            Open in Maps
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>

          {/* Glass store card — address, live status, inline directions */}
          <div className="absolute bottom-4 left-4 right-4 z-30 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.16)] backdrop-blur-md sm:bottom-5 sm:left-5 sm:right-5 md:left-6 md:right-auto md:max-w-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black text-white shadow">
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-neutral-900">Shalistone Flagship</p>
                <p className="truncate text-[11px] font-medium text-neutral-500">Ramachandrapuram · Bengaluru</p>
              </div>
              {/* Live open/closed pill */}
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  status?.open === false
                    ? 'bg-neutral-100 text-neutral-500'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      status?.open === false ? 'bg-neutral-400' : 'bg-emerald-500'
                    }`}
                  />
                  {status ? (status.open ? 'Open' : 'Closed') : 'Hours'}
                </span>
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
              <span className="text-[11px] font-semibold text-neutral-600">
                {status ? status.label : 'Mon–Sat 10–7 · Sun 11–5'}
              </span>
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="group/link inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-neutral-900"
              >
                Directions
                <svg className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" viewBox="0 0 15 15" fill="none">
                  <path d="M8.146 3.146a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L11.293 8H2.5a.5.5 0 0 1 0-1h8.793L8.146 3.854a.5.5 0 0 1 0-.708Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                </svg>
              </a>
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
