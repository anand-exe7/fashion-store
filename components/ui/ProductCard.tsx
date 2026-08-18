'use client';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';

const itemVariants: any = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } }
};

export const ProductCard = ({ title, category, price, isNew, discount, image }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(rotateXRaw, springConfig);
  const rotateY = useSpring(rotateYRaw, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateYRaw.set(px * 10);
    rotateXRaw.set(-py * 10);
  };

  const handleMouseLeave = () => {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  };

  return (
  <motion.div
    variants={itemVariants}
    className="group flex flex-col"
  >
    <a href="/products" className="block h-full cursor-pointer">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformPerspective: 800 }}
        className="relative aspect-[3/4] bg-neutral-100 mb-5 overflow-hidden rounded-2xl"
      >
         <motion.img
           whileHover={{ scale: 1.05 }}
           transition={{ duration: 0.7, ease: "easeOut" }}
           src={image}
           alt={title}
           className="w-full h-full object-cover"
         />
         {/* Overlay gradient */}
         <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
         
         {/* Badges */}
         <div className="absolute top-4 left-4 flex gap-2 z-10">
           {isNew && <span className="px-3 py-1.5 bg-white/95 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest rounded-md text-black shadow-lg">New</span>}
           {discount && <span className="px-3 py-1.5 bg-red-500/95 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-md shadow-lg">{discount}</span>}
         </div>
         
         <div className="absolute top-4 right-4 z-10">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e: any) => e.preventDefault()}
              className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
            >
              <svg className="w-4 h-4 text-neutral-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </motion.button>
         </div>

         {/* Add to cart slide up */}
         <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10">
           <button 
             onClick={(e: any) => { e.preventDefault(); window.location.href = '/cart'; }}
             className="w-full bg-white/95 backdrop-blur-md text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl hover:bg-black hover:text-white transition-colors"
           >
             Quick Add
           </button>
         </div>
      </motion.div>

      <div className="flex justify-between items-start px-1">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-black transition-colors">{title}</h3>
          <p className="text-xs text-neutral-500 mt-1.5 font-medium">{category}</p>
        </div>
        <div className="flex gap-1.5 mt-1">
           <div className="w-3.5 h-3.5 rounded-full bg-[#8fa4b8] border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform origin-center"></div>
           <div className="w-3.5 h-3.5 rounded-full bg-neutral-800 border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform origin-center"></div>
        </div>
      </div>
      <p className="text-sm mt-2 font-bold px-1">${price}</p>
    </a>
  </motion.div>
  );
};
