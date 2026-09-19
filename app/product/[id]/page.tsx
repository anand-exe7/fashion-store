'use client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion, useScroll } from 'framer-motion';
import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ArrowRight, ChevronDown } from 'lucide-react';
import { fetchProductById, fetchProducts, fetchSuggestions, formatAgeRange, Product } from '@/lib/db';

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
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const prod = await fetchProductById(id);
        if (prod) {
          setProduct(prod);
          const activeVars = prod.variants?.filter(v => v.isAvailable !== false) || [];
          const sizes = Array.from(new Set(activeVars.map(v => v.size || 'Default')));
          const colors = Array.from(new Set(activeVars.map(v => v.colorName || 'Default')));
          if (sizes.length > 0) setSelectedSize(sizes[0]);
          if (colors.length > 0) setSelectedColor(colors[0]);
        }
        const curated = await fetchSuggestions(id);
        if (curated.length > 0) {
          setRelated(curated.slice(0, 4));
        } else {
          // No admin-curated suggestions yet — fall back to same-category picks.
          const all = await fetchProducts();
          const pool = all.filter(p => p.id !== id);
          const sameCategory = prod ? pool.filter(p => p.category === prod.category) : [];
          const fallback = (sameCategory.length > 0 ? sameCategory : pool)
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);
          setRelated(fallback);
        }
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

  const title = (product.name || 'Untitled Product').toUpperCase();
  const letterVariants = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } };

  const currentVariant = product.variants?.find(v => (v.size || 'Default') === selectedSize && (v.colorName || 'Default') === selectedColor);
  const currentStock = currentVariant ? currentVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;

  // Filter out disabled variants
  const activeVariants = product.variants?.filter(v => v.isAvailable !== false) || [];

  // Generate unique sizes and colors globally for the product
  const availableSizes = Array.from(new Set(activeVariants.map(v => v.size || 'Default')));
  const availableColors = Array.from(new Set(activeVariants.map(v => v.colorName || 'Default')));
  
  // Get sizes specific to the currently selected color
  const sizesForCurrentColor = activeVariants.filter(v => (v.colorName || 'Default') === selectedColor);
  const uniqueSizesForCurrentColor = Array.from(new Set(sizesForCurrentColor.map(v => v.size || 'Default')));
  const getStockForVariant = (size: string, color: string) => {
    const v = activeVariants.find(v => (v.size || 'Default') === size && (v.colorName || 'Default') === color);
    return v ? v.stock : 0;
  };
  
  const getTotalStockForColor = (color: string) => {
    return activeVariants.filter(v => (v.colorName || 'Default') === color).reduce((sum, v) => sum + v.stock, 0);
  };

  const getAgeRangeForSize = (size: string) => {
    const v = activeVariants.find(v => (v.size || 'Default') === size && (v.colorName || 'Default') === selectedColor)
      || activeVariants.find(v => (v.size || 'Default') === size);
    return v ? formatAgeRange(v.ageMinMonths, v.ageMaxMonths) : '';
  };

  const productAgeRange = formatAgeRange(product.ageMinMonths, product.ageMaxMonths);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    if (getStockForVariant(selectedSize, color) <= 0) {
      const availableSizeForColor = activeVariants.find(v => (v.colorName || 'Default') === color && v.stock > 0);
      if (availableSizeForColor) {
        setSelectedSize(availableSizeForColor.size || 'Default');
      }
    }
  };

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
          <div className="w-full lg:w-[55%] flex flex-col gap-12">
            <div className="flex flex-col-reverse md:flex-row gap-4">
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
            
            <div className="relative w-full aspect-[3/4] bg-white/40 rounded-2xl overflow-hidden border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
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
                <div className="flex items-center gap-3 mb-8">
                  <p className="text-4xl md:text-5xl font-bold text-emerald-600 tracking-tighter">₹{(product.price || 0).toLocaleString()}</p>
                  {productAgeRange && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 border border-black/10 rounded-full px-3 py-1.5">
                      Ages {productAgeRange}
                    </span>
                  )}
                </div>
                <p className="text-neutral-600 text-sm leading-relaxed mb-10 max-w-md">{product.description || "Premium exclusive collection piece."}</p>
                
                {availableColors.length > 0 && (
                  <div className="mb-8">
                    <div className="flex justify-between mb-3 w-full max-w-sm">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Color</span>
                      <span className="text-[10px] uppercase tracking-widest text-neutral-900">{selectedColor}</span>
                    </div>
                    <div className="flex gap-4">
                      {availableColors.map(color => {
                        const isColorOutOfStock = getTotalStockForColor(color) <= 0;
                        return (
                          <button 
                            key={color} 
                            onClick={() => !isColorOutOfStock && handleColorSelect(color)}
                            disabled={isColorOutOfStock}
                            className={`px-4 py-2 text-xs font-bold uppercase rounded-full border transition-all ${
                              isColorOutOfStock 
                                ? 'border-black/10 text-neutral-400 bg-neutral-100 cursor-not-allowed line-through'
                                : selectedColor === color 
                                  ? 'border-black bg-black text-white' 
                                  : 'border-black/20 text-black hover:border-black'
                            }`}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {availableSizes.length > 0 && (
                  <div className="mb-10 w-full max-w-sm">
                    <div className="flex justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Size</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {uniqueSizesForCurrentColor.map(size => {
                        const isSizeOutOfStock = getStockForVariant(size, selectedColor) <= 0;
                        const sizeAgeRange = getAgeRangeForSize(size);

                        return (
                          <button
                            key={size}
                            onClick={() => !isSizeOutOfStock && setSelectedSize(size)}
                            disabled={isSizeOutOfStock}
                            className={`relative py-3 text-[10px] font-bold tracking-widest transition-all rounded-md border flex flex-col items-center gap-0.5 ${
                              isSizeOutOfStock
                                ? 'bg-neutral-100 border-black/5 text-neutral-400 cursor-not-allowed'
                                : selectedSize === size
                                  ? 'bg-black text-white border-black shadow-md'
                                  : 'bg-white border-black/10 text-neutral-900 hover:border-black/30 shadow-sm'
                            }`}
                          >
                            {size}
                            {sizeAgeRange && <span className="text-[8px] font-medium normal-case tracking-normal opacity-70">{sizeAgeRange}</span>}
                            {isSizeOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                <div className="w-full h-[1px] bg-neutral-300 transform -rotate-45" />
                              </div>
                            )}
                          </button>
                        );
                      })}
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
                      disabled={isOutOfStock}
                      className={`flex-1 rounded-full flex items-center justify-between px-6 text-[10px] font-bold tracking-[0.2em] uppercase transition-all group shadow-xl ${isOutOfStock ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-black text-white hover:bg-neutral-800 hover:shadow-2xl'}`}
                    >
                      <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                      {!isOutOfStock && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
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
                    { id: 'details', title: 'Product Details', content: <p className="pt-4 text-xs text-neutral-500 leading-relaxed whitespace-pre-wrap">{product.details || product.description || 'Premium materials and craftsmanship.'}</p> },
                    { id: 'benefits', title: 'Benefits', content: <p className="pt-4 text-xs text-neutral-500 leading-relaxed whitespace-pre-wrap">{product.benefits?.join(', ') || 'High quality design.'}</p> }
                  ].map(item => (
                    <div key={item.id} className="py-5">
                      <button onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)} className="flex justify-between items-center w-full text-left group">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 group-hover:text-black transition-colors">{item.title}</span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${activeAccordion === item.id ? 'rotate-180 text-black' : ''}`} />
                      </button>
                      <motion.div initial={false} animate={{ height: activeAccordion === item.id ? 'auto' : 0, opacity: activeAccordion === item.id ? 1 : 0 }} className="overflow-hidden">
                        {item.content}
                      </motion.div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Size Chart Section (Full Width Below) */}
        <div className="w-full mt-8 lg:mt-12 bg-white/40 rounded-2xl border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
          <button 
            onClick={() => setIsSizeGuideOpen(!isSizeGuideOpen)}
            className="w-full p-6 md:p-8 flex justify-between items-center bg-white/60 hover:bg-white/80 transition-colors"
          >
            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Size Guide</h3>
            <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform duration-300 ${isSizeGuideOpen ? 'rotate-180 text-black' : ''}`} />
          </button>
          
          <motion.div 
            initial={false} 
            animate={{ height: isSizeGuideOpen ? 'auto' : 0, opacity: isSizeGuideOpen ? 1 : 0 }} 
            className="overflow-hidden"
          >
            <div className="p-6 md:p-8 pt-0 flex flex-col sm:flex-row gap-6 sm:gap-8">
              <div className="flex-1 space-y-3">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-neutral-900">Shirt / T-Shirt</h5>
                  <div className="overflow-x-auto rounded-md border border-black/10">
                    <table className="w-full text-center text-[10px] whitespace-nowrap">
                      <thead className="bg-[#EADFCD] text-black border-b border-black/10">
                        <tr>
                          <th className="px-3 py-2.5 font-bold uppercase tracking-widest border-r border-black/10">Age (Size)</th>
                          <th className="px-3 py-2.5 font-bold uppercase tracking-widest border-r border-black/10">Chest</th>
                          <th className="px-3 py-2.5 font-bold uppercase tracking-widest">Height</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10">
                        {[
                          ['0-3 Months', '20cm', '28cm'],
                          ['3-6 Months', '22cm', '31cm'],
                          ['6-12 Months', '24cm', '34cm'],
                          ['1-2 Years', '25.5cm', '38cm'],
                          ['2-3 Years', '26.5cm', '43cm'],
                          ['3-4 Years', '28cm', '45.5cm'],
                          ['5-6 Years', '30cm', '50cm'],
                          ['7-8 Years', '32cm', '52cm'],
                          ['9-10 Years', '34cm', '59cm'],
                          ['11-12 Years', '36cm', '61cm'],
                          ['13-14 Years', '38cm', '64cm'],
                          ['15-16 Years', '40cm', '66cm']
                        ].map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-[#FCFAF6]' : 'bg-[#F2ECE0]'}>
                            <td className="px-3 py-2 border-r border-black/10 text-neutral-700">{row[0]}</td>
                            <td className="px-3 py-2 border-r border-black/10 text-neutral-700">{row[1]}</td>
                            <td className="px-3 py-2 text-neutral-700">{row[2]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-neutral-900">Pant - Waist & Height</h5>
                  <div className="overflow-x-auto rounded-md border border-black/10">
                    <table className="w-full text-center text-[10px] whitespace-nowrap">
                      <thead className="bg-[#EADFCD] text-black border-b border-black/10">
                        <tr>
                          <th className="px-3 py-2.5 font-bold uppercase tracking-widest border-r border-black/10">Age (Size)</th>
                          <th className="px-3 py-2.5 font-bold uppercase tracking-widest border-r border-black/10">Pant - Waist</th>
                          <th className="px-3 py-2.5 font-bold uppercase tracking-widest">Height</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10">
                        {[
                          ['0-6 Months', '20cm', '42cm'],
                          ['6-12 Months', '22cm', '46cm'],
                          ['1-2 Years', '24cm', '50cm'],
                          ['2-3 Years', '26cm', '56cm'],
                          ['4-5 Years', '28cm', '60cm'],
                          ['6-7 Years', '30cm', '66cm'],
                          ['8-9 Years', '32cm', '70cm'],
                          ['10-11 Years', '34cm', '76cm'],
                          ['12-13 Years', '36cm', '86cm'],
                          ['14-15 Years', '38cm', '94cm'],
                          ['16 Years', '40cm', '96-100cm']
                        ].map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-[#FCFAF6]' : 'bg-[#F2ECE0]'}>
                            <td className="px-3 py-2 border-r border-black/10 text-neutral-700">{row[0]}</td>
                            <td className="px-3 py-2 border-r border-black/10 text-neutral-700">{row[1]}</td>
                            <td className="px-3 py-2 text-neutral-700">{row[2]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          </motion.div>
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
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2">₹{(prod.price || 0).toLocaleString()}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
