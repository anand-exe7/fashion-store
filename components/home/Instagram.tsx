'use client';
import { motion } from 'framer-motion';

export const Instagram = () => {
  const images = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1485231183945-fdc92215a3c1?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550614000-4b95d4662d5f?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515347619253-12a84360a775?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop"
  ];

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="text-3xl font-semibold mb-3 tracking-tight">Follow us on Instagram</h2>
        <p className="text-neutral-500 mb-12 text-sm font-medium">@ecom_fashion_official</p>
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
