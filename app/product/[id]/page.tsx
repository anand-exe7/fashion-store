'use client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion, useScroll } from 'framer-motion';
import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ArrowRight, ChevronDown } from 'lucide-react';
import { fetchProductById, fetchProducts, Product } from '@/lib/db';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('details');
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const prod = await fetchProductById(id);
        if (prod) {
          setProduct(prod);
          const sizes = Array.from(new Set(prod.variants?.map(v => v.size || 'Default') || []));
          const colors = Array.from(new Set(prod.variants?.map(v => v.colorName || 'Default') || []));
          if (sizes.length > 0) setSelectedSize(sizes[0]);
          if (colors.length > 0) setSelectedColor(colors[0]);
        }
        const all = await fetchProducts();
        setRelated(all.filter(p => p.id !== id).slice(0, 4));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const images = (product?.images && product.images.length > 0) ? product.images.map(img => typeof img === 'string' ? img : img.url) : (product?.image ? [product.image] : []);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  const containerRef = useRef<HTMLDivElement>(null);
  // Removed useScroll here to fix "Target ref is defined but not hydrated" error during loading states

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-xs uppercase tracking-widest font-bold text-neutral-500">Loading Product...</p>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-xs uppercase tracking-widest font-bold text-neutral-500">Product Not Found</p>
        </main>
      </div>
    );
  }

  const title = product.name.toUpperCase();
  const letterVariants = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } };

  // Generate unique sizes and colors
  const availableSizes = Array.from(new Set(product.variants?.map(v => v.size || 'Default') || []));
  const availableColors = Array.from(new Set(product.variants?.map(v => v.colorName || 'Default') || []));

  const handleAddToCart = () => {
    // Basic Add To Cart Mock for user local cart usage later
    const selectedVariant = product.variants?.find(v => (v.size || 'Default') === selectedSize && (v.colorName || 'Default') === selectedColor) || product.variants?.[0];
    const weightGrams = selectedVariant?.weightGrams || 500;
    
    // Get existing cart
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('cart') || '[]');
    } catch(e){}
    
    const item = {
      id: Date.now(),
      productId: product.id,
      name: product.name,
      size: selectedSize,
      color: selectedColor,
      price: product.price,
      image: images[0],
      quantity,
      weightGrams: weightGrams * quantity
    };
    
    cart.push(item);
    localStorage.setItem('cart', JSON.stringify(cart));
    router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-neutral-900 font-sans selection:bg-black selection:text-white">
      <Navbar />
      <main ref={containerRef} className="pt-24 md:pt-32 pb-16 md:pb-24 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          <div className="w-full lg:w-[55%] flex flex-col-reverse md:flex-row gap-4 h-[60vh] md:h-[75vh] lg:sticky lg:top-32">
            <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-visible w-full md:w-24 flex-shrink-0 hide-scrollbar z-10">
              {images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-20 h-24 md:w-full md:h-32 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 ${activeImage === idx ? 'ring-1 ring-neutral-900 opacity-100 scale-105 shadow-md' : 'opacity-50 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx}`} />
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
            
            <div className="relative w-full h-full bg-white/40 rounded-2xl overflow-hidden border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
              {images.length > 0 ? (
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0, filter: 'blur(10px)', scale: 1.05 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  src={images[activeImage]} 
                  className="w-full h-full object-cover" 
                  alt="Product Main" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                   <span className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">No Image</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[45%] relative">
            <div className="sticky top-32 flex flex-col pb-12">
              <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.04, delayChildren: 0.2 }} className="mb-4 overflow-hidden flex flex-wrap">
                {title.split(" ").map((word, i) => (
                  <span key={i} className="flex mr-3">
                    {word.split("").map((char, j) => (
                      <motion.span key={j} variants={letterVariants} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
                        {char}
                      </motion.span>
                    ))}
                  </span>
                ))}
              </motion.div>
              
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                <p className="text-4xl md:text-5xl font-bold mb-8 text-emerald-600 tracking-tighter">₹{product.price.toLocaleString()}</p>
                <p className="text-neutral-600 text-sm leading-relaxed mb-10 max-w-md">{product.description || "Premium exclusive collection piece."}</p>
                
                {availableColors.length > 0 && (
                  <div className="mb-8">
                    <div className="flex justify-between mb-3 w-full max-w-sm">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Color</span>
                      <span className="text-[10px] uppercase tracking-widest text-neutral-900">{selectedColor}</span>
                    </div>
                    <div className="flex gap-4">
                      {availableColors.map(color => (
                        <button 
                          key={color} 
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 text-xs font-bold uppercase rounded-full border ${selectedColor === color ? 'border-black bg-black text-white' : 'border-black/20 text-black hover:border-black'}`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {availableSizes.length > 0 && (
                  <div className="mb-10 w-full max-w-sm">
                    <div className="flex justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Size</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {availableSizes.map(size => (
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
                )}
                
                <div className="flex flex-col gap-4 mb-8 w-full max-w-sm">
                  <div className="flex gap-4 h-14">
                    <div className="flex items-center justify-between border border-black/10 rounded-full px-4 w-32 bg-white/50 backdrop-blur-sm shadow-sm">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:text-black transition-colors"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm font-semibold">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:text-black transition-colors"><Plus className="w-3 h-3" /></button>
                    </div>
                    <button 
                      onClick={handleAddToCart}
                      className="flex-1 bg-black text-white rounded-full flex items-center justify-between px-6 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all group shadow-xl hover:shadow-2xl"
                    >
                      <span>Add to Cart</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                <div className="w-full max-w-sm bg-black/5 rounded-xl p-5 mb-10 border border-black/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 mb-3">Delivery & Returns</h4>
                  <ul className="text-xs text-neutral-600 space-y-2 mb-3">
                    <li className="flex items-start"><span className="mr-2 text-black">•</span> Express Delivery: 1-2 business days (₹500)</li>
                    <li className="flex items-start"><span className="mr-2 text-black">•</span> Standard Delivery: 3-5 business days (Free over ₹20,000)</li>
                    <li className="flex items-start"><span className="mr-2 text-black">•</span> International Delivery: 7-10 business days</li>
                  </ul>
                </div>
                
                <div className="border-t border-black/10 divide-y divide-black/10 w-full max-w-sm">
                  {[
                    { id: 'details', title: 'Product Details', content: product.details || product.description || 'Premium materials and craftsmanship.' },
                    { id: 'benefits', title: 'Benefits', content: product.benefits?.join(', ') || 'High quality design.' }
                  ].map(item => (
                    <div key={item.id} className="py-5">
                      <button onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)} className="flex justify-between items-center w-full text-left group">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 group-hover:text-black transition-colors">{item.title}</span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${activeAccordion === item.id ? 'rotate-180 text-black' : ''}`} />
                      </button>
                      <motion.div initial={false} animate={{ height: activeAccordion === item.id ? 'auto' : 0, opacity: activeAccordion === item.id ? 1 : 0 }} className="overflow-hidden">
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

      <section className="border-t border-black/5 bg-[#F5F2EB] py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent z-0" />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">COMPLETE<br/>THE LOOK</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((prod, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="group cursor-pointer flex flex-col"
                onClick={() => window.location.href = `/product/${prod.id}`}
              >
                <div className="aspect-[3/4] bg-white/50 rounded-xl mb-5 overflow-hidden relative border border-black/5 shadow-sm group-hover:shadow-lg transition-shadow duration-500">
                  <img src={(typeof prod.images?.[0] === 'string' ? prod.images[0] : prod.images?.[0]?.url) || prod.image || ''} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 opacity-90 group-hover:opacity-100 transition-all duration-1000 ease-out" />
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-black text-white text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow-lg">View</span>
                  </div>
                </div>
                <h3 className="text-sm font-bold tracking-tight">{prod.name}</h3>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2">₹{prod.price.toLocaleString()}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
