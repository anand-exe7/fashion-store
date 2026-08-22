'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ArrowRight } from 'lucide-react';
import { inr } from '@/lib/store';

export const CartDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const saved = JSON.parse(localStorage.getItem('cart') || '[]');
      setCart(saved);
    }
  }, [isOpen]);

  const removeItem = (idx: number) => {
    const updated = cart.filter((_, i) => i !== idx);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-black/[0.06]">
              <h2 className="text-lg font-black tracking-widest uppercase">Your Cart ({cart.length})</h2>
              <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-black/5 transition-colors text-neutral-500 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-neutral-500">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <span className="text-2xl opacity-50">🛒</span>
                  </div>
                  <p className="text-sm font-semibold tracking-wide">Your cart is currently empty.</p>
                  <button onClick={onClose} className="text-xs uppercase tracking-widest font-bold underline underline-offset-4 hover:text-black">Continue Shopping</button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-20 h-24 shrink-0 bg-neutral-100 rounded-lg overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold truncate text-neutral-900 pr-2">{item.name}</h3>
                        <button onClick={() => removeItem(idx)} className="text-neutral-400 hover:text-red-500 transition-colors p-1 -mr-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">{item.color} · Size {item.size}</p>
                      <p className="text-sm font-extrabold mt-2">{inr(item.price)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 bg-neutral-50 border-t border-black/[0.06]">
                <div className="flex justify-between items-center mb-6 text-sm">
                  <span className="font-semibold text-neutral-500">Subtotal</span>
                  <span className="font-black text-lg">{inr(subtotal)}</span>
                </div>
                <a href="/cart" className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl hover:bg-neutral-800 transition-colors group">
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
