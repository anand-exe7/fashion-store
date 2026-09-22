'use client';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';

const itemVariants: any = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 18 } }
};

export const ProductCard = ({ id, title, category, price, isNew, discount, image, stock }: any) => {
  const isOutOfStock = stock <= 0;
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
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            src={image || undefined}
            alt={title}
            className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-40 grayscale-[0.5]' : ''}`}
            loading="lazy"
          />
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
            {discount && !isOutOfStock && (
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-red-500/95 text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded sm:rounded-md shadow-sm">
                {discount}
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
        <p className="text-xs sm:text-sm mt-1 sm:mt-1.5 font-bold px-0.5 sm:px-1 text-neutral-900">
          ₹{price}
        </p>
      </a>
    </motion.div>
  );
};

