'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Magnetic } from '../ui/Magnetic';

const HEADLINE_FONT = "'Arial Black', 'Arial Bold', 'Helvetica Neue', Gadget, sans-serif";

const FIGURE_PRIMARY = '/hero-figure-2.png';
const FIGURE_FALLBACK =
  'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=1200&auto=format&fit=crop';

const NEXT_BG = '#F5F2EB';

interface HeroSettings {
  headline: string[];
  subtext: string;
  rightCopy: string;
  featuredTitle: string;
  featuredPrice: string;
}

const DEFAULT_HERO: HeroSettings = {
  headline: ['Little Stars,', 'Big Style —', 'Made for', 'Every Age'],
  subtext: 'Adorable outfits for kids aged 0–16. Designed to play, built to last.',
  rightCopy: 'Where comfort meets playful style for your little ones.',
  featuredTitle: 'Kids Comfort Set',
  featuredPrice: '₹899.00',
};

export const Hero = () => {
  const { scrollY } = useScroll();
  const [figureSrc, setFigureSrc] = useState(FIGURE_PRIMARY);
  const figureRef = useRef<HTMLImageElement>(null);
  const [settings, setSettings] = useState<HeroSettings>(DEFAULT_HERO);

  useEffect(() => {
    const img = figureRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFigureSrc(FIGURE_FALLBACK);
    try {
      const raw = localStorage.getItem('shalistone_hero_settings');
      if (raw) setSettings(JSON.parse(raw));
    } catch {}
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { damping: 32, stiffness: 110 };
  const sx = useSpring(mouseX, spring);
  const sy = useSpring(mouseY, spring);

  const figX = useTransform(sx, [-1000, 1000], [-12, 12]);
  const figY = useTransform(sy, [-1000, 1000], [-6, 6]);
  const childX = useTransform(sx, [-1000, 1000], [-6, 6]);
  const childY = useTransform(sy, [-1000, 1000], [-3, 3]);
  const headX = useTransform(sx, [-1000, 1000], [6, -6]);
  const wiseX = useTransform(sx, [-1000, 1000], [14, -14]);

  const figScrollY = useTransform(scrollY, [0, 800], [0, -50]);
  const wiseScrollY = useTransform(scrollY, [0, 800], [0, 70]);
  const headScrollY = useTransform(scrollY, [0, 800], [0, -80]);
  const fade = useTransform(scrollY, [0, 550], [1, 0]);

  const onMove = (e: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    mouseX.set(e.clientX - window.innerWidth / 2);
    mouseY.set(e.clientY - window.innerHeight / 2);
  };

  return (
    <section
      onMouseMove={onMove}
      className="relative h-[100svh] min-h-[600px] w-full overflow-hidden cursor-default"
    >
      {/* Warm atmospheric gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(130% 95% at 60% 8%, #e8f0e8 0%, #eee9e0 38%, #efe8d9 70%, #ece2d0 100%)',
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(50% 65% at 55% 50%, rgba(255,255,255,0.65), transparent 70%)',
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="absolute -inset-8 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,42,46,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(30,42,46,0.035) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(120% 110% at 55% 42%, #000 30%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(120% 110% at 55% 42%, #000 30%, transparent 78%)',
        }}
      />

      {/* Fine noise overlay */}
      <div
        className="absolute inset-0 z-[6] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
        }}
      />

      {/* Giant SHALISTONE watermark */}
      <motion.div
        style={{ y: wiseScrollY, x: wiseX, opacity: fade }}
        className="absolute inset-x-0 bottom-[18%] md:bottom-[14%] z-10 flex justify-center pointer-events-none select-none"
      >
        <span
          className="font-black leading-none whitespace-nowrap"
          style={{
            fontFamily: HEADLINE_FONT,
            fontSize: 'clamp(3.2rem, 13vw, 11rem)',
            letterSpacing: '-0.045em',
            color: '#d7c7a6',
            opacity: 0.7,
            textShadow: '0 2px 1px rgba(255,255,255,0.45), 0 12px 30px rgba(120,105,75,0.12)',
          }}
        >
          SHALISTONE
        </span>
      </motion.div>

      {/* ——— Figures group: main model + child ——— */}
      {/* Main figure (right-center) */}
      <motion.div
        style={{ y: figScrollY }}
        className="absolute bottom-0 z-20 pointer-events-none
          left-[50%] -translate-x-1/2 h-[44vh] w-[130vw] max-w-none
          sm:h-[58vh]
          md:left-[55%] md:-translate-x-1/2 md:h-[90vh] md:w-[min(90vw,620px)]"
      >
        <motion.div style={{ x: figX, y: figY }} className="relative h-full w-full will-change-transform">
          <div className="absolute inset-x-[26%] bottom-[2%] h-[6%] rounded-[50%] bg-black/20 blur-2xl" />
          <img
            ref={figureRef}
            src={figureSrc}
            alt="Shalistone kids collection"
            className="relative h-full w-full object-contain object-bottom"
            onError={() => figureSrc !== FIGURE_FALLBACK && setFigureSrc(FIGURE_FALLBACK)}
          />
        </motion.div>
      </motion.div>

      {/* Child figure (standing beside the main model) */}
      <motion.div
        style={{ y: figScrollY, opacity: fade }}
        className="absolute bottom-0 z-[21] pointer-events-none hidden md:block
          left-[30%] -translate-x-1/2"
      >
        <motion.div
          style={{ x: childX, y: childY }}
          className="relative will-change-transform"
        >
          <div className="absolute inset-x-[18%] bottom-[1%] h-[5%] rounded-[50%] bg-black/15 blur-lg" />
          <img
            src="/child3.png"
            alt="Shalistone kids"
            className="h-[40vh] md:h-[55vh] w-auto object-contain object-bottom drop-shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          />
        </motion.div>
      </motion.div>

      {/* ——— Text content ——— */}
      {/* Headline — top left */}
      <motion.div
        style={{ x: headX, y: headScrollY, opacity: fade }}
        className="absolute z-[25] pointer-events-none
          left-0 right-0 top-[8vh] px-[6vw] text-center
          sm:top-[14vh]
          md:left-[4vw] md:right-auto md:top-[18vh] md:max-w-[34vw] md:px-0 md:text-left"
      >
        <h1
          className="uppercase text-[#141414]"
          style={{
            fontFamily: HEADLINE_FONT,
            fontWeight: 900,
            fontSize: 'clamp(1.9rem, 5.8vw, 3.8rem)',
            lineHeight: 0.92,
            letterSpacing: '-0.03em',
            textShadow: '0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {settings.headline.map((line, i) => (
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
          className="mx-auto mt-4 hidden max-w-[280px] md:mx-0 md:mt-6 md:block"
          style={{ animation: 'heroFade 0.9s ease-out 0.6s both' }}
        >
          <p className="text-[11px] md:text-[12px] leading-relaxed font-semibold uppercase tracking-[0.04em] text-neutral-600">
            {settings.subtext}
          </p>
        </div>

        {/* CTA directly under headline on desktop */}
        <div
          className="hidden md:block mt-8"
          style={{ animation: 'heroFade 0.9s ease-out 0.8s both' }}
        >
          <Magnetic strength={0.22}>
            <a
              href="/products"
              className="group pointer-events-auto inline-flex items-center gap-3 whitespace-nowrap rounded-full bg-black px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_12px_35px_rgba(0,0,0,0.2)] transition-all hover:bg-neutral-800 hover:shadow-[0_16px_45px_rgba(0,0,0,0.25)]"
            >
              Explore Collection
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20 transition-transform duration-300 group-hover:rotate-45">
                <svg width="10" height="10" viewBox="0 0 15 15" fill="none">
                  <path d="M8.146 3.146a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L11.293 8H2.5a.5.5 0 0 1 0-1h8.793L8.146 3.854a.5.5 0 0 1 0-.708Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                </svg>
              </span>
            </a>
          </Magnetic>
        </div>
      </motion.div>

      {/* Right copy — desktop only */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute right-[4vw] top-[19vh] z-30 hidden lg:block max-w-[190px] text-left pointer-events-none"
      >
        <div style={{ animation: 'heroFade 0.9s ease-out 0.55s both' }}>
          <p className="text-[10px] leading-[1.8] font-bold uppercase tracking-[0.14em] text-neutral-500">
            {settings.rightCopy}
          </p>
          <div className="mt-3 h-px w-12 bg-neutral-400/50" />
        </div>
      </motion.div>

      {/* Featured product card — desktop only */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute right-[4vw] top-[42vh] z-40 hidden lg:block"
      >
        <div
          style={{ animation: 'heroFade 0.9s ease-out 0.85s both' }}
          className="w-56 rounded-2xl border border-white/50 bg-white/80 p-3 shadow-[0_16px_40px_rgba(40,45,60,0.1)] backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
              <img
                src="https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=200&auto=format&fit=crop"
                alt="Kids Outfit Set"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-400">Featured</p>
              <p className="truncate text-[12px] font-semibold text-neutral-900 mt-0.5">{settings.featuredTitle}</p>
              <p className="text-[12px] font-bold text-neutral-900">{settings.featuredPrice}</p>
            </div>
          </div>
          <a
            href="/products"
            className="mt-2.5 flex items-center justify-center gap-2 rounded-full bg-black py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800"
          >
            Shop the look
            <svg width="9" height="9" viewBox="0 0 15 15" fill="none">
              <path d="M8.146 3.146a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L11.293 8H2.5a.5.5 0 0 1 0-1h8.793L8.146 3.854a.5.5 0 0 1 0-.708Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </motion.div>

      {/* Mobile CTA — bottom center */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute bottom-[6%] left-1/2 z-40 -translate-x-1/2 md:hidden"
      >
        <div style={{ animation: 'heroFade 0.9s ease-out 0.8s both' }}>
          <Magnetic strength={0.22}>
            <a
              href="/products"
              className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
            >
              Explore Collection
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20 transition-transform duration-300 group-hover:rotate-45">
                <svg width="9" height="9" viewBox="0 0 15 15" fill="none">
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
        className="absolute bottom-10 right-[4vw] z-40 hidden lg:flex flex-col items-center gap-2"
      >
        <span className="text-[8px] uppercase tracking-[0.4em] text-neutral-400" style={{ writingMode: 'vertical-rl' }}>
          Scroll
        </span>
        <div className="h-8 w-px bg-gradient-to-b from-neutral-400/50 to-transparent" />
      </motion.div>

      {/* Bottom gradient fade into page */}
      <div
        className="absolute inset-x-0 bottom-0 z-[39] h-48 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent 30%, ${NEXT_BG} 100%)` }}
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
