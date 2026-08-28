'use client';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { RevealText } from '../ui/RevealText';

/* ——— Tiny cartoon icons, drawn inline so they stay on-brand and weigh nothing ——— */

const TagFree = () => (
  <svg viewBox="0 0 40 40" fill="none" className="h-7 w-7">
    <path d="M13 8h14l3 6-4 2v16H14V16l-4-2 3-6Z" stroke="#2b2b2b" strokeWidth="2" strokeLinejoin="round" />
    <path d="M16 8a4 4 0 0 0 8 0" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SoftSeam = () => (
  <svg viewBox="0 0 40 40" fill="none" className="h-7 w-7">
    <path d="M6 20c4-6 8-6 12 0s8 6 12 0 4-6 4-6" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 28h28" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
  </svg>
);

const EasyWaist = () => (
  <svg viewBox="0 0 40 40" fill="none" className="h-7 w-7">
    <rect x="7" y="13" width="26" height="10" rx="5" stroke="#2b2b2b" strokeWidth="2" />
    <path d="M20 23v8m-4-4 4 4 4-4" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NameLabel = () => (
  <svg viewBox="0 0 40 40" fill="none" className="h-7 w-7">
    <rect x="7" y="11" width="26" height="18" rx="4" stroke="#2b2b2b" strokeWidth="2" />
    <path d="M12 18h9m-9 5h16" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DETAILS = [
  {
    icon: <TagFree />,
    tint: 'bg-[#D5EAD8]',
    title: 'Tag-free necks',
    desc: 'Printed labels instead of scratchy tags, so nothing itches at the collar.',
  },
  {
    icon: <SoftSeam />,
    tint: 'bg-[#FCD3E1]',
    title: 'Flat, soft seams',
    desc: 'Rounded stitching that will not rub little shoulders or underarms.',
  },
  {
    icon: <EasyWaist />,
    tint: 'bg-[#D3EAFC]',
    title: 'Easy-pull waists',
    desc: 'Gentle elastic and roomy openings kids can manage all by themselves.',
  },
  {
    icon: <NameLabel />,
    tint: 'bg-[#FCEFD3]',
    title: 'Name-it labels',
    desc: 'A blank inside label to write their name on before school or playdates.',
  },
];

const FIT_GUIDE = [
  { age: '0–2 yrs', height: '50–92 cm', note: 'Onesies & rompers' },
  { age: '3–5 yrs', height: '98–110 cm', note: 'Play sets & combos' },
  { age: '6–12 yrs', height: '116–152 cm', note: 'Everyday shirts & pants' },
  { age: '13–16 yrs', height: '158–176 cm', note: 'Teen fits & layers' },
];

export const KidsCorner = () => {
  return (
    <section id="kids-corner" className="px-6 py-20 md:px-12 md:py-28">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-black/5 bg-gradient-to-b from-[#FBF7EF] to-[#F3EEE2] px-6 py-14 shadow-[0_30px_80px_rgba(60,50,40,0.08)] md:rounded-[2.5rem] md:px-12 md:py-20">
        {/* Soft cartoon backdrop */}
        <div className="pointer-events-none absolute inset-0 select-none" aria-hidden>
          <svg viewBox="0 0 66 40" fill="none" className="absolute right-0 top-8 h-16 w-24 opacity-70">
            <path d="M17 33h31a10 10 0 0 0 .6-20A14 14 0 0 0 22 11a9 9 0 0 0-5 17Z" fill="#ffffff" />
          </svg>
          <svg viewBox="0 0 24 24" fill="none" className="absolute left-6 top-10 h-8 w-8 opacity-60">
            <path d="M12 2.6c.9 4.6 2.3 6 6.9 6.9-4.6.9-6 2.3-6.9 6.9-.9-4.6-2.3-6-6.9-6.9 4.6-.9 6-2.3 6.9-6.9Z" fill="#e5d3a6" />
          </svg>
          <svg viewBox="0 0 52 30" fill="none" className="absolute bottom-6 right-10 h-12 w-20 opacity-50">
            <path d="M4 27a22 22 0 0 1 44 0" stroke="#c3d9c8" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M13 27a13 13 0 0 1 26 0" stroke="#eec9d5" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
        </div>

        <div className="relative">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-14 flex flex-col items-center text-center"
          >
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#7a8c6f] shadow-sm">
              Just for little ones
            </span>
            <RevealText
              as="h2"
              text="The Kids Corner"
              className="text-4xl font-bold uppercase leading-[0.9] tracking-tighter text-neutral-900 md:text-6xl"
            />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-neutral-600">
              Every Shalistone piece is cut for climbing, colouring and cartwheels — with the small
              details parents actually notice on laundry day.
            </p>
          </motion.div>

          <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
            {/* Little details */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h3 className="mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
                Little things we get right
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {DETAILS.map((d) => (
                  <div
                    key={d.title}
                    className="group rounded-2xl border border-black/5 bg-white/80 p-5 shadow-sm transition-shadow duration-500 hover:shadow-lg"
                  >
                    <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${d.tint} transition-transform duration-500 group-hover:-rotate-6`}>
                      {d.icon}
                    </div>
                    <h4 className="mb-1.5 text-base font-semibold tracking-tight text-neutral-900">{d.title}</h4>
                    <p className="text-[13px] leading-relaxed text-neutral-600">{d.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Fit guide */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col"
            >
              <h3 className="mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
                Find their size
              </h3>
              <div className="flex-1 rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm">
                <ul className="divide-y divide-black/5">
                  {FIT_GUIDE.map((f) => (
                    <li key={f.age} className="flex items-baseline justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold tracking-tight text-neutral-900">{f.age}</p>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{f.note}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#F3EEE2] px-3 py-1 text-[11px] font-bold tracking-wide text-neutral-700">
                        {f.height}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-5 border-t border-black/5 pt-4 text-[12px] leading-relaxed text-neutral-500">
                  Growing fast? Size up — our sets are cut with a little extra room at the cuff and hem.
                </p>

                <a
                  href="/products"
                  className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800"
                >
                  Shop kids collection
                  <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
