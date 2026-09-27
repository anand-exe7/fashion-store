'use client';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Trash2, Plus, Minus, List, ShoppingBag, Printer, User, MessageCircle,
  Banknote, Smartphone, Split, FileText, Check,
} from 'lucide-react';
import {
  fetchWholesaleItems,
  insertWholesaleOrder,
  generateWholesaleInvoiceId,
  type WholesaleItem,
} from '@/lib/db';
import { Card, Modal, ModalHeader, Toast, Field, inputCls, inputBase } from '../ui';

const inr = (n: number) => '₹' + Math.round(n || 0).toLocaleString('en-IN');

// How the item is printed on the invoice: its code, its company/name, or both.
type LabelMode = 'code' | 'name' | 'both';
// Payment method for a wholesale bill — mirrors the POS billing panel.
type PaymentMethod = 'cash' | 'gpay' | 'split';

// Print target for the receipt. Thermal = label/roll printer (58/80 mm rolls);
// A4 = regular sheet printer (A4/A5). Passed to /invoice via ?paper=&size=.
type PrinterKind = 'thermal' | 'a4';
const PRINT_SIZES: Record<PrinterKind, { k: string; label: string; sub: string }[]> = {
  thermal: [
    { k: '58', label: '58 mm', sub: '2-inch thermal roll' },
    { k: '80', label: '80 mm', sub: '3-inch thermal roll' },
  ],
  a4: [
    { k: 'a4', label: 'A4', sub: '210 × 297 mm sheet' },
    { k: 'a5', label: 'A5', sub: '148 × 210 mm sheet' },
  ],
};
// Shared with the POS panel so the operator's printer choice carries across both.
const PRINT_PREFS_KEY = 'shalistone_print_prefs';

interface Line {
  key: number;
  itemId: string | null;
  code: string;
  company: string;
  labelMode: LabelMode;
  size: string;
  qty: number;
  price: number;      // per unit
  amount: number;     // line total (auto = qty × price, but editable)
  amountEdited: boolean;
}

let keySeq = 1;
const newLine = (): Line => ({
  key: keySeq++, itemId: null, code: '', company: '', labelMode: 'both',
  size: '', qty: 1, price: 0, amount: 0, amountEdited: false,
});

// Builds the printed item label from the chosen mode, gracefully handling items
// that only have one of code/company filled in.
function labelFor(l: Pick<Line, 'code' | 'company' | 'labelMode'>): string {
  const code = l.code.trim();
  const company = l.company.trim();
  if (l.labelMode === 'code') return code || company;
  if (l.labelMode === 'name') return company || code;
  return [code, company].filter(Boolean).join(' — ') || 'Item';
}

