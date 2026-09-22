'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart, MessageCircle, ExternalLink, Sparkles } from 'lucide-react';
import { RevealText } from '../ui/RevealText';
import { Magnetic } from '../ui/Magnetic';

const INSTAGRAM_POSTS = [
  {
    image: '/looks/look_1.jpg',
    likes: '2,840',
    comments: '94',
    caption: 'Linen whispers & summer bloomers.',
    handle: '@shalistone_official',
  },
  {
    image: '/looks/look_6.jpg',
    likes: '3,112',
    comments: '142',
    caption: 'Urban park days in our Play-Ready tracksuit set.',
    handle: '@shalistone_official',
  },
  {
    image: '/looks/look_3.jpg',
    likes: '4,208',
    comments: '218',
    caption: 'Sunday best with a modern luxury twist.',
    handle: '@shalistone_official',
  },
  {
    image: '/looks/look_cargo.jpg',
    likes: '1,980',
    comments: '86',
    caption: 'Golden hour smiles in breathable organics.',
    handle: '@shalistone_official',
  },
  {
    image: '/looks/look_2.jpg',
    likes: '2,650',
    comments: '110',
    caption: 'For the puddle-jumpers and forest wanderers.',
    handle: '@shalistone_official',
  },
  {
    image: '/looks/infant_onesie.jpg',
    likes: '5,320',
    comments: '340',
    caption: 'Cloud-soft organic ribbed onesie for naptime.',
    handle: '@shalistone_official',
  },
];

// Official Instagram Camera Glyph
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

export const Instagram = () => {
  return (
    <section className="relative overflow-hidden py-24 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col items-center text-center mb-16">
        {/* Live Instagram Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-1.5 shadow-sm mb-4"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-600">
            Live Feed • @shalistone_official
          </span>
        </motion.div>

        <RevealText
          as="h2"
          text="The Social Gallery"
          className="text-4xl md:text-6xl font-bold tracking-tighter uppercase leading-[0.85] text-neutral-900 mb-4"
        />

        <p className="max-w-lg text-sm text-neutral-600 leading-relaxed mb-8">
          Step into our visual lookbook. Tag <span className="font-semibold text-neutral-900">@shalistone_official</span> or use{' '}
          <span className="font-semibold text-neutral-900">#ShalistoneKids</span> for a chance to be featured in our seasonal catalogue.
        </p>

        {/* Action Controls & Follow Badge */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Magnetic strength={0.25}>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-black px-7 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              {/* Instagram Gradient Glow on Hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#f09433] via-[#bc1888] to-[#cc2366] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative z-10 flex items-center gap-2.5">
                <InstagramGlyph className="h-4 w-4" />
                <span>Follow on Instagram</span>
                <ExternalLink className="h-3 w-3 opacity-70 transition-transform group-hover:translate-x-0.5" />
              </div>
            </a>
          </Magnetic>

          <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-neutral-200/60 px-4 py-2.5 text-[11px] font-semibold text-neutral-700">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>128K Members • Daily Styling Inspo</span>
          </div>
        </div>
      </div>

      {/* 6-Item Luxury Editorial Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {INSTAGRAM_POSTS.map((post, i) => (
          <motion.a
            key={i}
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6 }}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
          >
            {/* 4K Visual — optimised & lazily loaded a viewport ahead of view */}
            <Image
              src={post.image}
              alt={post.caption}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
            />

            {/* Top Instagram Handle Icon Badge */}
            <div className="absolute top-2.5 right-2.5 z-10 rounded-full bg-black/40 p-1.5 text-white/90 backdrop-blur-md opacity-80 group-hover:opacity-100 transition-opacity">
              <InstagramGlyph className="h-3 w-3" />
            </div>

            {/* Gradient Overlay & Hover Information */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-3.5 text-white">
              {/* Instagram Heart & Comments */}
              <div className="flex items-center gap-3 mb-2 text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                  {post.likes}
                </span>
                <span className="flex items-center gap-1 text-white/80">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {post.comments}
                </span>
              </div>

              {/* Caption Teaser */}
              <p className="text-[11px] leading-tight line-clamp-2 text-white/90 italic font-serif">
                “{post.caption}”
              </p>

              <span className="mt-2 text-[9px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                View on Instagram →
              </span>
            </div>
          </motion.a>
        ))}
      </div>

      {/* Bottom Hashtag Strip */}
      <div className="mt-10 flex items-center justify-center text-center">
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2 border-b border-neutral-300 pb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-600 transition-colors hover:border-black hover:text-black"
        >
          <span>Explore #ShalistoneKids on Instagram</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </a>
      </div>
    </section>
  );
};
