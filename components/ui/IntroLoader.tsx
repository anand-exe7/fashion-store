'use client';
import { useEffect, useState } from 'react';

const HOLD_MS = 1500;
const FADE_MS = 600;

/**
 * Branded intro curtain for the landing page.
 *
 * `app/loading.tsx` only paints while a route segment is still streaming, and this
 * page resolves in a few milliseconds — so that curtain was never actually seen.
 * This one is rendered with the page (so it is in the very first HTML) and then
 * removes itself from the DOM once the fade is done. The CSS animation repeats the
 * fade independently, so the curtain still clears itself if JS never runs.
 */
export const IntroLoader = () => {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), HOLD_MS + FADE_MS);
    return () => clearTimeout(t);
  }, []);

  if (done) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden bg-[#EFE9DD]"
      style={{ animation: `introCurtain ${FADE_MS}ms cubic-bezier(0.76,0,0.24,1) ${HOLD_MS}ms forwards` }}
    >
      {/* Soft cartoon shapes, same family as the hero doodles */}
      <span className="absolute left-[14%] top-[22%] hidden sm:block" style={{ animation: 'introFloat 4s ease-in-out infinite' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M12 2.6c.9 4.6 2.3 6 6.9 6.9-4.6.9-6 2.3-6.9 6.9-.9-4.6-2.3-6-6.9-6.9 4.6-.9 6-2.3 6.9-6.9Z" fill="#e0cfa4" />
        </svg>
      </span>
      <span className="absolute right-[16%] top-[30%] hidden sm:block" style={{ animation: 'introFloat 5s ease-in-out 0.6s infinite' }}>
        <svg width="72" height="44" viewBox="0 0 66 40" fill="none">
          <path d="M17 33h31a10 10 0 0 0 .6-20A14 14 0 0 0 22 11a9 9 0 0 0-5 17Z" fill="#ffffff" opacity="0.8" />
        </svg>
      </span>
      <span className="absolute bottom-[20%] left-[24%] hidden sm:block" style={{ animation: 'introFloat 4.6s ease-in-out 1.1s infinite' }}>
        <svg width="60" height="34" viewBox="0 0 52 30" fill="none">
          <path d="M4 27a22 22 0 0 1 44 0" stroke="#c3d9c8" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M13 27a13 13 0 0 1 26 0" stroke="#eec9d5" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      </span>

      <div className="relative flex flex-col items-center gap-5 px-6" style={{ animation: 'introEnter 0.7s ease-out 0.1s both' }}>
        <img
          src="/logo.jpeg"
          alt=""
          className="h-20 w-20 rounded-2xl object-cover shadow-[0_18px_45px_rgba(80,70,50,0.22)] sm:h-24 sm:w-24"
        />
        <h1
          className="text-lg font-black tracking-[0.2em] text-neutral-900 sm:text-2xl sm:tracking-[0.28em]"
          style={{ fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif" }}
        >
          SHALISTONE
        </h1>
        <p className="-mt-2 text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-500 sm:text-[10px]">
          Little stars, big style
        </p>

        {/* Determinate bar so the wait reads as progress, not a stall */}
        <div className="mt-2 h-[3px] w-40 overflow-hidden rounded-full bg-black/10 sm:w-52">
          <div
            className="h-full rounded-full bg-neutral-900"
            style={{ animation: `introBar ${HOLD_MS + FADE_MS}ms cubic-bezier(0.4,0,0.2,1) forwards` }}
          />
        </div>
      </div>

      <style>{`
        @keyframes introEnter {
          from { opacity: 0; transform: scale(0.9) translateY(18px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes introCurtain {
          to { opacity: 0; visibility: hidden; pointer-events: none; }
        }
        @keyframes introBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes introFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};
