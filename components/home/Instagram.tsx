'use client';
import { motion } from 'framer-motion';
import { Magnetic } from '../ui/Magnetic';

export const Instagram = () => {
  const images = [
    "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?q=80&w=400&auto=format&fit=crop"
  ];

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col items-center">
        <h2 className="text-3xl font-semibold mb-3 tracking-tight">Follow us on Instagram</h2>
        <p className="text-neutral-500 mb-6 text-sm font-medium">@shalistone_official</p>
        <Magnetic strength={0.3} className="mb-12">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center bg-black text-white px-8 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all shadow-md hover:shadow-lg active:scale-95">
            Open Instagram
          </a>
        </Magnetic>
      </motion.div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {images.map((img, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="aspect-square bg-neutral-100 rounded-xl overflow-hidden cursor-pointer group shadow-sm"
          >
            <img src={img} alt="Instagram" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </section>
  );
};
