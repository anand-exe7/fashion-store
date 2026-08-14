'use client';
import { ProductCard } from '../ui/ProductCard';
import { motion } from 'framer-motion';

export const SeasonalDrop = () => {
  const products = [
    { title: "Puffer Jacket", category: "Men's Outerwear", price: "150.00", discount: "-15%", image: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800&auto=format&fit=crop" },
    { title: "Knit Sweater", category: "Women's Apparel", price: "95.00", isNew: true, image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop" },
    { title: "Kids Puffer", category: "Kids' Outerwear", price: "75.00", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=800&auto=format&fit=crop" },
    { title: "Kids Sweater", category: "Kids' Apparel", price: "55.00", image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800&auto=format&fit=crop" }
  ];

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Large Left Tile */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-1 relative bg-neutral-800 rounded-3xl overflow-hidden min-h-[600px] flex p-10 items-start group shadow-2xl"
        >
           <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop" alt="Seasonal" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90" />
           <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-transparent z-0" />
           
           <div className="relative z-10 w-full flex justify-between items-start pt-2">
             <h2 className="text-white text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight drop-shadow-xl font-sans">
               Seasonal<br/>Drop
             </h2>
             <button className="bg-white text-black px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-neutral-200 hover:scale-105 transition-all shadow-xl active:scale-95">
               Shop
             </button>
           </div>
        </motion.div>
        
        {/* Right Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {products.map((p, i) => (
            <ProductCard key={i} {...p} delay={i * 0.15} />
          ))}
        </div>
      </div>
    </section>
  );
};
