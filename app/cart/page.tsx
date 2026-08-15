'use client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Minus, Plus, X, ArrowRight } from 'lucide-react';

export default function CartPage() {
  // Dummy cart data
  const cartItems = [
    {
      id: 1,
      name: "Lumina Trench Coat",
      size: "M",
      color: "Noir",
      price: "₹39,500",
      image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
      quantity: 1
    },
    {
      id: 2,
      name: "Architectural Boots",
      size: "42",
      color: "Bone",
      price: "₹28,400",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      quantity: 1
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-neutral-900 font-sans selection:bg-black selection:text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-end justify-between mb-12 border-b border-black/10 pb-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase">Shopping Bag</h1>
            <span className="text-sm font-bold text-neutral-500 tracking-widest uppercase">{cartItems.length} Items</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            {/* Cart Items */}
            <div className="w-full lg:w-[65%] flex flex-col gap-8">
              {cartItems.map((item, idx) => (
                <div key={item.id} className="flex gap-6 group relative">
                  <div className="w-24 md:w-32 aspect-[3/4] bg-white/50 rounded-lg overflow-hidden flex-shrink-0 border border-black/5 shadow-sm">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-grow flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold tracking-tight mb-1">{item.name}</h3>
                        <p className="text-xs text-neutral-600 uppercase tracking-widest mb-1">Color: {item.color}</p>
                        <p className="text-xs text-neutral-600 uppercase tracking-widest">Size: {item.size}</p>
                      </div>
                      <button className="text-neutral-400 hover:text-black transition-colors p-2 -mr-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-end mt-4">
                      <div className="flex items-center border border-black/10 rounded-full h-10 w-28 px-3 bg-white shadow-sm">
                        <button className="p-1 hover:text-black transition-colors text-neutral-500"><Minus className="w-3 h-3" /></button>
                        <span className="flex-grow text-center text-sm font-semibold">{item.quantity}</span>
                        <button className="p-1 hover:text-black transition-colors text-neutral-500"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="text-lg font-bold text-emerald-600">{item.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-[35%]">
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-black/5 shadow-xl sticky top-32">
                <h2 className="text-xl font-bold tracking-tighter uppercase mb-8">Order Summary</h2>
                
                <div className="flex flex-col gap-4 text-sm mb-8 font-medium">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Subtotal</span>
                    <span>₹67,900</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Shipping</span>
                    <span>Complimentary</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Taxes</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end border-t border-black/10 pt-6 mb-8">
                  <span className="text-sm font-bold uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-bold text-emerald-600 tracking-tighter">₹67,900</span>
                </div>
                
                {/* Shipping Details Form */}
                <div className="flex flex-col gap-4 mb-8">
                  <input type="text" placeholder="Full Name" className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors" />
                  <input type="tel" placeholder="Phone Number" className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors" />
                  <textarea placeholder="Delivery Address" rows={3} className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors resize-none"></textarea>
                </div>
                
                <button className="w-full h-14 bg-black text-white rounded-full flex items-center justify-between px-6 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all group shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
