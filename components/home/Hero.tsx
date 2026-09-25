'use client';
import { useState, useEffect, type ReactNode, type CSSProperties } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import Image from 'next/image';
import { Magnetic } from '../ui/Magnetic';

// Single duo cutout (big brother + little one). The subject sits dead-centre in the
// PNG with ~34% transparent margin each side, so plain centring lines it up correctly.
// Statically imported so next/image can optimise it (WebP + resize) and ship a much
// smaller LCP image than the ~1.3MB source PNG, with its dimensions known at build time.
import heroFigure from '@/public/bg_final.png';

const HEADLINE_FONT = "'Arial Black', 'Arial Bold', 'Helvetica Neue', Gadget, sans-serif";

const NEXT_BG = '#F5F2EB';



const settings = {
  headline: ['Little Stars,', 'Big Style —', 'Made for', 'Every Age'],
  subtext: 'Adorable outfits for kids aged 0–16. Designed to play, built to last.',
  rightCopy: 'Where comfort meets playful style for your little ones.',
};

const Star = ({ c }: { c: string }) => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2.6c.9 4.6 2.3 6 6.9 6.9-4.6.9-6 2.3-6.9 6.9-.9-4.6-2.3-6-6.9-6.9 4.6-.9 6-2.3 6.9-6.9Z"
      fill={c}
    />
  </svg>
);

const Cloud = ({ c }: { c: string }) => (
  <svg width="66" height="40" viewBox="0 0 66 40" fill="none">
    <path
      d="M17 33h31a10 10 0 0 0 .6-20A14 14 0 0 0 22 11a9 9 0 0 0-5 17Z"
      fill={c}
    />
  </svg>
);

const Balloon = ({ c }: { c: string }) => (
  <svg width="30" height="46" viewBox="0 0 30 46" fill="none">
    <ellipse cx="15" cy="15" rx="11" ry="13.5" fill={c} />
    <path d="M15 28.5v14" stroke={c} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
  </svg>
);

const Rainbow = ({ c }: { c: string }) => (
  <svg width="52" height="30" viewBox="0 0 52 30" fill="none">
    <path d="M4 27a22 22 0 0 1 44 0" stroke={c} strokeWidth="4.5" strokeLinecap="round" />
    <path d="M13 27a13 13 0 0 1 26 0" stroke={c} strokeWidth="4.5" strokeLinecap="round" opacity="0.55" />
  </svg>
);

const DOODLES = [
  { key: 'star-a', left: '9%', top: '58%', dur: 7, delay: 0, svg: <Star c="#e8c76a" /> },
  { key: 'cloud-a', left: '22%', top: '12%', dur: 11, delay: 0.8, svg: <Cloud c="#ffffff" /> },
  { key: 'balloon', left: '74%', top: '62%', dur: 9, delay: 0.4, svg: <Balloon c="#f3b7c8" /> },
  { key: 'rainbow', left: '86%', top: '82%', dur: 10, delay: 1.2, svg: <Rainbow c="#a8cbb0" /> },
  { key: 'star-b', left: '66%', top: '15%', dur: 8, delay: 1.6, svg: <Star c="#c9d7e6" /> },
] as const;

// Mobile-only playful doodles. On phones the desktop set (above) is hidden and
// its wide-screen positions would clump; these are tuned for a narrow, tall
// viewport and sit in the band between the headline and the figure so they fill
// the empty space with colour without ever overlapping the figure (which starts
// ~54% down). Brighter than the desktop "texture" doodles — this is the kids
// signal the storefront was missing on mobile.
const DOODLES_MOBILE = [
  { key: 'm-star1', left: '7%', top: '7%', dur: 6, delay: 0, svg: <Star c="#E5A400" /> },
  { key: 'm-cloud', left: '68%', top: '5%', dur: 10, delay: 0.6, svg: <Cloud c="#ffffff" /> },
  { key: 'm-star2', left: '87%', top: '16%', dur: 7.5, delay: 0.9, svg: <Star c="#EC6A9C" /> },
  { key: 'm-star3', left: '14%', top: '27%', dur: 7, delay: 1.4, svg: <Star c="#8FC7A6" /> },
  { key: 'm-rainbow', left: '6%', top: '35%', dur: 9, delay: 1, svg: <Rainbow c="#7FB8D9" /> },
  { key: 'm-balloon', left: '82%', top: '33%', dur: 8, delay: 0.3, svg: <Balloon c="#EC6A9C" /> },
] as const;

