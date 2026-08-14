'use client';
import { CheckCircle2, ShieldCheck, RefreshCcw, HeadphonesIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export const Features = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-neutral-200 mt-12">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left"
      >
        <motion.div variants={itemVariants} className="flex flex-col items-center md:items-start group">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-6 group-hover:bg-neutral-200 transition-colors">
            <CheckCircle2 className="w-8 h-8 text-neutral-800 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
          </div>
          <h4 className="font-semibold mb-3 text-lg">Free Shipping</h4>
          <p className="text-sm text-neutral-500 leading-relaxed">Enjoy free shipping on all orders above $100. Delivered safely to your doorstep.</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex flex-col items-center md:items-start group">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-6 group-hover:bg-neutral-200 transition-colors">
            <ShieldCheck className="w-8 h-8 text-neutral-800 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
          </div>
          <h4 className="font-semibold mb-3 text-lg">Secure Payment</h4>
          <p className="text-sm text-neutral-500 leading-relaxed">Your payment information is strictly encrypted and completely safe with us.</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex flex-col items-center md:items-start group">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-6 group-hover:bg-neutral-200 transition-colors">
            <RefreshCcw className="w-8 h-8 text-neutral-800 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-180" strokeWidth={1.5} />
          </div>
          <h4 className="font-semibold mb-3 text-lg">Free Returns</h4>
          <p className="text-sm text-neutral-500 leading-relaxed">Not happy with your order? Return it for free within 30 days. No questions asked.</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex flex-col items-center md:items-start group">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-6 group-hover:bg-neutral-200 transition-colors">
            <HeadphonesIcon className="w-8 h-8 text-neutral-800 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
          </div>
          <h4 className="font-semibold mb-3 text-lg">24/7 Support</h4>
          <p className="text-sm text-neutral-500 leading-relaxed">Our dedicated support team is always here to help you out, anytime you need.</p>
        </motion.div>
      </motion.div>
    </section>
  );
};
