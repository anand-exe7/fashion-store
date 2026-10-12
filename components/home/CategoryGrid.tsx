'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { RevealText } from '../ui/RevealText';
import { fetchDepartments, formatAgeRange, type Department } from '@/lib/db';

// Artwork and palette per age band. Presentation only — the LABEL and the age
// range come from the departments table, so the tiles can't drift away from
// what the admin configured (they used to be hardcoded text that silently went
// stale, and every tile linked to the unfiltered /products).
const LOOKS: Record<string, { desc: string; bgColor: string; image: string; position: string }> = {
  Toddlers: {
    desc: 'Playful sets & combos',
    bgColor: 'bg-[#FCD3E1]',
    image: '/looks/toddler_girl_grass.jpg',
    position: 'object-top',
  },
  Kids: {
    desc: 'Cool & comfy everyday',
    bgColor: 'bg-[#D3EAFC]',
    image: '/looks/look_6.jpg',
    position: 'object-top',
  },
  Teens: {
    desc: 'Trendy fits, their style',
    bgColor: 'bg-[#FCEFD3]',
    image: '/looks/look_cargo.jpg',
    position: 'object-[center_15%]',
  },
};

const FALLBACK_LOOK = {
  desc: 'Shop the collection',
  bgColor: 'bg-[#E4E4E4]',
  image: '/looks/look_6.jpg',
  position: 'object-top',
};

interface Tile {
  name: string;
  title: string;
  desc: string;
  bgColor: string;
  image: string;
  position: string;
}

// formatAgeRange is built for the admin and tags both bounds: "1Y–5Y". On a
// storefront tile the unit only needs saying once, so a years-only range
// collapses to "1–5". A months range ("6M–11M") is left spelled out, since
// dropping the unit there would read as years.
const tileRange = (label: string) => label.replace(/^(\d+)Y\u2013(\d+)Y$/, '$1\u2013$2');

const toTile = (d: Department): Tile => {
  const look = LOOKS[d.name] || FALLBACK_LOOK;
  const range = tileRange(formatAgeRange(d.ageMinMonths, d.ageMaxMonths));
  return { name: d.name, title: range ? `${d.name} (${range})` : d.name, ...look };
};

// A department earns a tile when it is switched on AND has an age range —
// that's what distinguishes the kid bands from catch-alls like Unisex.
const tileWorthy = (d: Department) => d.isActive && d.ageMinMonths != null;

// Rendered before the fetch resolves, and kept if it fails, so this section is
// never blank or jumpy. Mirrors the live Toddlers/Kids/Teens rows.
const FALLBACK_TILES: Tile[] = [
  { name: 'Toddlers', title: 'Toddlers (1–5)', ...LOOKS.Toddlers },
  { name: 'Kids', title: 'Kids (6–12)', ...LOOKS.Kids },
  { name: 'Teens', title: 'Teens (13–16)', ...LOOKS.Teens },
];

// Tailwind needs literal class names, so the column count is looked up rather
// than interpolated.
const COLS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

export const CategoryGrid = () => {
  const [tiles, setTiles] = useState<Tile[]>(FALLBACK_TILES);

  useEffect(() => {
    let cancelled = false;
    fetchDepartments()
      .then((departments) => {
        if (cancelled) return;
        const live = departments
          .filter(tileWorthy)
          .sort((a, b) => (a.ageMinMonths ?? 0) - (b.ageMinMonths ?? 0))
          .map(toTile);
        // Keep the fallback rather than rendering an empty section if nothing
        // is configured yet.
        if (live.length > 0) setTiles(live);
      })
      .catch((err) => {
        console.error('Failed to load departments for the category grid:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col mb-16">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-500 mb-2">Curated Collection</span>
        <RevealText as="h2" text={"Shop By\nCategory"} className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.85]" />
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${COLS[tiles.length] || 'lg:grid-cols-4'} gap-6`}>
        {tiles.map((cat, idx) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            // Land on THIS band, not the unfiltered catalogue. /products reads
            // ?department= on mount.
            onClick={() => (window.location.href = `/products?department=${encodeURIComponent(cat.name)}`)}
            className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-end"
          >
            {/* Background image — optimised & fetched eagerly so it's ready as the
                visitor scrolls down from the hero (first section below the fold). */}
            <Image
              src={cat.image}
              alt={cat.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              loading="eager"
              className={`absolute inset-0 w-full h-full object-cover ${cat.position || 'object-center'} transition-transform duration-[1.2s] group-hover:scale-105 ease-out`}
            />

            {/* Floating label at the bottom */}
            <div className="relative z-10 p-4 w-full">
              <div className={`${cat.bgColor} rounded-2xl p-5 md:p-6 text-center shadow-lg transition-transform duration-500 group-hover:-translate-y-1 flex flex-col items-center justify-center`}>
                <h3 className="text-lg md:text-xl font-bold text-neutral-900 tracking-tight">{cat.title}</h3>
                <p className="text-xs text-neutral-600 mt-1 font-medium">{cat.desc}</p>

                {/* Expandable shop now button on hover */}
                <div className="h-0 overflow-hidden group-hover:h-10 group-hover:mt-4 transition-all duration-300 ease-out flex items-center justify-center w-full">
                  <span className="bg-black text-white px-5 py-2.5 rounded-full text-[9px] font-bold tracking-widest uppercase flex items-center gap-2 shadow-md">
                    Shop Now <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
