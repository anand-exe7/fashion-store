'use client';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const LovedByThousands = () => {
  const images = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1485231183945-fdc92215a3c1?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550614000-4b95d4662d5f?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515347619253-12a84360a775?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop"
  ];

  return (
    <section className="py-24 bg-neutral-100 text-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight">Loved by Thousands</h2>
        <p className="text-neutral-500 mb-12 text-sm md:text-base">Join our community of happy customers</p>
      </motion.div>
      
      <div className="flex gap-4 px-6 md:px-12 overflow-x-auto pb-8 snap-x no-scrollbar">
        {images.map((img, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="min-w-[220px] md:min-w-[280px] aspect-[4/5] bg-neutral-200 rounded-2xl flex-shrink-0 snap-center relative overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow"
          >
            <img src={img} alt="User Generated Content" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center z-10">
              <div className="flex gap-1 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                {[1,2,3,4,5].map(star => <span key={star} className="text-yellow-500 text-[10px]">★</span>)}
              </div>
              <div className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300 shadow-sm hover:scale-110">
                <ArrowRight className="w-4 h-4 text-black" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
