'use client';
import { ProductCard } from '../ui/ProductCard';
import { RevealText } from '../ui/RevealText';
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

export const NewArrivals = () => {
  const products = [
    { title: "Cozy Fleece Hoodie", category: "Women's Apparel", price: "89.00", isNew: true, discount: "-20%", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop" },
    { title: "Classic Denim Jacket", category: "Men's Outerwear", price: "120.00", isNew: true, image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=800&auto=format&fit=crop" },
    { title: "Oversized Graphic Tee", category: "Men's Apparel", price: "45.00", image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=800&auto=format&fit=crop" }
  ];

  return (
    <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col mb-20">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-500 mb-2">Curated Selection</span>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 md:gap-0">
          <RevealText as="h2" text={"New\nArrivals"} className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.85]" />
          <a href="/products" className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-8 hover:text-neutral-500 transition-colors">Discover All</a>
        </div>
      </div>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10"
      >
        {products.map((p, i) => (
          <ProductCard key={i} {...p} />
        ))}
      </motion.div>
    </section>
  );
};
