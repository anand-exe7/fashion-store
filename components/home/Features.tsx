'use client';
import { ShieldCheck, Truck, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const Features = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const features = [
    {
      icon: Sparkles,
      title: 'Skin-Safe Fabrics',
      desc: '100% soft cotton and hypoallergenic materials — gentle on your child\'s skin.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Payment',
      desc: 'Your payment information is strictly encrypted and completely safe with us.',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      desc: 'Quick and reliable shipping across India. Get your order within 3–5 days.',
    },
    {
      icon: RefreshCw,
      title: 'Easy Returns',
      desc: 'Hassle-free 7-day returns and exchanges. No questions asked.',
    },
  ];

  return (
    <section className="pt-10 pb-20 md:pt-14 md:pb-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-neutral-200">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center md:text-left"
      >
        {features.map((f) => (
          <motion.div key={f.title} variants={itemVariants} className="flex flex-col items-center md:items-start group">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-5 group-hover:bg-neutral-200 transition-colors">
              <f.icon className="w-7 h-7 text-neutral-800 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
            </div>
            <h4 className="font-semibold mb-2 text-base">{f.title}</h4>
            <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
