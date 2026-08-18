'use client';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { RevealText } from '../ui/RevealText';

export const CategoryGrid = () => {
  const categories = [
    {
      title: "Outwear",
      desc: "Light, flowy, easy",
      bgColor: "bg-[#D5EAD8]", // light pastel green
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Tops",
      desc: "Cute meets comfy",
      bgColor: "bg-[#FCD3E1]", // light pastel pink
      image: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Bottoms",
      desc: "Relaxed fits, always",
      bgColor: "bg-[#D3EAFC]", // light pastel blue
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Accessories",
      desc: "Small things, big vibe",
      bgColor: "bg-[#FCEFD3]", // light pastel yellow
      image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=800&auto=format&fit=crop"
    }
  ];

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col mb-16">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-500 mb-2">Curated Wardrobe</span>
        <RevealText as="h2" text={"Shop By\nCategory"} className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.85]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => window.location.href = '/products'}
            className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-end"
          >
            {/* Background image */}
            <img 
              src={cat.image} 
              alt={cat.title} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105 ease-out"
            />
            
            {/* Floating label at the bottom */}
            <div className="relative z-10 p-4 w-full">
              <div className={`${cat.bgColor} rounded-2xl p-5 md:p-6 text-center shadow-lg transition-transform duration-500 group-hover:-translate-y-1 flex flex-col items-center justify-center`}>
                <h3 className="text-lg md:text-xl font-bold text-neutral-900 tracking-tight">{cat.title}</h3>
                <p className="text-xs text-neutral-600 mt-1 font-medium">{cat.desc}</p>
                
                {/* Expandable shop now button on hover */}
                <div className="h-0 overflow-hidden group-hover:h-10 group-hover:mt-4 transition-all duration-300 ease-out flex items-center justify-center w-full">
                  <span className="bg-black text-white px-5 py-2.5 rounded-full text-[9px] font-bold tracking-widest uppercase flex items-center gap-2 shadow-md">
                    Shop Now <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
