'use client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, ArrowRight, Tag, CreditCard, Banknote } from 'lucide-react';
import { useState } from 'react';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Lumina Trench Coat",
      size: "M",
      color: "Noir",
      price: 39500,
      image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
      quantity: 1
    },
    {
      id: 2,
      name: "Architectural Boots",
      size: "42",
      color: "Bone",
      price: 28400,
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      quantity: 1
    }
  ]);

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [splashActive, setSplashActive] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(items => items.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const rawTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = couponApplied ? rawTotal * 0.1 : 0;
  const finalTotal = rawTotal - discount;

  const applyCoupon = () => {
    if (couponCode.toLowerCase() === 'shalistone10') {
      setSplashActive(true);
      setTimeout(() => {
        setCouponApplied(true);
        setSplashActive(false);
      }, 1500);
    } else {
      alert('Invalid Coupon Code. Try SHALISTONE10');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-neutral-900 font-sans selection:bg-black selection:text-white flex flex-col relative overflow-x-hidden">
      <Navbar />
      
      {/* Splash Effect for Coupon */}
      <AnimatePresence>
        {splashActive && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 20, 40], opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500 rounded-full z-[100] pointer-events-none mix-blend-overlay"
          />
        )}
      </AnimatePresence>

      <main className="flex-grow pt-24 md:pt-32 pb-24 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-12 border-b border-black/10 pb-6 gap-4">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">Shopping Bag</h1>
            <span className="text-sm font-bold text-neutral-500 tracking-widest uppercase">{cartItems.length} Items</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-20">
            {/* Cart Items */}
            <div className="w-full lg:w-[65%] flex flex-col gap-6 md:gap-8">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 md:gap-6 group relative bg-white/30 p-3 rounded-xl border border-black/5">
                  <div className="w-20 md:w-32 aspect-[3/4] bg-white/50 rounded-lg overflow-hidden flex-shrink-0 border border-black/5 shadow-sm">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-grow flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base md:text-xl font-bold tracking-tight mb-1">{item.name}</h3>
                        <p className="text-[10px] md:text-xs text-neutral-600 uppercase tracking-widest mb-1">Color: {item.color}</p>
                        <p className="text-[10px] md:text-xs text-neutral-600 uppercase tracking-widest">Size: {item.size}</p>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-400 hover:text-black transition-colors p-1 md:p-2 -mr-1 md:-mr-2"
                      >
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-end mt-4">
                      <div className="flex items-center border border-black/10 rounded-full h-8 md:h-10 w-24 md:w-28 px-2 md:px-3 bg-white shadow-sm">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-black transition-colors text-neutral-500"><Minus className="w-3 h-3" /></button>
                        <span className="flex-grow text-center text-xs md:text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-black transition-colors text-neutral-500"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="text-base md:text-lg font-bold text-emerald-600">₹{item.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-[35%]">
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-black/5 shadow-xl lg:sticky lg:top-32">
                <h2 className="text-xl font-bold tracking-tighter uppercase mb-6 md:mb-8">Order Summary</h2>
                
                {/* Coupon Code */}
                <div className="mb-6">
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={couponApplied}
                        placeholder="Coupon Code" 
                        className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors uppercase" 
                      />
                    </div>
                    <button 
                      onClick={applyCoupon}
                      disabled={couponApplied}
                      className="bg-black text-white px-4 rounded-lg text-xs font-bold tracking-wider uppercase hover:bg-neutral-800 disabled:opacity-50"
                    >
                      {couponApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                  {couponApplied && <p className="text-emerald-500 text-xs mt-2 font-medium tracking-wide">10% Discount Applied!</p>}
                </div>

                <div className="flex flex-col gap-4 text-sm mb-8 font-medium">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Subtotal</span>
                    <span>₹{rawTotal.toLocaleString()}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Shipping</span>
                    <span>Complimentary</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end border-t border-black/10 pt-6 mb-8">
                  <span className="text-sm font-bold uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-bold text-emerald-600 tracking-tighter">₹{finalTotal.toLocaleString()}</span>
                </div>
                
                {/* Shipping Details Form */}
                <div className="flex flex-col gap-4 mb-8">
                  <input type="text" placeholder="Full Name" className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors" />
                  <input type="tel" placeholder="Mobile Number" className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors" />
                  
                  {/* Date of Birth */}
                  <div className="relative">
                    <label className="absolute -top-2 left-3 bg-[#F5F2EB] px-1 text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Date of Birth</label>
                    <input type="date" className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors" />
                  </div>

                  <textarea placeholder="Complete Delivery Address" rows={3} className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors resize-none"></textarea>
                </div>
                
                <button 
                  onClick={() => setShowCheckoutModal(true)}
                  className="w-full h-14 bg-black text-white rounded-full flex items-center justify-between px-6 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all group shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckoutModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#F5F2EB] rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden"
            >
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Payment Details</h2>
              <p className="text-sm text-neutral-500 mb-8">Please select your preferred payment method to proceed securely via Razorpay.</p>

              <div className="flex flex-col gap-4 mb-8">
                <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-black bg-white shadow-md' : 'border-black/5 hover:border-black/20 bg-transparent'}`}
                >
                  <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-black' : 'text-neutral-400'}`} />
                  <div className="text-left">
                    <p className="font-bold text-sm">Credit / Debit Card</p>
                    <p className="text-xs text-neutral-500">Secure payment via Razorpay</p>
                  </div>
                </button>

                <button 
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cod' ? 'border-black bg-white shadow-md' : 'border-black/5 hover:border-black/20 bg-transparent'}`}
                >
                  <Banknote className={`w-6 h-6 ${paymentMethod === 'cod' ? 'text-black' : 'text-neutral-400'}`} />
                  <div className="text-left">
                    <p className="font-bold text-sm">Cash on Delivery</p>
                    <p className="text-xs text-neutral-500">Pay when you receive your order</p>
                  </div>
                </button>
              </div>

              <button 
                disabled={!paymentMethod}
                onClick={() => {
                  alert('Redirecting to Razorpay Gateway...');
                  setShowCheckoutModal(false);
                }}
                className="w-full h-14 bg-black text-white rounded-full flex items-center justify-center px-6 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all shadow-xl disabled:opacity-50 disabled:hover:bg-black"
              >
                Proceed to Pay ₹{finalTotal.toLocaleString()}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
