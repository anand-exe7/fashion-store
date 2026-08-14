'use client';
import { motion } from 'framer-motion';

export const Hero = () => {
  const title = "Made to Stand Out".split(" ");

  return (
    <section className="relative h-[100svh] bg-neutral-900 flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <img 
          src="https://images.unsplash.com/photo-1550614000-4b95d4662d5f?q=80&w=2000&auto=format&fit=crop" 
          alt="Hero Fashion" 
          className="w-full h-full object-cover object-top opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </motion.div>
      
      <div className="relative z-10 text-center text-white mt-40 flex flex-col items-center px-4 w-full">
        <div className="overflow-hidden mb-6 flex gap-3 md:gap-6 flex-wrap justify-center max-w-5xl">
          {title.map((word, i) => (
            <motion.span
              key={i}
              initial={{ y: "100%", opacity: 0, rotateZ: 5 }}
              animate={{ y: 0, opacity: 1, rotateZ: 0 }}
              transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-7xl lg:text-[7rem] font-semibold tracking-tight drop-shadow-2xl inline-block"
            >
              {word}
            </motion.span>
          ))}
        </div>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1, ease: "easeOut" }}
          className="text-xs md:text-sm tracking-[0.3em] mb-12 opacity-90 uppercase font-medium"
        >
          CREATE YOUR OWN LOOK WITH US
        </motion.p>
        
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
          whileHover={{ scale: 1.05, backgroundColor: "#e5e5e5" }}
          whileTap={{ scale: 0.95 }}
          className="bg-white text-black px-12 py-4 rounded-full font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.3)]"
        >
          Shop Collection
        </motion.button>
      </div>

      {/* Floating User Card */}
      <motion.div 
        initial={{ opacity: 0, x: 50, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 1, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-8 right-8 bg-white/10 backdrop-blur-xl border border-white/20 p-2 pr-6 rounded-full flex items-center gap-3 shadow-2xl z-10 hover:bg-white/20 transition-all cursor-pointer group"
      >
        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="User" className="w-10 h-10 rounded-full object-cover border-2 border-white/50 group-hover:border-white transition-colors" />
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-white tracking-wide">Jane Doe</span>
          <span className="text-[10px] text-white/70 font-medium">purchased a leather jacket</span>
        </div>
      </motion.div>
    </section>
  );
};
