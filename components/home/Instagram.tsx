'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { Magnetic } from '../ui/Magnetic';

const PROFILE_URL = 'https://www.instagram.com/shalistone/';

// Latest reels from instagram.com/shalistone — videos are self-hosted in /public/reels
// so we can render a clean, chrome-free looping player (no likes/comments/share).
const REELS = [
  { src: '/reels/reel1.mp4', href: 'https://www.instagram.com/reel/DdoO-bKJZYv/' },
  { src: '/reels/reel2.mp4', href: 'https://www.instagram.com/reel/DdVJSFTpvju/' },
  { src: '/reels/reel3.mp4', href: 'https://www.instagram.com/reel/DdL7D8FJJbT/' },
];

// Official Instagram camera glyph
const InstagramGlyph = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const VideoReel = ({ src, href, index }: { src: string; href: string; index: number }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  // React can drop the `muted` attribute, which browsers require for autoplay.
  // Force it on the element and kick off playback once mounted.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, []);

  // Always-playing: if anything pauses the video (tab throttle, OS power saving),
  // resume it immediately.
  const keepPlaying = () => {
    const v = videoRef.current;
    if (v) v.play().catch(() => {});
  };

  // Tap the video to toggle sound (it never pauses).
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="group relative mx-auto aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-[26px] bg-neutral-900 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/5"
    >
      {failed ? (
        // Graceful fallback if the local video is missing
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-100 text-neutral-500"
        >
          <InstagramGlyph className="h-7 w-7" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Watch on Instagram</span>
        </a>
      ) : (
        <>
          <video
            ref={videoRef}
            src={src}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            suppressHydrationWarning
            onClick={toggleMute}
            onPause={keepPlaying}
            onError={() => setFailed(true)}
            className="h-full w-full cursor-pointer object-cover"
          />

          {/* Mute / unmute — the only control, tucked in the corner */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/70"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </>
      )}
    </motion.div>
  );
};

export const Instagram = () => {
  return (
    <section className="relative overflow-hidden py-24 px-6 md:px-12 max-w-6xl mx-auto">
      {/* Centered header + the follow button */}
      <div className="mb-12 flex flex-col items-center gap-5 text-center">
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex flex-col items-center gap-2"
        >
          <span className="flex items-center gap-2.5 text-neutral-600 transition-colors group-hover:text-neutral-800">
            <InstagramGlyph className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">@shalistone</span>
          </span>
          <span className="font-serif text-3xl md:text-5xl italic tracking-tight text-neutral-900">
            View more on Instagram
          </span>
        </a>

        {/* Restored Follow on Instagram button */}
        <Magnetic strength={0.25}>
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-black px-7 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95"
          >
            {/* Instagram gradient glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#f09433] via-[#bc1888] to-[#cc2366] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative z-10 flex items-center gap-2.5">
              <InstagramGlyph className="h-4 w-4" />
              <span>Follow on Instagram</span>
              <ExternalLink className="h-3 w-3 opacity-70 transition-transform group-hover:translate-x-0.5" />
            </div>
          </a>
        </Magnetic>
      </div>

      {/* Reels — clean looping video cards. 1 column on mobile, 3 across on desktop. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 justify-items-center">
        {REELS.map((reel, i) => (
          <VideoReel key={reel.src} src={reel.src} href={reel.href} index={i} />
        ))}
      </div>
    </section>
  );
};
