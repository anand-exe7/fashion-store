'use client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, ArrowRight, Tag, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchDeliveryRegions, calculateDeliveryFee, validateCoupon, DeliveryRegion, Coupon } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';
import Script from 'next/script';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<{
    id: number;
    productId: string;
    name: string;
    size: string;
    color: string;
    price: number;
    image: string;
    quantity: number;
    weightGrams: number;
  }[]>([]);

  const [regions, setRegions] = useState<DeliveryRegion[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [splashActive, setSplashActive] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // Shipping Form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  
  const [paidInvoice, setPaidInvoice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) setCartItems(JSON.parse(saved));
    } catch(e) {}

    fetchDeliveryRegions(true).then(data => {
      setRegions(data);
      if (data.length > 0) setSelectedRegionId(data[0].id);
    });
    
    async function prefillProfile() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCustEmail(session.user.email || '');
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          if (profile.name) setCustName(profile.name);
          if (profile.mobile) setCustPhone(profile.mobile);
          if (profile.address) setCustAddress(profile.address);
        }
      }
    }
    prefillProfile();
  }, []);

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(items => {
      const next = items.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  };

  const removeItem = (id: number) => {
    setCartItems(items => {
      const next = items.filter(item => item.id !== id);
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  };

  const rawTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalWeightGrams = cartItems.reduce((acc, item) => acc + (item.weightGrams * item.quantity), 0);
  
  const selectedRegion = regions.find(r => r.id === selectedRegionId) || null;
  const deliveryFee = calculateDeliveryFee(totalWeightGrams, selectedRegion);
  
  const discount = couponApplied && appliedCoupon ? Math.round((rawTotal * appliedCoupon.discountPct) / 100) : 0;
  const finalTotal = rawTotal - discount + deliveryFee;

  const applyCoupon = async () => {
    const res = await validateCoupon(couponCode, rawTotal);
    if (res.ok && res.coupon) {
      setSplashActive(true);
      setTimeout(() => {
        setCouponApplied(true);
        setAppliedCoupon(res.coupon || null);
        setSplashActive(false);
      }, 1200);
    } else {
      alert(res.reason || 'Invalid Coupon');
    }
  };

  const completePayment = async () => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);

    try {
      // Save phone/address to profile if logged in (self-update).
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('profiles').update({
          mobile: custPhone.trim(),
          address: custAddress.trim(),
          name: custName.trim()
        }).eq('id', session.user.id);
      }

      // Send only WHAT is being bought. The server recomputes prices,
      // discount and delivery, creates the order, and returns the
      // Razorpay order to pay against. No amount is trusted from here.
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((i) => ({
            productId: i.productId,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
          })),
          couponCode: couponApplied ? appliedCoupon?.code : undefined,
          regionId: selectedRegionId,
          customerName: custName,
          customerPhone: custPhone,
          customerEmail: custEmail,
          customerAddress: custAddress,
        })
      });

      const { rpOrderId, key, invoiceId, amount, error } = await res.json();

      if (error || !rpOrderId) {
        alert('Failed to initiate payment: ' + (error || 'Unknown error'));
        setIsProcessing(false);
        return;
      }

      const options = {
        key: key,
        amount: amount,
        currency: 'INR',
        order_id: rpOrderId,
        name: 'Shalistone',
        description: `Order ${invoiceId}`,
        handler: function (response: any) {
          // Webhook is authoritative: it verifies the payment and completes the order.
          setPaidInvoice(invoiceId);
          setIsProcessing(false);
        },
        prefill: {
          name: custName,
          email: custEmail,
          contact: custPhone
        },
        theme: {
          color: '#0a0a0a'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        alert('Payment Failed. Please try again.');
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error(err);
      alert('Error placing order: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-neutral-900 font-sans selection:bg-black selection:text-white flex flex-col relative overflow-x-hidden">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
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
                  {couponApplied && appliedCoupon && <p className="text-emerald-500 text-xs mt-2 font-medium tracking-wide">{appliedCoupon.discountPct}% Discount Applied! ({appliedCoupon.code})</p>}
                </div>
                
                {/* Delivery Region */}
                <div className="mb-6">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-2">Delivery Region</label>
                  <select
                    value={selectedRegionId}
                    onChange={(e) => setSelectedRegionId(e.target.value)}
                    className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors appearance-none"
                  >
                    <option value="" disabled>Select your region</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
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
                    <span>{deliveryFee === 0 ? 'Complimentary' : `₹${deliveryFee.toLocaleString()}`}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end border-t border-black/10 pt-6 mb-8">
                  <span className="text-sm font-bold uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-bold text-emerald-600 tracking-tighter">₹{finalTotal.toLocaleString()}</span>
                </div>
                
                {/* Shipping Details Form */}
                <div className="flex flex-col gap-4 mb-8">
                  <input type="text" value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="Full Name" className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors" />
                  <input type="tel" value={custPhone} onChange={(e) => setCustPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Mobile Number" className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors" />
                  <input type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} placeholder="Email Address" className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors" />
                  <textarea value={custAddress} onChange={(e) => setCustAddress(e.target.value)} placeholder="Complete Delivery Address" rows={3} className="w-full bg-[#F5F2EB] border border-black/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors resize-none"></textarea>
                </div>
                
                <button
                  onClick={() => { setPaidInvoice(null); setShowCheckoutModal(true); }}
                  disabled={cartItems.length === 0 || !custName || !custPhone || !custAddress || !selectedRegionId}
                  className="w-full h-14 bg-black text-white rounded-full flex items-center justify-between px-6 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all group shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
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
              onClick={() => !isProcessing && setShowCheckoutModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#F5F2EB] rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden"
            >
              {!isProcessing && !paidInvoice && (
                <button 
                  onClick={() => setShowCheckoutModal(false)}
                  className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              
              {paidInvoice ? (
                <div className="text-center py-2">
                  <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Order Confirmed</h2>
                  <p className="text-sm text-neutral-500 mb-1">Invoice <span className="font-bold text-black">{paidInvoice}</span></p>
                  <p className="text-sm text-neutral-500 mb-6">Your order is confirmed. A copy of your receipt has been sent to your email.</p>
                  <button
                    onClick={() => { setCartItems([]); localStorage.removeItem('cart'); window.location.href = '/'; }}
                    className="w-full h-14 bg-black text-white rounded-full flex items-center justify-center px-6 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Secure Checkout</h2>
                  <p className="text-sm text-neutral-500 mb-8">You will be securely redirected to Razorpay to complete your payment.</p>

                  <div className="flex flex-col gap-4 mb-8">
                    <div className="flex items-center gap-4 p-5 rounded-xl border border-black/10 bg-white shadow-sm">
                      <CreditCard className="w-6 h-6 text-black" />
                      <div className="text-left">
                        <p className="font-bold text-sm">UPI, Credit/Debit Cards, & Netbanking</p>
                        <p className="text-xs text-neutral-500">100% Secure payments powered by Razorpay</p>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={!paymentMethod || isProcessing}
                    onClick={completePayment}
                    className="w-full h-14 bg-black text-white rounded-full flex items-center justify-center px-6 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all shadow-xl disabled:opacity-50 disabled:hover:bg-black"
                  >
                    {isProcessing ? 'Processing...' : `Confirm Order ₹${finalTotal.toLocaleString()}`}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
