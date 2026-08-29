'use client';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';

const itemVariants: any = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } }
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
    <a href={`/product/${id}`} className="block h-full cursor-pointer">
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
           className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-40 grayscale-[0.5]' : ''}`}
         />
         {/* Overlay gradient */}
         <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
         
         {/* Badges */}
         <div className="absolute top-4 left-4 flex gap-2 z-10 flex-wrap">
           {isOutOfStock && <span className="px-3 py-1.5 bg-neutral-900/90 text-white text-[10px] font-bold uppercase tracking-widest rounded-md shadow-lg">Out of Stock</span>}
           {isNew && !isOutOfStock && <span className="px-3 py-1.5 bg-white/95 text-[10px] font-bold uppercase tracking-widest rounded-md text-black shadow-lg">New</span>}
           {discount && !isOutOfStock && <span className="px-3 py-1.5 bg-red-500/95 text-white text-[10px] font-bold uppercase tracking-widest rounded-md shadow-lg">{discount}</span>}
         </div>
         
         {/* View product slide up */}
         <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10">
           <span className="block w-full bg-white/95 text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl text-center hover:bg-black hover:text-white transition-colors">
             {isOutOfStock ? 'View Details' : 'View Product'}
           </span>
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
      <p className="text-sm mt-2 font-bold px-1">₹{price}</p>
    </a>
  </motion.div>
  );
};
