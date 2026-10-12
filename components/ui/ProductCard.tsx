'use client';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, useState } from 'react';
import { optimizedSrc } from '@/lib/image';
import { priceParts } from '@/lib/price';

const itemVariants: any = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 18 } }
};

export const ProductCard = ({ id, title, category, price, originalPrice, priceFrom, isNew, discount, image, stock }: any) => {
  const isOutOfStock = stock <= 0;
  const { priceLabel, originalLabel, hasMrp, discountPct } = priceParts(price, originalPrice);
  // If the optimizer ever fails for a photo, fall back to the original so the card is never blank.
  const [optimizerFailed, setOptimizerFailed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(rotateXRaw, springConfig);
  const rotateY = useSpring(rotateYRaw, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    // Only apply 3D tilt on devices that support hover
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateYRaw.set(px * 8);
    rotateXRaw.set(-py * 8);
  };

  const handleMouseLeave = () => {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  };

  return (
    <motion.div
      variants={itemVariants}
      className="group flex flex-col w-full"
    >
      <a href={`/product/${id}`} className="block h-full cursor-pointer">
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformPerspective: 800 }}
          className="relative aspect-[3/4] bg-neutral-100 mb-2.5 sm:mb-4 overflow-hidden rounded-xl sm:rounded-2xl border border-black/[0.04]"
        >
          {/* A product with no photo gets a plain placeholder. It used to render
              an <img> with no src — a broken-image icon — and the home page went
              further and substituted a stock photo of clothing we don't sell. */}
          {image ? (
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              src={optimizerFailed ? image : optimizedSrc(image, 640)}
              onError={() => setOptimizerFailed(true)}
              alt={title}
              className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-40 grayscale-[0.5]' : ''}`}
              loading="lazy"
            />
          ) : (
            <div className={`flex h-full w-full flex-col items-center justify-center gap-1.5 bg-neutral-100 ${isOutOfStock ? 'opacity-40' : ''}`}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-neutral-300" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-4.5-4.5L3 21" />
              </svg>
              <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-neutral-400">No photo</span>
            </div>
          )}
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Badges - scaled for mobile */}
          <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 flex gap-1 sm:gap-1.5 z-10 flex-wrap">
            {isOutOfStock && (
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-neutral-900/90 text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded sm:rounded-md shadow-sm">
                Out of Stock
              </span>
            )}
            {isNew && !isOutOfStock && (
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/95 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded sm:rounded-md text-black shadow-sm">
                New
              </span>
            )}
            {(hasMrp || discount) && !isOutOfStock && (
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-red-500/95 text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded sm:rounded-md shadow-sm">
                {hasMrp ? `${discountPct}% off` : discount}
              </span>
            )}
          </div>
          
          {/* View product slide up on desktop hover */}
          <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-3 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
            <span className="block w-full bg-white/95 text-black py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-lg text-center hover:bg-black hover:text-white transition-colors">
              {isOutOfStock ? 'View Details' : 'View Product'}
            </span>
          </div>
        </motion.div>

        <div className="flex justify-between items-start px-0.5 sm:px-1">
          <div className="min-w-0 pr-1 flex-1">
            <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 group-hover:text-black transition-colors truncate">
              {title}
            </h3>
            <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 font-medium truncate">
              {category}
            </p>
          </div>
          <div className="hidden sm:flex gap-1.5 mt-1 shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#8fa4b8] border border-white shadow-2xs" />
            <div className="w-3 h-3 rounded-full bg-neutral-800 border border-white shadow-2xs" />
          </div>
        </div>
        {/* Selling price in green with the MRP struck through beside it; a
            product with no MRP keeps the plain near-black price. */}
        <div className="mt-1 sm:mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 px-0.5 sm:px-1">
          <span className={`text-xs sm:text-sm font-bold ${hasMrp ? 'text-emerald-600' : 'text-neutral-900'}`}>
            {priceFrom && <span className="font-medium text-neutral-400">from </span>}
            {priceLabel}
          </span>
          {originalLabel && (
            <span className="text-[10px] sm:text-xs font-medium text-neutral-400 line-through">
              {originalLabel}
            </span>
          )}
        </div>
      </a>
    </motion.div>
  );
};