export default function WholesaleBilling() {
  const [items, setItems] = useState<WholesaleItem[]>([]);
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [discValue, setDiscValue] = useState('');
  const [discMode, setDiscMode] = useState<'₹' | '%'>('₹');
  // Payment method + the amounts collected per method (cash / gpay / split).
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [received, setReceived] = useState('');
  const [gpayAmt, setGpayAmt] = useState('');
  const [splitCash, setSplitCash] = useState('');
  const [splitGpay, setSplitGpay] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  // Print settings dialog (opened from the "Print" button).
  const [printOpen, setPrintOpen] = useState(false);
  const [printer, setPrinter] = useState<PrinterKind>('thermal');
  const [printSize, setPrintSize] = useState('80');

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  useEffect(() => { fetchWholesaleItems().then(setItems).catch(console.error); }, []);

  // Restore the operator's last-used printer + size (shared with POS billing).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRINT_PREFS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { printer?: PrinterKind; size?: string };
      if (p.printer === 'thermal' || p.printer === 'a4') {
        setPrinter(p.printer);
        const valid = PRINT_SIZES[p.printer].some((s) => s.k === p.size);
        setPrintSize(valid ? (p.size as string) : PRINT_SIZES[p.printer][0].k);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Switching printer resets the size to that printer's default.
  const selectPrinter = (p: PrinterKind) => {
    setPrinter(p);
    setPrintSize(PRINT_SIZES[p][0].k);
  };

  const setLine = (key: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => {
      if (l.key !== key) return l;
      const next = { ...l, ...patch };
      // Keep amount = qty × price unless the operator typed their own amount.
      if (('qty' in patch || 'price' in patch) && !next.amountEdited) {
        next.amount = next.qty * next.price;
      }
      return next;
    }));

  const addItem = (item: WholesaleItem) => {
    const filled: Line = {
      ...newLine(),
      itemId: item.id,
      code: item.code || '',
      company: item.company || '',
    };
    setLines((prev) => {
      const blank = prev.find((l) => !l.code && !l.company);
      if (blank) return prev.map((l) => (l.key === blank.key ? { ...filled, key: blank.key } : l));
      return [...prev, filled];
    });
    setCatalogOpen(false);
  };

  const validLines = lines.filter((l) => (l.code.trim() || l.company.trim()) && l.qty > 0);
  const subtotal = validLines.reduce((a, l) => a + (l.amount || 0), 0);
  const discount = Math.min(
    subtotal,
    discMode === '₹' ? Number(discValue) || 0 : Math.round((subtotal * (Number(discValue) || 0)) / 100),
  );
  const grandTotal = Math.max(0, subtotal - discount);
  // What the customer actually handed over, per the selected method.
  const totalReceived =
    payMethod === 'cash'
      ? Number(received) || 0
      : payMethod === 'gpay'
        ? Number(gpayAmt) || 0
        : (Number(splitCash) || 0) + (Number(splitGpay) || 0);
  const change = totalReceived - grandTotal;

  const clearAll = () => {
    setLines([newLine()]); setCustomer(''); setPhone(''); setDiscValue('');
    setPayMethod('cash'); setReceived(''); setGpayAmt(''); setSplitCash(''); setSplitGpay('');
  };

  const createBill = async ({
    print,
    whatsapp,
    paper,
    size,
  }: {
    print: boolean;
    whatsapp: boolean;
    paper?: PrinterKind;
    size?: string;
  }): Promise<boolean> => {
    if (validLines.length === 0) { flash('Add at least one item with a quantity.'); return false; }
    setSaving(true);
    const id = generateWholesaleInvoiceId();
    const hasPhone = phone.trim().length === 10;

    // Open the print / WhatsApp tabs synchronously inside the click gesture so
    // browsers don't block them as unsolicited popups.
    if (print) {
      const params = new URLSearchParams({ print: 'true' });
      if (paper) params.set('paper', paper);
      if (size) params.set('size', size);
      window.open(`/invoice/${id}?${params.toString()}`, '_blank');
    }
    if (whatsapp && hasPhone) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const lineText = validLines.map((l) => `• ${labelFor(l)} x${l.qty} — ${inr(l.amount)}`).join('\n');
      const msg =
        `*Shalistone Wholesale — Invoice ${id}*\n` +
        `Hi ${customer.trim() || 'there'}, thank you for your order!\n\n` +
        `${lineText}\n` +
        `Subtotal: ${inr(subtotal)}` +
        (discount ? `\nDiscount: -${inr(discount)}` : '') +
        `\n*Total: ${inr(grandTotal)}*\n\n` +
        (origin ? `View / download your invoice:\n${origin}/invoice/${id}\n\n` : '') +
        `— Shalistone`;
      window.open(`https://wa.me/91${phone.trim()}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    try {
      await insertWholesaleOrder({
        id,
        customerName: customer.trim() || 'Wholesale Customer',
        customerPhone: phone.trim(),
        subtotal,
        discount,
        total: grandTotal,
        amountReceived: totalReceived || grandTotal,
        paymentMethod: payMethod,
        createdAt: new Date().toISOString(),
        items: validLines.map((l) => ({
          name: labelFor(l),
          itemId: l.itemId,
          size: l.size.trim() || null,
          quantity: l.qty,
          price: l.price,
          amount: l.amount,
        })),
      });
      const done = whatsapp
        ? `Wholesale bill ${id} saved — opening WhatsApp${hasPhone ? '' : ' (add a 10-digit number next time)'}.`
        : print
          ? `Wholesale bill ${id} saved — receipt opening.`
          : `Wholesale bill ${id} saved.`;
      flash(done);
      clearAll();
      return true;
    } catch (err) {
      console.error(err);
      flash('Could not save the bill.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Persist the chosen printer/size, run the sale with the print flag, and close
  // the dialog only if the bill actually completed.
  const confirmPrint = async () => {
    try {
      localStorage.setItem(PRINT_PREFS_KEY, JSON.stringify({ printer, size: printSize }));
    } catch {
      /* ignore */
    }
    const ok = await createBill({ print: true, whatsapp: false, paper: printer, size: printSize });
    if (ok) setPrintOpen(false);
  };

  const catalogList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => [it.code, it.company, it.color].some((v) => (v || '').toLowerCase().includes(q)));
  }, [items, query]);

  return (
    <Card className="p-4 sm:p-5 md:p-7">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-7 w-1.5 rounded-full bg-neutral-900" />
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Wholesale Billing</h2>
          <p className="text-xs text-neutral-500 sm:text-sm">Size, quantity, price/unit and amount are entered per line.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        {/* left */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-black/[0.06] p-4 sm:p-5">
            <p className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-900"><User className="h-4 w-4" /> Customer Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Customer / Shop Name"><input className={inputCls} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Enter name" /></Field>
              <Field label="Mobile Number (WhatsApp)"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" inputMode="numeric" /></Field>
            </div>
          </div>

          <div className="rounded-2xl border border-black/[0.06] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-bold text-neutral-900"><ShoppingBag className="h-4 w-4" /> Invoice Items</p>
              <div className="flex items-center gap-2">
                <button onClick={clearAll} className="rounded-lg border border-black/[0.08] px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-black/[0.03]">Clear</button>
                <button onClick={() => setCatalogOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800"><List className="h-3.5 w-3.5" /> Inventory</button>
                <button onClick={() => setLines((p) => [...p, newLine()])} className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-black/[0.03]"><Plus className="h-3.5 w-3.5" /> Add Row</button>
              </div>
            </div>

            <div className="space-y-3">
              {lines.map((l) => (
                <div key={l.key} className="rounded-xl border border-black/[0.06] p-3">
                  {/* Item + display mode */}
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                      <input className={`${inputBase} flex-1`} value={l.code} onChange={(e) => setLine(l.key, { code: e.target.value })} placeholder="Code" />
                      <input className={`${inputBase} flex-1`} value={l.company} onChange={(e) => setLine(l.key, { company: e.target.value })} placeholder="Company / Name" />
                    </div>
                    <select
                      className={`${inputBase} shrink-0 sm:w-40`}
                      value={l.labelMode}
                      onChange={(e) => setLine(l.key, { labelMode: e.target.value as LabelMode })}
                      title="What prints as the item name"
                    >
                      <option value="both">Show: Code + Name</option>
                      <option value="code">Show: Code only</option>
                      <option value="name">Show: Name only</option>
                    </select>
                    <button onClick={() => setLines((p) => (p.length > 1 ? p.filter((x) => x.key !== l.key) : [newLine()]))} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-red-500 hover:bg-red-50" aria-label="Remove row"><Trash2 className="h-4 w-4" /></button>
                  </div>

                  {/* Variables typed by hand */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Size</span>
                      <input className={`${inputBase} w-full`} value={l.size} onChange={(e) => setLine(l.key, { size: e.target.value })} placeholder="e.g. M" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Qty</span>
                      <div className="flex items-center rounded-xl border border-black/[0.09]">
                        <button onClick={() => setLine(l.key, { qty: Math.max(1, l.qty - 1) })} className="grid h-9 w-8 place-items-center text-neutral-500 hover:text-black"><Minus className="h-3.5 w-3.5" /></button>
                        <input className="w-full min-w-0 border-0 text-center text-sm outline-none" value={l.qty} onChange={(e) => setLine(l.key, { qty: Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1) })} inputMode="numeric" />
                        <button onClick={() => setLine(l.key, { qty: l.qty + 1 })} className="grid h-9 w-8 place-items-center text-neutral-500 hover:text-black"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Price / Unit ₹</span>
                      <input className={`${inputBase} w-full`} value={l.price || ''} onChange={(e) => setLine(l.key, { price: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} placeholder="0" inputMode="decimal" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Amount ₹</span>
                      <input className={`${inputBase} w-full`} value={l.amount || ''} onChange={(e) => setLine(l.key, { amount: Number(e.target.value.replace(/[^\d.]/g, '')) || 0, amountEdited: true })} placeholder="0" inputMode="decimal" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* right — summary */}
        <div className="rounded-2xl border border-black/[0.06] bg-[#faf9f6] p-4 sm:p-5">
          {validLines.length === 0 ? (
            <p className="py-4 text-center text-xs text-neutral-400">No items added yet</p>
          ) : (
            <div className="mb-4 space-y-1.5 text-sm">
              {validLines.map((l) => (
                <div key={l.key} className="flex justify-between gap-2">
                  <span className="truncate pr-2 text-neutral-600">{labelFor(l)} <span className="text-neutral-400">×{l.qty}</span></span>
                  <span className="font-semibold text-neutral-800">{inr(l.amount)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-2">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-neutral-500">Discount</span>
            <div className="flex flex-wrap gap-2">
              <select className={`${inputBase} w-16 shrink-0`} value={discMode} onChange={(e) => setDiscMode(e.target.value as '₹' | '%')}>
                <option value="₹">₹</option><option value="%">%</option>
              </select>
              <input className={`${inputCls} min-w-[100px] flex-1`} value={discValue} onChange={(e) => setDiscValue(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" inputMode="numeric" />
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-dashed border-black/10 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-semibold text-neutral-800">{inr(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between"><span className="text-neutral-500">Discount</span><span className="font-semibold text-emerald-600">- {inr(discount)}</span></div>}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
            <span className="text-sm font-bold uppercase tracking-widest text-neutral-900">Total</span>
            <span className="text-2xl font-extrabold text-neutral-900">{inr(grandTotal)}</span>
          </div>

          {/* Payment method — Cash / GPay / Split, same as the POS panel */}
          <div className="mt-4 rounded-xl border border-black/[0.06] bg-white p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-neutral-500">Payment Method</p>

            <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-black/[0.08] bg-black/[0.03] p-1">
              {([
                { k: 'cash', label: 'Cash', Icon: Banknote },
                { k: 'gpay', label: 'GPay', Icon: Smartphone },
                { k: 'split', label: 'Split', Icon: Split },
              ] as const).map(({ k, label, Icon }) => (
                <button
                  key={k}
                  onClick={() => setPayMethod(k)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                    payMethod === k ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {payMethod === 'cash' && (
              <Field label="Amount Received (₹)">
                <input className={inputCls} value={received} onChange={(e) => setReceived(e.target.value.replace(/\D/g, ''))} placeholder="Enter cash received" inputMode="numeric" />
              </Field>
            )}
            {payMethod === 'gpay' && (
              <Field label="GPay Amount (₹)">
                <input className={inputCls} value={gpayAmt} onChange={(e) => setGpayAmt(e.target.value.replace(/\D/g, ''))} placeholder="Enter GPay amount" inputMode="numeric" />
              </Field>
            )}
            {payMethod === 'split' && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Cash Amount (₹)">
                  <input className={inputCls} value={splitCash} onChange={(e) => setSplitCash(e.target.value.replace(/\D/g, ''))} placeholder="Cash part" inputMode="numeric" />
                </Field>
                <Field label="GPay Amount (₹)">
                  <input className={inputCls} value={splitGpay} onChange={(e) => setSplitGpay(e.target.value.replace(/\D/g, ''))} placeholder="GPay part" inputMode="numeric" />
                </Field>
              </div>
            )}

            {totalReceived > 0 && (
              <div className="mt-2 space-y-0.5">
                {payMethod === 'split' && (
                  <p className="text-[11px] font-semibold text-neutral-500">
                    Total received: <span className="text-neutral-800">{inr(totalReceived)}</span>
                  </p>
                )}
                <p className={`text-xs font-bold ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {change >= 0 ? `Change to return: ${inr(change)}` : `Short by ${inr(-change)}`}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => createBill({ print: false, whatsapp: true })}
            disabled={saving}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3.5 text-center text-xs font-bold uppercase leading-tight tracking-wide text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 sm:text-sm"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span>Save &amp; WhatsApp</span>
          </button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setPrintOpen(true)}
              disabled={saving}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-black/[0.1] py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-700 hover:bg-black/[0.03] disabled:opacity-60"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              onClick={() => createBill({ print: false, whatsapp: false })}
              disabled={saving}
              className="rounded-xl border border-black/[0.1] py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-700 hover:bg-black/[0.03] disabled:opacity-60"
            >
              Save Only
            </button>
          </div>
        </div>
      </div>

      {/* Inventory picker */}
      <Modal open={catalogOpen} onClose={() => setCatalogOpen(false)} size="md">
        <ModalHeader title="Wholesale Inventory" onClose={() => setCatalogOpen(false)} />
        <div className="p-3">
          <div className="relative mb-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search code, company, colour…" className="w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400" />
          </div>
          {catalogList.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-neutral-400">No matching items. Add them in Wholesale Inventory first.</p>
          ) : (
            <div className="max-h-[60vh] divide-y divide-black/[0.05] overflow-y-auto">
              {catalogList.map((it) => (
                <button key={it.id} onClick={() => addItem(it)} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left hover:bg-black/[0.03]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">{[it.code, it.company].filter(Boolean).join(' — ') || 'Item'}</p>
                    {it.color && <p className="truncate text-xs text-neutral-400">{it.color}</p>}
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-neutral-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Print settings — pick printer + paper size, then print the receipt */}
      <Modal open={printOpen} onClose={() => setPrintOpen(false)} size="md">
        <ModalHeader title="Print Settings" onClose={() => setPrintOpen(false)} />
        <div className="space-y-6 p-5 sm:p-6">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-500">Printer</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <PrintOption
                active={printer === 'thermal'}
                onClick={() => selectPrinter('thermal')}
                icon={<Printer className="h-4 w-4" />}
                title="Label Printer (Thermal)"
                sub="Receipt / roll printer"
              />
              <PrintOption
                active={printer === 'a4'}
                onClick={() => selectPrinter('a4')}
                icon={<FileText className="h-4 w-4" />}
                title="Regular Printer (A4)"
                sub="Standard sheet printer"
              />
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-500">Size</p>
            <div className="grid grid-cols-2 gap-2">
              {PRINT_SIZES[printer].map((s) => (
                <PrintOption
                  key={s.k}
                  active={printSize === s.k}
                  onClick={() => setPrintSize(s.k)}
                  title={s.label}
                  sub={s.sub}
                />
              ))}
            </div>
          </div>

          <p className="text-[11px] text-neutral-400">
            The invoice opens in a new tab and prints on the selected paper. It is also saved to Wholesale records.
          </p>

          <button
            onClick={confirmPrint}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-3 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-black disabled:opacity-60"
          >
            <Printer className="h-4 w-4" /> Print Invoice
          </button>
        </div>
      </Modal>

      <Toast show={!!toast} message={toast} />
    </Card>
  );
}

function PrintOption({
  active,
  onClick,
  icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        active ? 'border-neutral-900 bg-neutral-900/[0.04]' : 'border-black/[0.1] hover:bg-black/[0.02]'
      }`}
    >
      {icon && (
        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${active ? 'bg-neutral-900 text-white' : 'bg-black/[0.05] text-neutral-500'}`}>
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-bold text-neutral-900">{title}</span>
        <span className="block text-[11px] text-neutral-500">{sub}</span>
      </span>
      {active && (
        <span className="absolute right-2.5 top-2.5 grid h-4 w-4 place-items-center rounded-full bg-neutral-900 text-white">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}
