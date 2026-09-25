'use client';

import { useEffect, useState, use } from "react";
import { Printer, Copy, Check, ArrowLeft, Phone, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Order } from "@/lib/db";

// Converts a numeric amount to Indian-Rupee words for the invoice footer line.
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

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  // Print target chosen in the POS "Print Settings" dialog and passed through
  // the URL: paper = 'thermal' (roll) or 'a4' (sheet); size = '58'/'80' for
  // thermal, 'a4'/'a5' for sheet. Defaults to a full A4 sheet.
  const [paper, setPaper] = useState<'thermal' | 'a4'>('a4');
  const [paperSize, setPaperSize] = useState('a4');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('paper') === 'thermal') {
      setPaper('thermal');
      setPaperSize(sp.get('size') === '58' ? '58' : '80');
    } else if (sp.get('paper') === 'a4') {
      setPaper('a4');
      setPaperSize(sp.get('size') === 'a5' ? 'a5' : 'a4');
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  useEffect(() => {
    let cancelled = false;

    // A receipt tab opened straight from the POS may load a beat before the
    // order finishes persisting to the database, so retry a few times on a
    // "not found" before giving up. A genuinely missing invoice still errors
    // out after the short retry window.
    const fetchOrder = async (attempt = 0) => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(id)}`);
        if (!res.ok) {
          if (res.status === 404 && attempt < 6 && !cancelled) {
            setTimeout(() => fetchOrder(attempt + 1), 700);
            return;
          }
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
        } else {
          const data: Order = await res.json();
          if (cancelled) return;
          setOrder(data);
          document.title = `Invoice ${data.id} — Shalistone`;
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (attempt < 6 && !cancelled) {
          setTimeout(() => fetchOrder(attempt + 1), 700);
          return;
        }
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchOrder();
    return () => { cancelled = true; };
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
          <p className="text-neutral-700 font-bold tracking-wider uppercase text-xs">Loading invoice…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F4F2EC] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-black/10 max-w-sm w-full flex flex-col items-center">
          <img src="/logo.jpeg" alt="Shalistone" className="w-12 h-12 rounded-xl object-cover mb-4" />
          <h2 className="text-lg font-bold text-neutral-900 mb-1">Invoice not found</h2>
          <p className="text-xs text-neutral-500 mb-6">No order exists for ID &ldquo;{id}&rdquo;.</p>
          <Link href="/" className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Payment method: online is always Razorpay; offline carries cash/gpay/split
  // once the backend persists it (falls back to Cash — the shop default).
  const method = (order as { paymentMethod?: string }).paymentMethod;
  const payLabel =
    order.source === 'online'
      ? 'Razorpay (Online)'
      : method === 'gpay'
        ? 'GPay'
        : method === 'split'
          ? 'Split · Cash + GPay'
          : 'Cash';

  const amountPaid = order.amountReceived || order.total;

  const isThermal = paper === 'thermal';
  // Roll width for thermal, or the sheet size for A4/A5, drives the print @page.
  const pageSize = isThermal
    ? `${paperSize === '58' ? '58mm' : '80mm'} auto`
    : paperSize === 'a5'
      ? 'A5 portrait'
      : 'A4 portrait';
  const pageMargin = isThermal ? '3mm' : paperSize === 'a5' ? '10mm' : '12mm';
  // On-screen preview width for the thermal roll (real mm scaled up slightly so
  // it's readable).
  const thermalWidth = paperSize === '58' ? 260 : 320;
  // Printed width, pinned to the real roll (roll mm minus the 3mm page margins
  // on each side). Using a fixed mm width — NOT 100% — keeps the receipt a small
  // narrow column even when the browser prints to an A4/Letter PDF that ignores
  // the @page roll size, instead of stretching it across the whole sheet.
  const thermalPrintWidth = paperSize === '58' ? '52mm' : '74mm';

  const printStyle = `
    @media print {
      @page { size: ${pageSize}; margin: ${pageMargin}; }
      body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print-hidden { display: none !important; }
      .invoice-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; max-width: 100% !important; width: 100% !important; }
      .thermal-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; width: ${thermalPrintWidth} !important; max-width: ${thermalPrintWidth} !important; margin: 0 auto !important; }
    }
  `;

  if (isThermal) {
    return (
      <div className="min-h-screen bg-[#F4F2EC] text-neutral-900 py-6 sm:py-10 px-3 print:p-0 print:bg-white flex flex-col items-center">
        <style>{printStyle}</style>

        {/* Action bar (screen only) */}
        <div className="w-full flex items-center justify-center gap-2 mb-5 print-hidden" style={{ maxWidth: thermalWidth }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-800 font-bold text-xs uppercase tracking-wider px-3 py-2.5 rounded-xl shadow-xs border border-black/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black font-semibold text-xs uppercase tracking-wider px-3 py-2.5 rounded-xl shadow-xs border border-black/10 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex flex-1 items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>

        {/* Thermal receipt */}
        <div
          className="thermal-sheet bg-white text-neutral-900 border border-black/10 rounded-xl shadow-lg px-3 py-4 print:border-none print:shadow-none print:rounded-none"
          style={{ width: thermalWidth, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
        >
          <div className="text-center">
            <img src="/logo.jpeg" alt="Shalistone" className="mx-auto w-9 h-9 rounded-md object-cover mb-1" />
            <p className="text-base font-black uppercase tracking-tight leading-none">Shalistone</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.15em] text-neutral-500">Kids &amp; Mens Fashion</p>
            <p className="mt-1 text-[10px] text-neutral-500">www.shalistone.com · +91 98765 43210</p>
          </div>

          <div className="my-2 border-t border-dashed border-black/30" />

          <div className="text-[11px] leading-5">
            <div className="flex justify-between"><span className="text-neutral-500">Invoice</span><span className="font-bold">#{order.id}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Date</span><span>{formattedDate}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Time</span><span>{formattedTime}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Customer</span><span className="font-semibold text-right">{order.customerName || 'Walk-in'}</span></div>
            {order.customerPhone && (
              <div className="flex justify-between"><span className="text-neutral-500">Mobile</span><span>+91 {order.customerPhone}</span></div>
            )}
          </div>

          <div className="my-2 border-t border-dashed border-black/30" />

          {/* Items */}
          <div className="text-[11px]">
            <div className="flex justify-between font-bold uppercase text-[9px] tracking-wide text-neutral-500">
              <span>Item</span>
              <span>Amount</span>
            </div>
            <div className="mt-1 space-y-1.5">
              {order.items.map((item, index) => (
                <div key={index}>
                  <p className="font-semibold leading-tight">{item.name}</p>
                  <div className="flex justify-between text-neutral-600">
                    <span>{item.quantity} × {inr(item.price)}{(item.size || item.color) ? ` · ${[item.size && `Sz ${item.size}`, item.color].filter(Boolean).join(' ')}` : ''}</span>
                    <span className="font-bold tabular-nums text-neutral-900">{inr(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="my-2 border-t border-dashed border-black/30" />

          {/* Totals */}
          <div className="text-[11px] leading-5">
            <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="tabular-nums">{inr(order.subtotal)}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-neutral-700"><span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span><span className="tabular-nums">- {inr(order.discount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-neutral-500">Delivery</span><span className="tabular-nums">{order.delivery > 0 ? inr(order.delivery) : 'Free'}</span></div>
          </div>

          <div className="my-2 flex items-center justify-between border-y border-black/70 py-1.5 text-sm font-black">
            <span className="uppercase tracking-wide">Total</span>
            <span className="tabular-nums">{inr(order.total)}</span>
          </div>

          <div className="text-[11px] leading-5">
            <div className="flex justify-between"><span className="text-neutral-500">Paid via</span><span className="font-semibold">{payLabel}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Paid</span><span className="tabular-nums">{inr(amountPaid)}</span></div>
          </div>

          <p className="mt-2 text-[9px] italic leading-tight text-neutral-500">{numberToWordsINR(order.total)}</p>
          <p className="mt-0.5 text-[9px] text-neutral-400">Prices inclusive of applicable GST.</p>

          <div className="my-2 border-t border-dashed border-black/30" />

          <div className="text-center text-[10px] text-neutral-600">
            <p className="font-semibold">Thank you for shopping with us!</p>
            <p className="mt-1 text-[9px] text-neutral-400">Powered by Cenexa Systems</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-neutral-900 font-sans py-6 sm:py-10 px-3 sm:px-6 print:p-0 print:bg-white flex flex-col items-center">

      <style>{printStyle}</style>

      {/* Action bar (screen only) */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-5 print-hidden gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-800 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-xs border border-black/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Store</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-xs border border-black/10 transition-colors"
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-700 font-bold">Copied!</span></>
            ) : (
              <><Copy className="w-3.5 h-3.5" /><span>Copy Link</span></>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Invoice sheet */}
      <div className="invoice-sheet w-full max-w-3xl bg-white border border-black/10 rounded-3xl shadow-xl overflow-hidden print:border-none print:shadow-none print:rounded-none">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 sm:p-9 border-b border-black/[0.07]">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Shalistone" className="w-11 h-11 rounded-xl object-cover border border-black/10" />
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-neutral-900 uppercase leading-none">Shalistone</h1>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Kids &amp; Mens Fashion</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#C79A3E]">Invoice</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-neutral-900">#{order.id}</p>
            <p className="mt-1 text-[11px] text-neutral-500">{formattedDate} · {formattedTime}</p>
          </div>
        </div>

        {/* Billed to + payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 sm:p-9 border-b border-black/[0.07]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 block">Billed To</span>
            <p className="text-sm font-bold text-neutral-900">{order.customerName || 'Walk-in Customer'}</p>
            {order.customerPhone && (
              <p className="text-xs text-neutral-600 flex items-center gap-1.5"><Phone className="w-3 h-3 text-neutral-400 shrink-0" /> +91 {order.customerPhone}</p>
            )}
            {order.customerEmail && (
              <p className="text-xs text-neutral-600 flex items-center gap-1.5"><Mail className="w-3 h-3 text-neutral-400 shrink-0" /> <span className="break-all">{order.customerEmail}</span></p>
            )}
            {order.customerAddress && (
              <p className="text-xs text-neutral-500 leading-relaxed whitespace-pre-line pt-0.5">{order.customerAddress}</p>
            )}
          </div>
          <div className="space-y-1 sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 block">Payment</span>
            <p className="text-sm font-bold text-neutral-900">{payLabel}</p>
            <div className="flex flex-wrap gap-2 sm:justify-end pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                {order.status === 'completed' ? 'Paid' : order.status}
              </span>
              <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                {order.source === 'offline' ? 'In-Store' : 'Online'}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-6 sm:px-9 pt-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-black/10">
                <th className="pb-2.5 pr-3">Item</th>
                <th className="pb-2.5 px-2 text-center w-12">Qty</th>
                <th className="pb-2.5 px-2 text-right w-24">Rate</th>
                <th className="pb-2.5 pl-2 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {order.items.map((item, index) => {
                const hasVariant = !!(item.size || item.color);
                return (
                  <tr key={index}>
                    <td className="py-3 pr-3">
                      <p className="text-sm font-semibold text-neutral-900 leading-snug">{item.name}</p>
                      {hasVariant && (
                        <p className="mt-0.5 text-[11px] text-neutral-400">
                          {[item.size && `Size ${item.size}`, item.color && item.color].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center text-sm text-neutral-700">{item.quantity}</td>
                    <td className="py-3 px-2 text-right text-sm text-neutral-600 tabular-nums">{inr(item.price)}</td>
                    <td className="py-3 pl-2 text-right text-sm font-bold text-neutral-900 tabular-nums">{inr(item.price * item.quantity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-6 sm:p-9 flex flex-col-reverse gap-6 sm:flex-row sm:justify-between">
          {/* Amount in words + note */}
          <div className="flex-1 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 block mb-1">Amount in Words</span>
              <p className="text-xs font-semibold text-neutral-700 italic leading-snug max-w-xs">{numberToWordsINR(order.total)}</p>
            </div>
            <div className="flex items-center gap-2 text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[11px]">Computer-generated invoice — no signature required.</span>
            </div>
          </div>

          {/* Summary */}
          <div className="w-full sm:w-72 shrink-0">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="tabular-nums text-neutral-900">{inr(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                  <span className="tabular-nums font-semibold">- {inr(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Delivery</span>
                <span className="tabular-nums text-neutral-900">{order.delivery > 0 ? inr(order.delivery) : 'Free'}</span>
              </div>

              <div className="mt-2 flex items-center justify-between rounded-2xl bg-neutral-900 px-4 py-3 text-white">
                <span className="text-xs font-bold uppercase tracking-widest">Total</span>
                <span className="text-xl font-black tabular-nums">{inr(order.total)}</span>
              </div>

              <div className="flex justify-between pt-1 text-xs text-neutral-500">
                <span>Paid via {payLabel}</span>
                <span className="tabular-nums font-semibold text-neutral-800">{inr(amountPaid)}</span>
              </div>
              <p className="text-right text-[10px] text-neutral-400">Prices inclusive of applicable GST.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-9 py-5 border-t border-black/[0.06] bg-neutral-50/60 text-center space-y-1">
          <p className="text-sm font-semibold text-neutral-800">Thank you for shopping with Shalistone!</p>
          <p className="text-[11px] text-neutral-500">support@shalistone.com · +91 98765 43210 · www.shalistone.com</p>
          <p className="text-[10px] text-neutral-400 pt-1">
            Powered by <span className="font-semibold text-neutral-500">Cenexa Systems</span>
          </p>
        </div>
      </div>
    </div>
  );
}