// The headline, split into colour-accented tokens. The accent colours only
// paint on mobile (see the `.hero-accent` rule in the <style> block); on sm+
// every token inherits the original near-black so the desktop hero is unchanged.
const HEADLINE_LINES: { t: string; a?: string }[][] = [
  [{ t: 'Little ' }, { t: 'Stars', a: '#E5A400' }, { t: ',' }],
  [{ t: 'Big ' }, { t: 'Style', a: '#EC6A9C' }, { t: ' —' }],
  [{ t: 'Made for' }],
  [{ t: 'Every ' }, { t: 'Age', a: '#2FA37A' }],
];

export const Hero = ({ featured }: { featured?: ReactNode }) => {
  const { scrollY } = useScroll();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { damping: 32, stiffness: 110 };
  const sx = useSpring(mouseX, spring);
  const sy = useSpring(mouseY, spring);

  const figX = useTransform(sx, [-1000, 1000], [-12, 12]);
  const figY = useTransform(sy, [-1000, 1000], [-6, 6]);
  const headX = useTransform(sx, [-1000, 1000], [6, -6]);
  const wiseX = useTransform(sx, [-1000, 1000], [14, -14]);

  const figScrollY = useTransform(scrollY, [0, 800], [0, -50]);
  const wiseScrollY = useTransform(scrollY, [0, 800], [0, 70]);
  const headScrollY = useTransform(scrollY, [0, 800], [0, -80]);
  const fade = useTransform(scrollY, [0, 550], [1, 0]);
  // Doodles stay deliberately faint so they read as texture, not clip-art.
  const doodleFade = useTransform(scrollY, [0, 550], [0.5, 0]);
  // Mobile doodles are meant to be seen (kid signal), so they start much brighter.
  const doodleFadeMobile = useTransform(scrollY, [0, 550], [0.95, 0]);

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

      {/* Cartoon doodles — small, soft, and behind everything else (desktop/tablet) */}
      <motion.div
        style={{ opacity: doodleFade }}
        className="absolute inset-0 z-[7] hidden select-none pointer-events-none sm:block"
        aria-hidden
      >
        {DOODLES.map((d) => (
          <span
            key={d.key}
            className="absolute block"
            style={{
              left: d.left,
              top: d.top,
              animation: `heroFloat ${d.dur}s ease-in-out ${d.delay}s infinite`,
            }}
          >
            {d.svg}
          </span>
        ))}
      </motion.div>

      {/* Cartoon doodles — mobile only. Brighter and positioned around the
          headline / in the gap above the figure to fill the empty space. */}
      <motion.div
        style={{ opacity: doodleFadeMobile }}
        className="absolute inset-0 z-[7] block select-none pointer-events-none sm:hidden"
        aria-hidden
      >
        {DOODLES_MOBILE.map((d) => (
          <span
            key={d.key}
            className="absolute block"
            style={{
              left: d.left,
              top: d.top,
              animation: `heroFloat ${d.dur}s ease-in-out ${d.delay}s infinite`,
            }}
          >
            {d.svg}
          </span>
        ))}
      </motion.div>

      {/* Giant SHALISTONE watermark */}
      <motion.div
        style={{ y: wiseScrollY, x: wiseX, opacity: fade }}
        className="absolute inset-x-0 bottom-[18%] md:bottom-[14%] z-10 flex justify-center pointer-events-none select-none overflow-hidden"
      >
        <span
          className="font-black leading-none whitespace-nowrap"
          style={{
            fontFamily: HEADLINE_FONT,
            fontSize: 'clamp(2.1rem, 12vw, 11rem)',
            letterSpacing: '-0.045em',
            color: '#d7c7a6',
            opacity: 0.7,
            textShadow: '0 2px 1px rgba(255,255,255,0.45), 0 12px 30px rgba(120,105,75,0.12)',
          }}
        >
          SHALISTONE
        </span>
      </motion.div>

      {/* ——— Hero figures: one cutout holding both the big kid and the little one ——— */}
      <motion.div
        style={{ y: figScrollY }}
        className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 pointer-events-none
          h-[58vh] w-auto
          sm:h-[58vh]
          md:h-[80vh]
          lg:h-[84vh]"
      >
        <motion.div style={{ x: figX, y: figY }} className="relative h-full w-auto will-change-transform">
          {/* Ground shadow sits under the subject, which spans 34%–66% of the PNG width */}
          <div className="absolute inset-x-[33%] bottom-[1.5%] h-[5%] rounded-[50%] bg-black/20 blur-2xl" />
          <Image
            src={heroFigure}
            alt="Shalistone kids and mens matching sets"
            sizes="(max-width: 768px) 85vw, 55vw"
            loading="eager"
            fetchPriority="high"
            className="relative h-full w-auto max-w-none object-contain object-bottom"
          />
        </motion.div>
      </motion.div>

      {/* ——— Text content ——— */}
      {/* Headline — top left */}
      <motion.div
        style={{ x: headX, y: headScrollY, opacity: fade }}
        className="absolute z-[25] pointer-events-none
          left-0 right-0 top-[13vh] px-4 text-center
          sm:top-[16vh]
          md:left-[4vw] md:right-auto md:top-[22vh] md:max-w-[34vw] md:px-0 md:text-left"
      >
        <h1
          className="heroHeadline uppercase text-[#141414]"
          style={{
            fontFamily: HEADLINE_FONT,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            textShadow: '0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {HEADLINE_LINES.map((line, i) => (
            <span key={i} className="block overflow-hidden">
              <span
                className="block"
                style={{ animation: `heroSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) ${0.12 + i * 0.07}s both` }}
              >
                {line.map((tok, j) =>
                  tok.a ? (
                    <span key={j} className="hero-accent" style={{ '--a': tok.a } as CSSProperties}>
                      {tok.t}
                    </span>
                  ) : (
                    <span key={j}>{tok.t}</span>
                  ),
                )}
              </span>
            </span>
          ))}
        </h1>

        {/* Kid tagline chip — mobile only. Adds the "made for kids" context the
            client felt was missing, and fills a little of the space under the headline. */}
        <div className="mt-4 flex justify-center sm:hidden" style={{ animation: 'heroFade 0.9s ease-out 0.55s both' }}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-800 shadow-md ring-1 ring-black/[0.04]">
            <span className="text-sm leading-none text-[#E5A400]">★</span>
            Ages 0–16 · Playful &amp; Comfy
          </span>
        </div>

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

      {/* Featured product card — desktop only. Content is streamed in from the
          server (see HeroFeatured) so a real product is shown, not a placeholder. */}
      {featured && (
        <motion.div
          style={{ opacity: fade }}
          className="absolute right-[4vw] top-[42vh] z-40 hidden lg:block"
        >
          <div style={{ animation: 'heroFade 0.9s ease-out 0.85s both' }}>
            {featured}
          </div>
        </motion.div>
      )}

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
        /* Mobile: bigger, punchier headline. On sm+ the original clamp is
           restored so the desktop/tablet hero is byte-for-byte unchanged. */
        .heroHeadline { font-size: clamp(2.2rem, 9vw, 3.4rem); }
        .hero-accent { color: var(--a, inherit); }
        @media (min-width: 640px) {
          .heroHeadline { font-size: clamp(1.5rem, 5.5vw, 3.8rem); }
          .hero-accent { color: inherit; }
        }
        @keyframes heroSlideUp {
          from { transform: translateY(105%); }
          to { transform: translateY(0); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(6deg); }
        }
        @keyframes heroFade {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};
