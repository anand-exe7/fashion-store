'use client';
import { ProductCard } from '../ui/ProductCard';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export const BestSellers = () => {
  const products = [
    { title: "Classic Knit Hoodie", category: "Women", price: "89.00", discount: "-10%", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop" },
    { title: "Premium Zip Jacket", category: "Men", price: "110.00", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop" },
    { title: "Dark Wash Denim", category: "Men", price: "95.00", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop" },
    { title: "Cozy Ribbed Top", category: "Women", price: "65.00", isNew: true, image: "https://images.unsplash.com/photo-1434389670869-c8c52fc9ecf3?q=80&w=800&auto=format&fit=crop" }
  ];

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col items-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-500 mb-2">Our Signatures</span>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl font-bold mb-12 tracking-tighter uppercase leading-[0.85] text-center"
        >
          Best Sellers
        </motion.h2>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8 md:gap-12 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400"
        >
          <button className="text-black border-b-2 border-black pb-2">All</button>
          <button className="hover:text-black transition-colors pb-2">Hoodies</button>
          <button className="hover:text-black transition-colors pb-2">Shirts</button>
          <button className="hover:text-black transition-colors pb-2">Jackets</button>
        </motion.div>
      </div>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {products.map((p, i) => (
          <ProductCard key={i} {...p} />
        ))}
      </motion.div>
    </section>
  );
};
