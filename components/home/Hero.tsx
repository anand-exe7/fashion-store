'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Magnetic } from '../ui/Magnetic';

const HEADLINE_FONT = "'Arial Black', 'Arial Bold', 'Helvetica Neue', Gadget, sans-serif";

// Your transparent cutout lives in /public. Swap this file to change the figure.
const FIGURE_PRIMARY = '/hero-figure-2.png';
const FIGURE_FALLBACK =
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop';

// Next section's background — the gradual blur fades into this for a seamless seam.
const NEXT_BG = '#F5F2EB';

export const Hero = () => {
  const { scrollY } = useScroll();
  const [figureSrc, setFigureSrc] = useState(FIGURE_PRIMARY);
  const figureRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = figureRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFigureSrc(FIGURE_FALLBACK);
  }, []);

  // Mouse parallax — only recomputes while the pointer moves, so it's idle-cheap.
  // It's applied only to plain (unfiltered, unmasked) layers so the compositor
  // can move them on the GPU without repainting.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { damping: 32, stiffness: 110 };
  const sx = useSpring(mouseX, spring);
  const sy = useSpring(mouseY, spring);

  const figX = useTransform(sx, [-1000, 1000], [-14, 14]);
  const figY = useTransform(sy, [-1000, 1000], [-8, 8]);
  const headX = useTransform(sx, [-1000, 1000], [8, -8]);
  const wiseX = useTransform(sx, [-1000, 1000], [16, -16]);

  // Scroll parallax (translate + opacity only — compositor-friendly).
  const figScrollY = useTransform(scrollY, [0, 800], [0, -55]);
  const wiseScrollY = useTransform(scrollY, [0, 800], [0, 80]);
  const headScrollY = useTransform(scrollY, [0, 800], [0, -90]);
  const fade = useTransform(scrollY, [0, 550], [1, 0]);

  const onMove = (e: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    mouseX.set(e.clientX - window.innerWidth / 2);
    mouseY.set(e.clientY - window.innerHeight / 2);
  };

  return (
    <section
      onMouseMove={onMove}
      className="relative h-[100svh] min-h-[600px] w-full overflow-hidden"
    >
      {/* Atmospheric gradient base */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(130% 95% at 66% 6%, #e0eff1 0%, #e9ede9 40%, #efe8d9 74%, #ece2d0 100%)',
        }}
      />
      {/* Soft studio spotlight behind the figure for depth */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(46% 60% at 50% 46%, rgba(255,255,255,0.72), transparent 72%)',
        }}
      />

      {/* Technical grid with edge fade (static — no per-frame repaint) */}
      <div
        className="absolute -inset-8 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,42,46,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(30,42,46,0.045) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(120% 110% at 50% 42%, #000 35%, transparent 82%)',
          WebkitMaskImage: 'radial-gradient(120% 110% at 50% 42%, #000 35%, transparent 82%)',
        }}
      />

      {/* Fine static noise */}
      <div
        className="absolute inset-0 z-[6] pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
        }}
      />

      {/* Giant SHALISTONE wordmark — sits BEHIND the figure for depth */}
      <motion.div
        style={{ y: wiseScrollY, x: wiseX, opacity: fade }}
        className="absolute inset-x-0 bottom-[19%] md:bottom-[16%] z-10 flex justify-center pointer-events-none select-none"
      >
        <span
          className="font-black leading-none whitespace-nowrap"
          style={{
            fontFamily: HEADLINE_FONT,
            fontSize: 'clamp(3.4rem, 13.5vw, 11.5rem)',
            letterSpacing: '-0.045em',
            color: '#d7c7a6',
            textShadow: '0 2px 1px rgba(255,255,255,0.45), 0 12px 30px rgba(120,105,75,0.16)',
          }}
        >
          SHALISTONE
        </span>
      </motion.div>

      {/* Center figure — your transparent cutout (painted above the wordmark).
          Parallax lives on the wrapper so the filtered <img> layer is only
          translated by the compositor, never re-rasterised. */}
      <motion.div
        style={{ y: figScrollY }}
        className="absolute left-1/2 bottom-0 z-20 h-[72vh] w-[92vw] max-w-[430px] -translate-x-1/2 pointer-events-none md:h-[93vh] md:w-[min(96vw,660px)] md:max-w-none"
      >
        <motion.div style={{ x: figX, y: figY }} className="relative h-full w-full will-change-transform">
          {/* soft ground shadow anchors the figure */}
          <div className="absolute inset-x-[24%] bottom-[2%] h-[7%] rounded-[50%] bg-black/25 blur-2xl" />
          <img
            ref={figureRef}
            src={figureSrc}
            alt="Shalistone editorial figure"
            className="relative h-full w-full object-contain object-bottom"
            onError={() => figureSrc !== FIGURE_FALLBACK && setFigureSrc(FIGURE_FALLBACK)}
            style={{ filter: 'drop-shadow(0 20px 26px rgba(45,45,55,0.18))' }}
          />
        </motion.div>
      </motion.div>

      {/* ---------- Foreground editorial content ---------- */}

      {/* Glass badge (top) — now visible on mobile too */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute left-1/2 top-[11vh] z-30 -translate-x-1/2 pointer-events-none"
      >
        <div
          style={{ animation: 'heroFade 0.9s ease-out 0.35s both' }}
          className="flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-4 py-2 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-700">
            FW26 · New Collection
          </span>
        </div>
      </motion.div>

      {/* Headline (left on desktop, centered on mobile) */}
      <motion.div
        style={{ x: headX, y: headScrollY, opacity: fade }}
        className="absolute left-0 right-0 top-[17vh] z-30 px-[6vw] text-center md:left-[5vw] md:right-auto md:top-[20vh] md:max-w-[40vw] md:px-0 md:text-left pointer-events-none"
      >
        <h1
          className="uppercase text-[#141414]"
          style={{
            fontFamily: HEADLINE_FONT,
            fontWeight: 900,
            fontSize: 'clamp(2.1rem, 9vw, 4.15rem)',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            textShadow: '0 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          {['Digital', 'Fashion is', 'A New', 'Chapter'].map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <span
                className="block"
                style={{ animation: `heroSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) ${0.12 + i * 0.07}s both` }}
              >
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div
          className="mx-auto mt-5 max-w-[300px] md:mx-0 md:mt-6"
          style={{ animation: 'heroFade 0.9s ease-out 0.6s both' }}
        >
          <p className="text-[11px] md:text-[12px] leading-relaxed font-semibold uppercase tracking-[0.04em] text-neutral-700">
            Timeless pieces, crafted for the modern wardrobe — designed to move and made to last.
          </p>
        </div>
      </motion.div>

      {/* Right merge copy — desktop only */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute right-[5vw] top-[21vh] z-30 hidden md:block max-w-[210px] text-left pointer-events-none"
      >
        <div style={{ animation: 'heroFade 0.9s ease-out 0.55s both' }}>
          <p className="text-[11px] leading-[1.7] font-bold uppercase tracking-[0.12em] text-neutral-700">
            Where craftsmanship meets a new generation of effortless self-expression.
          </p>
          <div className="mt-3 h-px w-14 bg-neutral-400/60" />
        </div>
      </motion.div>

      {/* Glassmorphism mini product card — desktop only */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute right-[5vw] top-[48vh] z-40 hidden lg:block"
      >
        <div
          style={{ animation: 'heroFade 0.9s ease-out 0.8s both' }}
          className="w-60 rounded-3xl border border-white/60 bg-white/30 p-3 backdrop-blur-xl shadow-[0_18px_50px_rgba(40,45,60,0.12)]"
        >
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-neutral-200">
              <img
                src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=200&auto=format&fit=crop"
                alt="Cream Crewneck"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">Featured</p>
              <p className="truncate text-[13px] font-semibold text-neutral-900">Cream Crewneck</p>
              <p className="text-[13px] font-bold text-neutral-900">$120.00</p>
            </div>
          </div>
          <a
            href="/product"
            className="mt-3 flex items-center justify-center gap-2 rounded-full bg-black py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800"
          >
            Shop the look
            <svg width="10" height="10" viewBox="0 0 15 15" fill="none">
              <path d="M8.146 3.146a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L11.293 8H2.5a.5.5 0 0 1 0-1h8.793L8.146 3.854a.5.5 0 0 1 0-.708Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </motion.div>

      {/* Glass CTA — centered pill on mobile, left-aligned on desktop */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute bottom-[5.5%] left-1/2 z-40 -translate-x-1/2 md:bottom-[10%] md:left-[5vw] md:translate-x-0"
      >
        <div style={{ animation: 'heroFade 0.9s ease-out 0.8s both' }}>
          <Magnetic strength={0.22}>
            <a
              href="/products"
              className="group inline-flex items-center gap-3 rounded-full border border-white/50 bg-white/45 px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-800 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-colors hover:bg-white/70 md:px-6 md:py-3"
            >
              Explore Collection
              <span className="grid h-6 w-6 place-items-center rounded-full bg-black text-white transition-transform duration-300 group-hover:rotate-45">
                <svg width="10" height="10" viewBox="0 0 15 15" fill="none">
                  <path d="M8.146 3.146a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L11.293 8H2.5a.5.5 0 0 1 0-1h8.793L8.146 3.854a.5.5 0 0 1 0-.708Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                </svg>
              </span>
            </a>
          </Magnetic>
        </div>
      </motion.div>

      {/* Scroll indicator — desktop only */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 right-[5vw] z-40 hidden lg:flex flex-col items-center gap-2"
      >
        <span className="text-[9px] uppercase tracking-[0.4em] text-neutral-500" style={{ writingMode: 'vertical-rl' }}>
          Scroll
        </span>
        <div className="h-10 w-px bg-gradient-to-b from-neutral-500/60 to-transparent" />
      </motion.div>

      {/* ---------- Gradual blur seam into the next section ---------- */}
      {/* Progressive blur (desktop only — keeps mobile GPUs smooth) */}
      <div
        className="absolute inset-x-0 bottom-0 z-[38] hidden h-40 pointer-events-none md:block"
        style={{
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          maskImage: 'linear-gradient(to top, #000 0%, #000 34%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, #000 0%, #000 34%, transparent 100%)',
        }}
      />
      {/* Colour wash that fades into the next component's background (all sizes) */}
      <div
        className="absolute inset-x-0 bottom-0 z-[39] h-48 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent 35%, ${NEXT_BG} 100%)` }}
      />

      <style>{`
        @keyframes heroSlideUp {
          from { transform: translateY(105%); }
          to { transform: translateY(0); }
        }
        @keyframes heroFade {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};
