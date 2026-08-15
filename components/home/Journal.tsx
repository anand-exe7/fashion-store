'use client';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Journal = () => {
  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-b border-neutral-200">
      <div className="flex justify-between items-end mb-12">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-3 tracking-tight">Journal</h2>
          <p className="text-neutral-500 text-sm">Insights, ideas, and inspiration</p>
        </motion.div>
        <a href="#" className="text-sm font-medium underline underline-offset-4 hover:text-neutral-500 transition-colors">See All</a>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Large Post */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="group cursor-pointer flex flex-col"
        >
          <div className="aspect-[16/10] bg-neutral-100 rounded-2xl mb-6 overflow-hidden relative">
             <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop" alt="Journal main" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
             <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs font-bold tracking-widest uppercase text-neutral-500 mb-3">FASHION • OCT 12, 2024</p>
          <h3 className="text-3xl font-semibold mb-4 leading-snug group-hover:text-neutral-600 transition-colors">The ultimate guide to building a capsule wardrobe for every season.</h3>
          <p className="text-neutral-500 text-sm mb-6 line-clamp-2 leading-relaxed max-w-xl">Discover the essential pieces you need to create a versatile and timeless wardrobe that works all year round.</p>
          <span className="mt-auto text-sm font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">Read More <ArrowRight className="w-4 h-4" /></span>
        </motion.div>
        
        {/* Small Posts */}
        <div className="flex flex-col justify-between gap-8 py-2">
          {[
            {
              date: "STYLE • OCT 10, 2024",
              title: "5 Ways to style a classic white t-shirt for any occasion.",
              img: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=600&auto=format&fit=crop"
            },
            {
              date: "TRENDS • OCT 08, 2024",
              title: "Why oversized silhouettes are taking over the runway.",
              img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop"
            }
          ].map((post, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="flex gap-8 group cursor-pointer h-full"
            >
              <div className="w-[40%] aspect-[4/3] bg-neutral-100 rounded-xl flex-shrink-0 overflow-hidden relative">
                 <img src={post.img} alt={post.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="flex flex-col justify-center py-2">
                <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-3">{post.date}</p>
                <h3 className="text-xl font-semibold mb-3 leading-snug group-hover:text-neutral-600 transition-colors">{post.title}</h3>
                <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mt-auto group-hover:gap-4 transition-all">Read More <ArrowRight className="w-3 h-3" /></span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
