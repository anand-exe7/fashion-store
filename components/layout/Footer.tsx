'use client';
import { motion } from 'framer-motion';

export const Footer = () => {
  return (
    <footer className="bg-neutral-950 text-white pt-24 pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-16 border-b border-neutral-800 pb-16">
        <div>
           <h4 className="font-semibold mb-8 text-lg">Shop</h4>
           <ul className="space-y-4 text-sm text-neutral-400 font-medium">
             {['Men', 'Women', 'Kids', 'Accessories', 'Sale'].map(link => (
                <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
             ))}
           </ul>
        </div>
        <div>
           <h4 className="font-semibold mb-8 text-lg">Help</h4>
           <ul className="space-y-4 text-sm text-neutral-400 font-medium">
             {['Customer Service', 'Track Order', 'Returns & Exchanges', 'Shipping', 'FAQs'].map(link => (
                <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
             ))}
           </ul>
        </div>
        <div>
           <h4 className="font-semibold mb-8 text-lg">Company</h4>
           <ul className="space-y-4 text-sm text-neutral-400 font-medium">
             {['About Us', 'Careers', 'Sustainability', 'Press', 'Contact'].map(link => (
                <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
             ))}
           </ul>
        </div>
        <div>
           <h4 className="font-semibold mb-8 text-lg">Stay Connected</h4>
           <p className="text-sm text-neutral-400 mb-6 font-medium leading-relaxed">Sign up for updates and exclusive offers.</p>
           <div className="flex flex-wrap gap-2 mb-8 relative group">
             <input type="email" placeholder="Email" className="min-w-0 flex-1 px-5 py-3.5 bg-neutral-900 border border-neutral-800 rounded-lg outline-none text-sm placeholder:text-neutral-500 focus:border-neutral-600 transition-colors group-hover:border-neutral-700" />
             <button className="shrink-0 bg-white text-black px-6 py-3.5 rounded-lg font-semibold text-sm hover:bg-neutral-200 transition-colors active:scale-95">Join</button>
           </div>
           <div className="flex gap-4">
             {['In', 'Fb', 'Tw'].map(social => (
               <a key={social} href="#" className="w-10 h-10 rounded-full bg-neutral-900 hover:bg-neutral-800 transition-colors flex items-center justify-center text-sm font-medium hover:scale-110 active:scale-95">
                 {social}
               </a>
             ))}
           </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto flex flex-col items-center overflow-hidden">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-[12vw] sm:text-[10vw] md:text-[9vw] lg:text-[8vw] font-bold leading-none tracking-tighter mb-12 opacity-90 flex items-center justify-center select-none w-full"
        >
          SHALISTONE <span className="text-[8vw] sm:text-[7vw] md:text-[6vw] lg:text-[5vw] ml-2 md:ml-4 text-neutral-600 hover:rotate-90 transition-transform duration-700">*</span>
        </motion.div>
        <div className="grid w-full grid-cols-1 items-center gap-4 pt-8 text-xs text-neutral-500 font-medium md:grid-cols-3">
          <p className="text-center md:text-left">© 2026 Shalistone. All Rights Reserved.</p>
          <p className="text-center">
            Powered by{' '}
            <a href="https://www.cenexasystems.com" target="_blank" rel="noreferrer" className="text-neutral-300 hover:text-white transition-colors">
              Cenexa Systems
            </a>
          </p>
          <div className="flex justify-center gap-6 md:justify-end">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
