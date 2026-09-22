'use client';
import { useState, useEffect } from 'react';
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

export const NewArrivals = ({ products }: { products?: any[] }) => {

  const all = products || [];
  const picked = all.filter(p => p.isNew).slice(0, 4);

  const newProducts = picked.map((p: any) => ({
    id: p.id,
    title: p.name,
    category: p.category,
    price: p.price.toLocaleString(),
    isNew: p.isNew,
    stock: p.stock,
    discount: p.discountLabel,
    image: p.images?.[0]?.url || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800'
  }));

  const cols = newProducts.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-4';

  if (newProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 md:py-32 px-3 sm:px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col mb-10 sm:mb-20">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-500 mb-2">Curated Selection</span>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-0">
          <RevealText as="h2" text="New\nArrivals" className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.88]" />
          <a href="/new-arrivals" className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-8 hover:text-neutral-500 transition-colors">Discover All</a>
        </div>
      </div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8"
      >
        {newProducts.map((p, i) => (
          <ProductCard key={i} {...p} />
        ))}
      </motion.div>
    </section>
  );
};
