'use client';
import { motion } from 'framer-motion';

const STORE_PHONE = '+919110415639';
const STORE_PHONE_DISPLAY = '+91 91104 15639';
const STORE_EMAIL = 'theshalistone@gmail.com';
const INSTAGRAM_URL = 'https://www.instagram.com/shalistone/';
const FACEBOOK_URL = 'https://www.facebook.com/share/1Bzv5BfGng/?mibextid=wwXIfr';
const YOUTUBE_URL = 'https://youtube.com/@shalistoneboyswear?si=y3cfqd_fbI6R2aQ6';

const shopLinks = [
  { label: 'All Products', href: '/products' },
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Cart', href: '/cart' },
  { label: 'My Account', href: '/profile' },
];

export const Footer = () => {
  return (
    <footer className="bg-neutral-950 text-white pt-16 pb-12 px-6 md:pt-24 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10 mb-10 border-b border-neutral-800 pb-10 sm:gap-8 md:mb-16 md:pb-16">
        <div>
           <h4 className="font-semibold mb-8 text-lg">Shop</h4>
           <ul className="space-y-4 text-sm text-neutral-400 font-medium">
             {shopLinks.map(link => (
                <li key={link.label}><a href={link.href} className="hover:text-white transition-colors">{link.label}</a></li>
             ))}
           </ul>
        </div>
        <div>
           <h4 className="font-semibold mb-8 text-lg">Visit Us</h4>
           <address className="text-sm text-neutral-400 font-medium not-italic leading-relaxed">
             No.69.1/2, 1st floor, 1st Main Rd, Ramachandrapuram,<br />
             Bengaluru, Karnataka 560021
           </address>
           <a href={`tel:${STORE_PHONE}`} className="mt-4 block text-sm text-neutral-400 font-medium hover:text-white transition-colors">
             {STORE_PHONE_DISPLAY}
           </a>
           <a href={`mailto:${STORE_EMAIL}`} className="mt-1.5 block text-sm text-neutral-400 font-medium hover:text-white transition-colors break-all">
             {STORE_EMAIL}
           </a>
        </div>
        <div className="col-span-2 md:col-span-1">
           <h4 className="font-semibold mb-8 text-lg">Follow Us</h4>
           <p className="text-sm text-neutral-400 mb-6 font-medium leading-relaxed">See our latest drops and store moments across our channels.</p>
           <div className="flex flex-wrap items-center gap-3">
             <a
               href={INSTAGRAM_URL}
               target="_blank"
               rel="noreferrer"
               aria-label="Instagram"
               className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors active:scale-95"
             >
               <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                 <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.41.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.07-1.1.05-1.7.24-2.1.4-.5.2-.9.44-1.3.84-.4.4-.64.8-.84 1.3-.16.4-.35 1-.4 2.1C2.6 9.9 2.6 10.3 2.6 12s0 2.1.06 3.3c.05 1.1.24 1.7.4 2.1.2.5.44.9.84 1.3.4.4.8.64 1.3.84.4.16 1 .35 2.1.4 1.2.06 1.6.06 4.7.06s3.5 0 4.7-.06c1.1-.05 1.7-.24 2.1-.4.5-.2.9-.44 1.3-.84.4-.4.64-.8.84-1.3.16-.4.35-1 .4-2.1.06-1.2.06-1.6.06-3.3s0-2.1-.06-3.3c-.05-1.1-.24-1.7-.4-2.1-.2-.5-.44-.9-.84-1.3-.4-.4-.8-.64-1.3-.84-.4-.16-1-.35-2.1-.4C15.5 4 15.1 4 12 4Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 8.08a3.18 3.18 0 1 0 0-6.36 3.18 3.18 0 0 0 0 6.36Zm6.24-8.28a1.14 1.14 0 1 1-2.28 0 1.14 1.14 0 0 1 2.28 0Z" />
               </svg>
             </a>
             <a
               href={FACEBOOK_URL}
               target="_blank"
               rel="noreferrer"
               aria-label="Facebook"
               className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors active:scale-95"
             >
               <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                 <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
               </svg>
             </a>
             <a
               href={YOUTUBE_URL}
               target="_blank"
               rel="noreferrer"
               aria-label="YouTube"
               className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors active:scale-95"
             >
               <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                 <path d="M23.5 6.2a3 3 0 0 0-2.11-2.12C19.5 3.56 12 3.56 12 3.56s-7.5 0-9.39.52A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.11 2.12c1.89.52 9.39.52 9.39.52s7.5 0 9.39-.52a3 3 0 0 0 2.11-2.12A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
               </svg>
             </a>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col items-center overflow-hidden">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8 md:mb-12 flex items-center justify-center gap-4 select-none w-full"
        >
          <img src="/logo.jpeg" alt="Shalistone" className="h-14 w-14 rounded-xl object-cover md:h-20 md:w-20" />
          <span className="text-[9vw] lg:text-[8vw] font-bold leading-none tracking-tighter opacity-90">
            SHALISTONE
          </span>
        </motion.div>
        <div className="grid w-full grid-cols-1 items-center gap-4 border-t border-neutral-800/80 pt-8 text-xs text-neutral-500 font-medium md:grid-cols-3">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Shalistone. All Rights Reserved
          </p>
          <p className="text-center">
            Powered by{' '}
            <a href="https://www.cenexasystems.com" target="_blank" rel="noreferrer" className="font-semibold text-neutral-200 hover:text-white transition-colors">
              Cenexa Systems
            </a>{' '}
            &copy; {new Date().getFullYear()}
          </p>
          <p className="text-center md:text-right uppercase tracking-[0.25em]">
            Made <span className="mx-1.5 text-neutral-600">&bull;</span> For <span className="mx-1.5 text-neutral-600">&bull;</span> Play
          </p>
        </div>
      </div>
    </footer>
  );
};
