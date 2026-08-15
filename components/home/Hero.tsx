'use client';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';

export const Hero = () => {
  const { scrollY } = useScroll();
  
  // Mouse position tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring physics for mouse
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Mouse Parallax Transforms
  const mouseX1 = useTransform(smoothMouseX, [-1000, 1000], [-30, 30]);
  const mouseY1 = useTransform(smoothMouseY, [-1000, 1000], [-30, 30]);
  
  const mouseX2 = useTransform(smoothMouseX, [-1000, 1000], [50, -50]);
  const mouseY2 = useTransform(smoothMouseY, [-1000, 1000], [50, -50]);
  
  const mouseX3 = useTransform(smoothMouseX, [-1000, 1000], [-15, 15]);
  const mouseY3 = useTransform(smoothMouseY, [-1000, 1000], [-15, 15]);
  
  const textMouseX = useTransform(smoothMouseX, [-1000, 1000], [-10, 10]);
  const textMouseY = useTransform(smoothMouseY, [-1000, 1000], [-10, 10]);

  // Scroll Parallax transforms
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -200]);
  const y3 = useTransform(scrollY, [0, 1000], [0, 350]);
  const y4 = useTransform(scrollY, [0, 1000], [0, -350]);
  const y5 = useTransform(scrollY, [0, 1000], [0, 150]);
  
  const scale = useTransform(scrollY, [0, 800], [1, 1.2]);
  const opacity = useTransform(scrollY, [0, 800], [1, 0]);
  const bgY = useTransform(scrollY, [0, 1000], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const targetX = typeof window !== 'undefined' ? e.clientX - window.innerWidth / 2 : 0;
    const targetY = typeof window !== 'undefined' ? e.clientY - window.innerHeight / 2 : 0;
    mouseX.set(targetX);
    mouseY.set(targetY);
  };

  return (
    <section 
      onMouseMove={handleMouseMove}
      className="relative h-[100svh] w-full bg-[#F5F2EB] overflow-hidden flex items-center justify-center"
    >
      {/* Noise Overlay */}
      <div 
        className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-multiply"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />

      {/* Full Screen Background Image with Parallax */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 z-0"
      >
        <motion.div
          animate={{ scale: [1.05, 1.15, 1.05] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full"
        >
          <img 
            src="https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=2000&auto=format&fit=crop" 
            alt="Beige Atmospheric Background" 
            className="w-full h-full object-cover opacity-60 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5F2EB]/60 via-transparent to-white" />
        </motion.div>
      </motion.div>

      {/* Center Image */}
      <motion.div 
        style={{ scale, opacity, x: mouseX3, y: mouseY3 }}
        className="absolute w-[80vw] md:w-[45vw] h-[60vh] md:h-[80vh] z-10 rounded-[3rem] md:rounded-full overflow-hidden shadow-2xl border border-black/5 opacity-90 md:opacity-100"
      >
        <img 
          src="https://images.unsplash.com/photo-1550614000-4b95d4662d5f?q=80&w=2000&auto=format&fit=crop" 
          alt="Main Fashion" 
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-black/5" />
      </motion.div>

      {/* 1. Floating Image Left (Parallax Wrapper) */}
      <motion.div style={{ y: y1, x: mouseX1 }} className="absolute left-[-10%] md:left-[5%] top-[10%] md:top-[15%] w-[40vw] md:w-[25vw] max-w-[280px] aspect-[3/4] z-20">
        <motion.div 
          animate={{ y: [0, -30, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full rounded-xl md:rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] opacity-80 md:opacity-100"
        >
          <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop" alt="Fashion 1" className="w-full h-full object-cover rounded-xl md:rounded-2xl" />
        </motion.div>
      </motion.div>

      {/* 2. Floating Image Right (Parallax Wrapper) */}
      <motion.div style={{ y: y2, x: mouseX2 }} className="absolute right-[-10%] md:right-[5%] bottom-[15%] w-[35vw] md:w-[22vw] max-w-[250px] aspect-[4/5] z-20">
        <motion.div 
          animate={{ y: [0, 40, 0], rotate: [0, -2, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full rounded-xl md:rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] opacity-80 md:opacity-100"
        >
          <img src="https://images.unsplash.com/photo-1495385794356-15371f348c31?q=80&w=800&auto=format&fit=crop" alt="Fashion 2" className="w-full h-full object-cover rounded-xl md:rounded-2xl" />
        </motion.div>
      </motion.div>

      {/* 3. Extra Image Top Right (Parallax Wrapper) */}
      <motion.div style={{ y: y3, x: mouseX1 }} className="absolute right-[10%] top-[5%] w-[20vw] max-w-[150px] aspect-square z-10 hidden md:block">
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="w-full h-full rounded-full overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.1)] opacity-90"
        >
          <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop" alt="Fashion 3" className="w-full h-full object-cover rounded-full" />
        </motion.div>
      </motion.div>

      {/* 4. Extra Image Bottom Left (Parallax Wrapper) */}
      <motion.div style={{ y: y4, x: mouseX2 }} className="absolute left-[12%] bottom-[10%] w-[22vw] max-w-[200px] aspect-[16/9] z-10 hidden md:block">
        <motion.div 
          animate={{ y: [0, 25, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="w-full h-full rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.15)] opacity-90"
        >
          <img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800&auto=format&fit=crop" alt="Fashion 4" className="w-full h-full object-cover rounded-xl" />
        </motion.div>
      </motion.div>

      {/* Foreground Content */}
      <motion.div 
        style={{ x: textMouseX, y: textMouseY }}
        className="relative z-30 text-center text-neutral-900 flex flex-col items-center justify-center w-full h-full px-4 pointer-events-none"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <h1 className="text-[16vw] sm:text-[12vw] md:text-[10rem] font-bold tracking-tighter uppercase leading-[0.85]">
            <span className="block">Elevate</span>
            <span 
              className="block text-transparent bg-clip-text bg-cover bg-center" 
              style={{ 
                WebkitBackgroundClip: 'text',
                backgroundImage: 'url(https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop)' 
              }}
            >
              Your Style
            </span>
          </h1>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-6 md:mt-8 text-[10px] md:text-sm tracking-[0.3em] md:tracking-[0.5em] uppercase font-semibold text-neutral-800 max-w-xs md:max-w-lg"
        >
          The new era of modern aesthetics.
        </motion.p>
      </motion.div>

      {/* Call to action button */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-10 md:bottom-12 z-40"
      >
        <button className="pointer-events-auto bg-black/90 backdrop-blur-md text-white px-8 md:px-12 py-4 md:py-5 rounded-full font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-xs flex items-center gap-3 transition-transform hover:scale-110 hover:bg-black shadow-[0_10px_30px_rgba(0,0,0,0.2)] group border border-black/10">
          Discover Now
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center group-hover:rotate-45 transition-transform duration-300 shadow-inner">
            <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black md:w-[12px] md:h-[12px]">
              <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </div>
        </button>
      </motion.div>
      
      {/* Animated scroll indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-12 right-12 z-40 hidden lg:flex flex-col items-center gap-2"
      >
        <span className="text-[9px] uppercase tracking-widest text-neutral-800/50 writing-vertical-rl rotate-180" style={{ writingMode: 'vertical-rl' }}>SCROLL</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-neutral-800/50 to-transparent" />
      </motion.div>
    </section>
  );
};
