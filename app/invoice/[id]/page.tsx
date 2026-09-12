'use client';

import { useEffect, useState, use } from "react";
import { 
  Printer, 
  Copy, 
  Check, 
  ArrowLeft, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Building2,
  FileCheck2
} from "lucide-react";
import Link from "next/link";
import { Order } from "@/lib/db";

// Converts numeric amount to Indian Rupee Words for formal tax invoices
function numberToWordsINR(num: number): string {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '') + ' ';
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  }

  const result = inWords(Math.floor(num)).trim();
  return (result ? result : 'Zero') + ' Rupees Only';
}

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
      setTimeout(() => setCopied(false), 2500);
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
          document.title = `Tax Invoice - ${data.id}`;
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
      <div className="min-h-screen bg-[#F4F2EC] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl shadow-sm border border-black/5">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
          <p className="text-neutral-700 font-bold tracking-wider uppercase text-xs">Generating Tax Invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F4F2EC] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-black/10 max-w-sm w-full flex flex-col items-center">
          <img src="/logo.jpeg" alt="Shalistone" className="w-12 h-12 rounded-xl object-cover mb-4" />
          <h2 className="text-lg font-bold text-neutral-900 mb-1">Invoice Record Not Found</h2>
          <p className="text-xs text-neutral-500 mb-6">No matching order record exists for ID &ldquo;{id}&rdquo;.</p>
          <Link href="/" className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const estimatedGst = Math.round(order.total * 0.12);

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-neutral-900 font-sans py-6 sm:py-10 px-3 sm:px-6 print:p-0 print:bg-white flex flex-col items-center">
      
      {/* Precision Print Styling */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-hidden {
            display: none !important;
          }
          .invoice-sheet {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Screen-Only Action Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-5 print-hidden gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-800 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-xs border border-black/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-xs border border-black/10 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Commercial Tax Invoice Document */}
      <div className="invoice-sheet w-full max-w-4xl bg-white border border-black/10 rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none print:rounded-none">

        {/* 1. Header: Brand Identity (Left) & Tax Invoice Details (Right) */}
        <div className="p-6 sm:p-10 border-b border-black/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            
            {/* Left: Company Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.jpeg" 
                  alt="Shalistone Logo" 
                  className="w-12 h-12 rounded-xl object-cover border border-black/10 shadow-xs" 
                />
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 uppercase">
                    Shalistone
                  </h1>
                  <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
                    Shalistone Retail Pvt. Ltd.
                  </p>
                </div>
              </div>

              <div className="text-xs text-neutral-600 space-y-0.5 pt-1">
                <p className="leading-relaxed">14 Connaught Place, Inner Circle, New Delhi, 110001, India</p>
                <p>support@shalistone.com • +91 98765 43210</p>
                <p className="font-mono text-[11px] text-neutral-500 font-semibold pt-0.5">
                  GSTIN: <strong>07AAACS1234F1Z9</strong> • PAN: <strong>AAACS1234F</strong>
                </p>
              </div>
            </div>

            {/* Right: Invoice Type & Status */}
            <div className="sm:text-right space-y-1.5 shrink-0">
              <span className="inline-block text-[10px] font-mono font-bold tracking-[0.25em] text-neutral-400 uppercase">
                Original For Recipient
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 uppercase leading-none">
                Tax Invoice
              </h2>
              
              <p className="font-mono font-bold text-sm text-neutral-800">
                #{order.id}
              </p>

              <div className="pt-2 flex flex-wrap sm:justify-end gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  {order.status === 'completed' ? 'Paid & Settled' : order.status}
                </span>

                <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                  {order.source === 'offline' ? 'In-Store POS' : 'Online Store'}
                </span>
              </div>

              <div className="text-xs text-neutral-500 font-medium pt-1">
                <p>Date: <strong className="text-neutral-800 font-semibold">{formattedDate}</strong></p>
                <p>Time: <span className="text-neutral-700">{formattedTime} IST</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Metadata Grid: Billed To, Shipping, Transaction */}
        <div className="bg-neutral-50/60 p-6 sm:p-10 border-b border-black/[0.08]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Billed To */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 block">
                Billed To (Customer)
              </span>
              <p className="text-sm font-bold text-neutral-900 leading-snug">
                {order.customerName || 'Valued Customer'}
              </p>
              {order.customerPhone && (
                <p className="text-xs text-neutral-600 font-medium flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span>+91 {order.customerPhone}</span>
                </p>
              )}
              {order.customerEmail && (
                <p className="text-xs text-neutral-600 font-medium flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span className="break-all">{order.customerEmail}</span>
                </p>
              )}
              {order.customerAddress && (
                <p className="text-xs text-neutral-600 leading-relaxed pt-1 whitespace-pre-line">
                  {order.customerAddress}
                </p>
              )}
            </div>

            {/* Column 2: Shipping / Delivery */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 block">
                Dispatch / Shipping
              </span>
              <p className="text-xs text-neutral-800 font-semibold leading-relaxed">
                {order.source === 'offline' 
                  ? 'In-Store Boutique Handover' 
                  : order.customerAddress ? order.customerAddress : 'Standard Doorstep Delivery'
                }
              </p>
              <p className="text-xs text-neutral-500">
                Mode: <span className="font-semibold text-neutral-700">{order.source === 'offline' ? 'Direct Counter Delivery' : 'Express Courier Dispatch'}</span>
              </p>
              <p className="text-xs text-neutral-500">
                Place of Supply: <span className="font-semibold text-neutral-700">Delhi (07)</span>
              </p>
            </div>

            {/* Column 3: Payment & Gateway Details */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 block">
                Payment Verification
              </span>
              <p className="text-xs text-neutral-600">
                Method: <strong className="text-neutral-900 uppercase">{order.source === 'offline' ? 'POS Counter Terminal' : 'Razorpay Gateway'}</strong>
              </p>
              {order.razorpayPaymentId && (
                <p className="text-xs text-neutral-600">
                  Payment ID: <span className="font-mono text-[11px] font-bold text-neutral-900 break-all">{order.razorpayPaymentId}</span>
                </p>
              )}
              {order.razorpayOrderId && (
                <p className="text-xs text-neutral-600">
                  Order Ref: <span className="font-mono text-[11px] text-neutral-700 break-all">{order.razorpayOrderId}</span>
                </p>
              )}
              <p className="text-xs text-neutral-600">
                Currency: <span className="font-semibold text-neutral-900">INR (₹ Indian Rupee)</span>
              </p>
            </div>
          </div>
        </div>

        {/* 3. Commercial Line Items Table */}
        <div className="p-6 sm:p-10 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[550px]">
            <thead>
              <tr className="border-y border-black/[0.12] bg-neutral-100/70 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3">Item Description &amp; Specifications</th>
                <th className="py-3 px-3 w-20 text-center">HSN</th>
                <th className="py-3 px-3 w-16 text-center">Qty</th>
                <th className="py-3 px-3 w-28 text-right">Unit Price</th>
                <th className="py-3 px-3 w-32 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] text-xs">
              {order.items.map((item, index) => {
                const itemTotal = item.price * item.quantity;
                const hasVariant = !!(item.size || item.color);

                return (
                  <tr key={index} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-3 text-center text-neutral-400 font-mono text-[11px]">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-neutral-900 text-sm">{item.name}</p>
                      {hasVariant && (
                        <div className="flex items-center gap-2 mt-0.5 text-neutral-500 text-[11px]">
                          {item.size && (
                            <span>Size: <strong className="text-neutral-700">{item.size}</strong></span>
                          )}
                          {item.size && item.color && <span>•</span>}
                          {item.color && (
                            <span>Color: <strong className="text-neutral-700">{item.color}</strong></span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-neutral-500 text-[11px]">
                      6109
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-neutral-800 text-sm">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-neutral-700 text-sm">
                      ₹{item.price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-neutral-900 text-sm">
                      ₹{itemTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Financial Calculations & Legal Disclaimers */}
        <div className="p-6 sm:p-10 border-t border-black/[0.08] bg-neutral-50/40">
          <div className="flex flex-col lg:flex-row justify-between gap-8 items-start">
            
            {/* Left: Amount in words & Policy Notes */}
            <div className="flex-1 space-y-4 text-xs">
              
              {/* Amount In Words Box */}
              <div className="p-3.5 rounded-xl bg-white border border-black/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">
                  Total Amount in Words
                </span>
                <p className="font-bold text-neutral-900 text-sm italic leading-snug">
                  {numberToWordsINR(order.total)}
                </p>
              </div>

              {/* Terms & Conditions */}
              <div className="space-y-1.5 text-neutral-500 text-[11px] leading-relaxed pr-4">
                <span className="font-bold uppercase tracking-wider text-neutral-700 text-[10px]">
                  Terms &amp; Conditions
                </span>
                <p>1. Exchange eligible within 7 days of purchase in unworn condition with original tags intact.</p>
                <p>2. This document is a computer-generated tax invoice issued by Shalistone Retail Pvt. Ltd.</p>
                <p>3. All goods are subject to NCT of Delhi jurisdiction.</p>
              </div>

              {/* Digital Verification Seal */}
              <div className="flex items-center gap-2 pt-2 text-neutral-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-medium text-neutral-600">
                  Digitally authenticated invoice. No physical signature required.
                </span>
              </div>
            </div>

            {/* Right: Accounting Summary Totals */}
            <div className="w-full lg:w-80 space-y-2 text-xs">
              <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-2.5">
                
                {/* Subtotal */}
                <div className="flex justify-between items-center text-neutral-600">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    ₹{order.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Discount */}
                {order.discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700">
                    <span className="font-medium">
                      Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}
                    </span>
                    <span className="font-mono font-bold">
                      -₹{order.discount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* Delivery */}
                <div className="flex justify-between items-center text-neutral-600">
                  <span className="font-medium">Shipping &amp; Handling</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {order.delivery > 0 ? `₹${order.delivery.toLocaleString('en-IN')}` : 'Complimentary'}
                  </span>
                </div>

                {/* Estimated GST */}
                <div className="flex justify-between items-center text-neutral-400 text-[11px] pt-1">
                  <span>Includes IGST/CGST (12%)</span>
                  <span className="font-mono">
                    ₹{estimatedGst.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Grand Total */}
                <div className="border-t-2 border-neutral-900 pt-3 mt-2 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-neutral-900 block">
                      Total Due / Paid
                    </span>
                    <span className="text-[10px] text-neutral-400 uppercase font-medium">All taxes inclusive</span>
                  </div>
                  <span className="text-2xl font-black text-neutral-900 font-mono tracking-tight">
                    ₹{order.total.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Amount Received / Balance */}
                <div className="pt-2 border-t border-black/5 flex justify-between items-center text-[11px] text-neutral-500">
                  <span>Amount Settled</span>
                  <span className="font-mono font-bold text-neutral-800">
                    ₹{(order.amountReceived || order.total).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Formal Legal Footer */}
        <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-neutral-100/50 text-center text-[10px] text-neutral-400 space-y-1">
          <p className="font-semibold text-neutral-600 uppercase tracking-wider">
            Shalistone Retail Private Limited • CIN: U18101DL2026PTC123456 • Registered Office: Connaught Place, New Delhi - 110001
          </p>
          <p className="text-[9px]">
            For electronic billing support, email support@shalistone.com or visit www.shalistone.com
          </p>
        </div>

      </div>
    </div>
  );
}
