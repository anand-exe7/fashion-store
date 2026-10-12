'use client';
import { ProductCard } from '../ui/ProductCard';
import { listingPrice } from '@/lib/price';
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

export const BestSellers = ({ products }: { products?: any[] }) => {
  const all = products || [];

  // The admin picks these, product by product, in Inventory. This used to be
  // `.filter(p => !p.isNew)` — the 4 newest products that happened not to be
  // flagged New Arrival, which had nothing to do with what sold.
  const picked = all.filter(p => p.isBestSeller);

  // Until anything is ticked (and on a database without the 0006 column) keep
  // the old selection, so the row never silently empties.
  const chosen = picked.length > 0 ? picked : all.filter(p => !p.isNew);

  const displayProducts = chosen
    .slice(0, 4)
    .map(p => ({
      id: p.id,
      title: p.name,
      category: p.category,
      price: listingPrice(p.price, p.variants).price,
      priceFrom: listingPrice(p.price, p.variants).from,
      originalPrice: p.originalPrice,
      isNew: p.isNew,
      // Was missing, so an out-of-stock best seller never showed its badge.
      stock: p.stock,
      discount: p.discountLabel,
      // No stock-photo stand-in — see NewArrivals.
      image: p.images?.[0]?.url || ''
    }));

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 px-3 sm:px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col items-center mb-10 sm:mb-16">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-500 mb-2">Our Signatures</span>
        <RevealText as="h2" text="Best Sellers" className="text-4xl sm:text-5xl md:text-7xl font-bold mb-8 sm:mb-12 tracking-tighter uppercase leading-[0.88] text-center" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 sm:gap-8 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400"
        >
          <a href="/products" className="pb-2 underline underline-offset-8 transition-colors hover:text-black">Shop all products</a>
        </motion.div>
      </div>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8"
      >
        {displayProducts.map((p, i) => (
          <ProductCard key={i} {...p} />
        ))}
      </motion.div>
    </section>
  );
};
