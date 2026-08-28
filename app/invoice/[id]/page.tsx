'use client';

import { useEffect, useState, use } from "react";
import { ShoppingBag, MapPin, Phone, Printer, Copy, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Order } from "@/lib/db";

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(id)}`);
        if (!res.ok) {
          setError(true);
        } else {
          const data: Order = await res.json();
          setOrder(data);
          document.title = `Invoice - ${data.id}`;
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order && typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('print') === 'true') {
        const timer = setTimeout(() => {
          window.print();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <img src="/logo.jpeg" alt="Shalistone" className="w-16 h-16 rounded-xl object-cover" />
          <p className="text-black font-bold tracking-widest uppercase text-sm">Generating Digital Bill...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center justify-center gap-4">
        <img src="/logo.jpeg" alt="Shalistone" className="w-16 h-16 rounded-xl object-cover" />
        <p className="text-black font-bold text-xl">Invoice Not Found</p>
        <Link href="/" className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold transition-colors shadow-md">
          Return to Store
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-neutral-900 font-sans py-8 sm:py-12 px-4 print:p-0 print:bg-white flex flex-col items-center">
      <style>{`
        @media print {
          @page {
            margin: 10mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Top Navigation / Action Bar (Hidden when printing) */}
      <div className="w-full max-w-3xl flex flex-wrap justify-between items-center mb-6 sm:mb-8 print:hidden gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-900 font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm border border-black/10 transition-all"
        >
          <ArrowLeft size={16} /> Back to Store
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm border border-black/10 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Link
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Bluetooth Printer
          </button>
        </div>
      </div>

      {/* The Invoice Document */}
      <div className="w-full max-w-3xl bg-white border border-black/10 rounded-2xl shadow-xl print:shadow-none print:border-none print:rounded-none overflow-hidden">

        {/* Header Section with Logo */}
        <div className="bg-neutral-50 border-b border-black/10 p-8 sm:p-12 print:p-6 flex flex-col items-center text-center">
          <div className="mb-4 flex flex-col items-center gap-3">
            <img src="/logo.jpeg" alt="Shalistone" className="w-16 h-16 rounded-xl object-cover shadow-sm print:w-12 print:h-12" />
            <h1 className="text-3xl font-black tracking-tighter uppercase">Shalistone</h1>
          </div>
          <p className="text-xs text-neutral-500 font-bold tracking-wider mt-1 mb-4">INVOICE: {order.id}</p>

          <div className="flex flex-col items-center gap-2 text-sm text-neutral-600 font-semibold">
            <div className="text-center max-w-md leading-relaxed">
              <span className="inline-block text-neutral-400 mr-1.5 align-middle -mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <span>123 Fashion Street, New Delhi, India 110001</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>+91 98765 43210</span>
            </div>
          </div>
        </div>

        {/* Invoice Meta Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-8 sm:p-12 print:p-6 border-b border-black/10">
          <div>
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-3">Billed To</h3>
            <p className="text-base font-bold text-black">{order.customerName || "Guest Customer"}</p>
            {order.customerPhone && (
              <p className="text-sm text-neutral-600 font-semibold mt-1">+91 {order.customerPhone}</p>
            )}
            {order.customerAddress && (
              <p className="text-sm text-neutral-600 mt-1 whitespace-pre-line">{order.customerAddress}</p>
            )}
            {order.customerEmail && (
              <p className="text-sm text-neutral-600 mt-1">{order.customerEmail}</p>
            )}
          </div>
          <div className="sm:text-right flex flex-col sm:items-end">
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-3 self-start sm:self-auto">Order Details</h3>
            <div className="inline-block text-left text-sm space-y-1">
              <div className="flex gap-2">
                <span className="text-neutral-500 font-bold w-20 text-left sm:text-right">Date:</span>
                <span className="text-black font-black">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-neutral-500 font-bold w-20 text-left sm:text-right">Time:</span>
                <span className="text-black font-black">{new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-neutral-500 font-bold w-20 text-left sm:text-right">Type:</span>
                <span className="text-black font-black uppercase">{order.source} SALE</span>
              </div>

              <div className="pt-3 mt-3 border-t border-black/5">
                <div className="flex gap-2 mb-1">
                  <span className="text-neutral-500 font-bold w-20 text-left sm:text-right">Gateway:</span>
                  <span className="text-black font-black uppercase">Razorpay</span>
                </div>
                <div className="flex gap-2 mb-1">
                  <span className="text-neutral-500 font-bold w-20 text-left sm:text-right">Status:</span>
                  <span className={`font-black uppercase ${order.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>{order.status}</span>
                </div>
                {order.razorpayOrderId && (
                  <div className="flex gap-2 mb-1">
                    <span className="text-neutral-500 font-bold w-20 text-left sm:text-right">Order Ref:</span>
                    <span className="text-black font-black text-xs uppercase break-all">{order.razorpayOrderId}</span>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div className="flex gap-2">
                    <span className="text-neutral-500 font-bold w-20 text-left sm:text-right">Txn ID:</span>
                    <span className="text-black font-black text-xs uppercase break-all">{order.razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-8 sm:p-12 print:py-4 print:px-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black/10">
                <th className="py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Item Description</th>
                <th className="py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-center">Qty</th>
                <th className="py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-right">Price</th>
                <th className="py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {order.items.map((item, index) => (
                <tr key={index} className="group">
                  <td className="py-6 pr-4 print:py-3">
                    <p className="text-sm font-bold text-black">{item.name}</p>
                    {(item.size || item.color) && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.size ? `Size: ${item.size}` : ''}
                        {item.size && item.color ? ' | ' : ''}
                        {item.color ? `Color: ${item.color}` : ''}
                      </p>
                    )}
                  </td>
                  <td className="py-6 px-4 print:py-3 text-center text-sm font-bold text-neutral-700">{item.quantity}</td>
                  <td className="py-6 pl-4 print:py-3 text-right text-sm font-bold text-neutral-700">{'₹'}{item.price.toLocaleString('en-IN')}</td>
                  <td className="py-6 pl-4 print:py-3 text-right text-sm font-black text-black">{'₹'}{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="bg-neutral-50 border-t border-black/10 p-8 sm:p-12 print:p-6 flex justify-end">

            {/* Calculations */}
            <div className="w-full sm:w-1/2 space-y-3">
              {(order.discount > 0 || order.delivery > 0) && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider">Subtotal</span>
                  <span className="font-bold text-black">{'₹'}{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
              )}

              {order.discount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider">
                    Discount {order.couponCode ? `(${order.couponCode})` : ''}
                  </span>
                  <span className="font-bold text-emerald-600">-{'₹'}{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {order.delivery > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider">Delivery Fee</span>
                  <span className="font-bold text-black">{'₹'}{order.delivery.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="border-t-2 border-black/10 pt-4 mt-2 flex justify-between items-center">
                <span className="text-sm font-black text-black uppercase tracking-widest">Total Amount</span>
                <span className="text-3xl font-black text-black">{'₹'}{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/5 p-6 print:p-4 text-center bg-white flex flex-col items-center justify-center gap-2">
          <img src="/logo.jpeg" alt="Shalistone" className="w-8 h-8 rounded-lg object-cover opacity-60 print:w-6 print:h-6" />
          <p className="text-xs font-bold text-black tracking-wider uppercase">Thank you for shopping with Shalistone!</p>
          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.15em]">Powered by Cenexa Systems &copy; {new Date().getFullYear()}</p>
        </div>

      </div>
    </div>
  );
}
