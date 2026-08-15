'use client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ChevronDown, Plus, Minus, ShoppingBag, Heart, ArrowRight } from 'lucide-react';

export default function ProductPage() {
  const images = [
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550614000-4b95d4662d5f?q=80&w=1200&auto=format&fit=crop",
  ];

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('black');
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('details');

  const router = useRouter();

  // Auto-play gallery
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Title reveal animation
  const title = "LUMINA TRENCH COAT";
  const letterVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-neutral-900 font-sans selection:bg-black selection:text-white">
      <Navbar />
      
      <main ref={containerRef} className="pt-24 md:pt-32 pb-16 md:pb-24 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          
          {/* Left: Gallery (Auto-playing with side thumbnails) */}
          <div className="w-full lg:w-[55%] flex flex-col-reverse md:flex-row gap-4 h-[60vh] md:h-[75vh] lg:sticky lg:top-32">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-visible w-full md:w-24 flex-shrink-0 hide-scrollbar z-10">
              {images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-20 h-24 md:w-full md:h-32 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 ${activeImage === idx ? 'ring-1 ring-neutral-900 opacity-100 scale-105 shadow-md' : 'opacity-50 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx}`} />
                  
                  {/* Progress indicator for active thumbnail */}
                  {activeImage === idx && (
                    <motion.div 
                      key={`progress-${idx}`}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 4, ease: "linear" }}
                      className="absolute bottom-0 left-0 h-1 bg-black z-20"
                    />
                  )}
                </button>
              ))}
            </div>
            
            {/* Main Image */}
            <div className="relative w-full h-full bg-white/40 rounded-2xl overflow-hidden border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
              <motion.img 
                key={activeImage}
                initial={{ opacity: 0, filter: 'blur(10px)', scale: 1.05 }}
                animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                src={images[activeImage]} 
                className="w-full h-full object-cover" 
                alt="Product Main" 
              />
              
              {/* Floating aesthetic elements */}
              <div className="absolute top-6 right-6 flex flex-col gap-2 z-10">
                <span className="bg-white/80 backdrop-blur-md px-3 py-1 text-[10px] uppercase tracking-widest rounded-full border border-black/5 shadow-md text-black">New Arrival</span>
              </div>
            </div>
          </div>

          {/* Right: Sticky Product Info */}
          <div className="w-full lg:w-[45%] relative">
            <div className="sticky top-32 flex flex-col pb-12">
              <motion.div 
                initial="hidden" 
                animate="visible" 
                transition={{ staggerChildren: 0.04, delayChildren: 0.2 }}
                className="mb-4 overflow-hidden flex flex-wrap"
              >
                {title.split(" ").map((word, i) => (
                  <span key={i} className="flex mr-3">
                    {word.split("").map((char, j) => (
                      <motion.span 
                        key={j} 
                        variants={letterVariants}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </span>
                ))}
              </motion.div>
              
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                <p className="text-4xl md:text-5xl font-bold mb-8 text-emerald-600 tracking-tighter">₹39,500</p>
                
                <p className="text-neutral-600 text-sm leading-relaxed mb-10 max-w-md">
                  Crafted from premium water-resistant gabardine, the Lumina Trench Coat merges classic tailoring with avant-garde proportions. Designed for motion and architectural fluidity.
                </p>
                
                {/* Colors */}
                <div className="mb-8">
                  <div className="flex justify-between mb-3 w-full max-w-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Color</span>
                    <span className="text-[10px] uppercase tracking-widest text-neutral-900">{selectedColor}</span>
                  </div>
                  <div className="flex gap-4">
                    {[
                      { id: 'noir', color: '#111' },
                      { id: 'bone', color: '#D4C5B9' },
                      { id: 'moss', color: '#4A503D' }
                    ].map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => setSelectedColor(c.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${selectedColor === c.id ? 'ring-1 ring-offset-4 ring-offset-[#F5F2EB] ring-black scale-110 shadow-md' : 'opacity-70 hover:opacity-100 hover:scale-110'}`}
                      >
                        <span className="w-full h-full rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: c.color }} />
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Sizes */}
                <div className="mb-10 w-full max-w-sm">
                  <div className="flex justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Size</span>
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-[10px] text-neutral-800 uppercase tracking-widest underline underline-offset-4 opacity-70 hover:opacity-100 transition-opacity">Size Guide</a>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                      <button 
                        key={size} 
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 text-[10px] font-bold tracking-widest transition-all rounded-md border ${selectedSize === size ? 'bg-black text-white border-black shadow-md' : 'bg-white border-black/10 text-neutral-900 hover:border-black/30 shadow-sm'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col gap-4 mb-8 w-full max-w-sm">
                  <div className="flex gap-4 h-14">
                    <div className="flex items-center justify-between border border-black/10 rounded-full px-4 w-32 bg-white/50 backdrop-blur-sm shadow-sm">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:text-black transition-colors"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm font-semibold">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:text-black transition-colors"><Plus className="w-3 h-3" /></button>
                    </div>
                    <button 
                      onClick={() => router.push('/cart')}
                      className="flex-1 bg-black text-white rounded-full flex items-center justify-between px-6 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all group shadow-xl hover:shadow-2xl"
                    >
                      <span>Add to Cart</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Delivery Information (Always Visible) */}
                <div className="w-full max-w-sm bg-black/5 rounded-xl p-5 mb-10 border border-black/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 mb-3">Delivery & Returns</h4>
                  <ul className="text-xs text-neutral-600 space-y-2 mb-3">
                    <li className="flex items-start"><span className="mr-2 text-black">•</span> Express Delivery: 1-2 business days (₹500)</li>
                    <li className="flex items-start"><span className="mr-2 text-black">•</span> Standard Delivery: 3-5 business days (Free over ₹20,000)</li>
                    <li className="flex items-start"><span className="mr-2 text-black">•</span> International Delivery: 7-10 business days</li>
                  </ul>
                  <p className="text-xs text-neutral-500 pt-3 border-t border-black/10">
                    Returns are accepted within 30 days of delivery. Items must be unworn and in original condition.
                  </p>
                </div>
                
                <div className="border-t border-black/10 divide-y divide-black/10 w-full max-w-sm">
                  {[
                    { id: 'details', title: 'Product Details', content: 'Designed in Paris. 100% Gabardine. Oversized structural fit. Dry clean only. Do not tumble dry. Unlined interior for fluidity.' },
                    { id: 'sustainability', title: 'Sustainability', content: 'Crafted using recycled water and eco-friendly dyes. We are committed to a zero-carbon footprint by 2030.' }
                  ].map(item => (
                    <div key={item.id} className="py-5">
                      <button 
                        onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)}
                        className="flex justify-between items-center w-full text-left group"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 group-hover:text-black transition-colors">{item.title}</span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${activeAccordion === item.id ? 'rotate-180 text-black' : ''}`} />
                      </button>
                      <motion.div 
                        initial={false}
                        animate={{ height: activeAccordion === item.id ? 'auto' : 0, opacity: activeAccordion === item.id ? 1 : 0 }}
                        className="overflow-hidden"
                      >
                        <p className="pt-4 text-xs text-neutral-500 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                      </motion.div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Related Products Section */}
      <section className="border-t border-black/5 bg-[#F5F2EB] py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent z-0" />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">COMPLETE<br/>THE LOOK</h2>
            <a href="#" onClick={(e) => e.preventDefault()} className="text-[10px] uppercase tracking-widest underline underline-offset-4 hidden sm:block hover:text-neutral-500 transition-colors">View Collection &rarr;</a>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { name: "Silk Slip Dress", price: "₹18,500", img: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=600&auto=format&fit=crop" },
              { name: "Architectural Boots", price: "₹28,400", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop" },
              { name: "Oversized Shades", price: "₹14,800", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop" },
              { name: "Minimalist Tote", price: "₹34,000", img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600&auto=format&fit=crop" }
            ].map((prod, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="group cursor-pointer flex flex-col"
                onClick={() => window.location.href = '/product'}
              >
                <div className="aspect-[3/4] bg-white/50 rounded-xl mb-5 overflow-hidden relative border border-black/5 shadow-sm group-hover:shadow-lg transition-shadow duration-500">
                  <img src={prod.img} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 opacity-90 group-hover:opacity-100 transition-all duration-1000 ease-out" />
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-black text-white text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow-lg">View</span>
                  </div>
                </div>
                <h3 className="text-sm font-bold tracking-tight">{prod.name}</h3>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2">{prod.price}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
