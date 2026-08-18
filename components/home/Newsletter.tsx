'use client';
import { motion } from 'framer-motion';
import { RevealText } from '../ui/RevealText';

export const Newsletter = () => {
  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="bg-white rounded-[2rem] p-4 relative flex flex-col md:flex-row min-h-[500px] shadow-sm border border-black/5 group"
      >
        <div className="w-full md:w-1/3 p-8 md:p-12 flex flex-col justify-center bg-white z-10">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 mb-4 block">Visit Us</span>
          <RevealText as="h2" text={"Our\nLocation"} className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter leading-[0.9] uppercase" />
          <p className="text-neutral-500 mb-8 text-xs md:text-sm tracking-widest uppercase font-medium leading-relaxed">
            Experience Shalistone in person. Visit our flagship studio to explore the collections, meet our stylists, and discover exclusive pieces.
          </p>
          <div className="flex flex-col gap-4 text-sm font-bold tracking-widest text-black">
            <p>123 FASHION AVENUE</p>
            <p>NEW YORK, NY 10012</p>
            <p className="mt-4 text-neutral-400">MON-SAT: 10AM - 7PM</p>
            <p className="text-neutral-400">SUN: 11AM - 5PM</p>
          </div>
        </div>
        
        <div className="w-full md:w-2/3 h-[400px] md:h-auto rounded-xl overflow-hidden relative">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.366224168019!2d-73.99849208459424!3d40.73200787932938!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259972b9a7c35%3A0xc66df952112e4b47!2sWashington%20Square%20Park!5e0!3m2!1sen!2sus!4v1655132204780!5m2!1sen!2sus" 
            width="100%" 
            height="100%" 
            style={{ border: 0, filter: 'grayscale(100%) contrast(1.2)' }} 
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
          ></iframe>
        </div>
      </motion.div>
    </section>
  );
};
