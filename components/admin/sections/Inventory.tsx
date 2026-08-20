'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Minus, Trash2, Bell, AlertTriangle, Pencil, ChevronDown, ImagePlus } from 'lucide-react';
import {
  useAdminData,
  adjustStock,
  updateProduct,
  addProduct,
  deleteProduct,
  inr,
  type Product,
} from '@/lib/store';
import { Card, Modal, ModalHeader, EmptyState, Field, inputCls } from '../ui';

function playAlert() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const beep = (t: number, freq: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime + t;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      o.start(now);
      o.stop(now + 0.22);
    };
    beep(0, 880);
    beep(0.24, 660);
    setTimeout(() => ctx.close(), 900);
  } catch {
    /* audio blocked — ignore */
  }
}

const statusOf = (p: Product) => (p.stock <= 0 ? 'out' : p.stock <= p.lowStock ? 'low' : 'ok');

function ProductImg({ product, className }: { product: Product; className?: string }) {
  const [err, setErr] = useState(false);
  if (product.image && !err) {
    return <img src={product.image} alt={product.name} onError={() => setErr(true)} className={`object-cover ${className}`} />;
  }
  return (
    <div className={`grid place-items-center bg-black/[0.05] text-sm font-bold text-neutral-500 ${className}`}>
      {product.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function Inventory() {
  const { products } = useAdminData();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [status, setStatus] = useState<'all' | 'low' | 'out'>('all');
  const [sort, setSort] = useState<'name' | 'stock-asc' | 'stock-desc' | 'price'>('name');
  const [alertOpen, setAlertOpen] = useState(false);
  const [form, setForm] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const attention = useMemo(() => products.filter((p) => statusOf(p) !== 'ok'), [products]);

  useEffect(() => {
    if (attention.length > 0) {
      setAlertOpen(true);
      playAlert();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => ['all', ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = products.filter(
      (p) =>
        (cat === 'all' || p.category === cat) &&
        (status === 'all' || statusOf(p) === status) &&
        (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
    );
    return [...filtered].sort((a, b) => {
      if (sort === 'stock-asc') return a.stock - b.stock;
      if (sort === 'stock-desc') return b.stock - a.stock;
      if (sort === 'price') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
  }, [products, query, cat, status, sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Inventory</h2>
          <p className="text-sm text-neutral-500">{products.length} products · same catalog customers see</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => { setAlertOpen(true); playAlert(); }}
            className={`relative flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold ${attention.length ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-black/[0.08] text-neutral-600'}`}
          >
            <Bell className="h-4 w-4" /> Alerts
            {attention.length > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">{attention.length}</span>}
          </button>
          <button onClick={() => setForm({ open: true, product: null })} className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {attention.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span><b>{attention.filter((p) => p.stock <= 0).length}</b> out of stock · <b>{attention.filter((p) => statusOf(p) === 'low').length}</b> running low — restock soon.</span>
        </div>
      )}

      <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'low', 'out'] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-colors ${status === s ? 'bg-neutral-900 text-white' : 'bg-black/[0.04] text-neutral-600 hover:bg-black/[0.07]'}`}>
              {s === 'all' ? 'All' : s === 'low' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
          <div className="relative">
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="appearance-none rounded-lg border border-black/[0.09] bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-neutral-700 outline-none focus:border-neutral-400">
              {categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          </div>
          <div className="relative">
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="appearance-none rounded-lg border border-black/[0.09] bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-neutral-700 outline-none focus:border-neutral-400">
              <option value="name">Name A–Z</option>
              <option value="stock-asc">Stock: Low → High</option>
              <option value="stock-desc">Stock: High → Low</option>
              <option value="price">Price: High → Low</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          </div>
        </div>
        <div className="relative w-full lg:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="w-full rounded-xl border border-black/[0.09] bg-white py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400" />
        </div>
      </Card>

      {list.length === 0 ? (
        <Card><EmptyState message="No products match your filters." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const st = statusOf(p);
            const cardCls = st === 'out' ? 'border-red-300 bg-red-50' : st === 'low' ? 'border-amber-300 bg-amber-50' : 'border-black/[0.06] bg-white';
            return (
              <div key={p.id} className={`overflow-hidden rounded-2xl border ${cardCls}`}>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/[0.04]">
                  <ProductImg product={p} className="h-full w-full" />
                  <span className="absolute left-3 top-3"><StockBadge status={st} /></span>
                  <div className="absolute right-3 top-3 flex gap-1.5">
                    <button onClick={() => setForm({ open: true, product: p })} className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-neutral-700 shadow-sm hover:text-black" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setConfirmId(p.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-red-500 shadow-sm hover:bg-white" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-neutral-900">{p.name}</p>
                      <p className="text-xs text-neutral-500">{p.category}</p>
                    </div>
                    <p className="shrink-0 text-sm font-extrabold text-neutral-900">{inr(p.price)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-black/[0.12] bg-white">
                      <button onClick={() => adjustStock(p.id, -1)} className="grid h-9 w-9 place-items-center text-neutral-500 hover:text-black"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-10 text-center text-sm font-bold text-neutral-900">{p.stock}</span>
                      <button onClick={() => adjustStock(p.id, 1)} className="grid h-9 w-9 place-items-center text-neutral-500 hover:text-black"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <span className="text-[11px] font-medium text-neutral-500">
                      {st === 'out' ? 'Restock needed' : st === 'low' ? `Low · reorder @ ${p.lowStock}` : 'In stock'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stock alert */}
      <Modal open={alertOpen} onClose={() => setAlertOpen(false)} size="md">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-100 text-amber-600"><AlertTriangle className="h-5 w-5" /></span>
            <div>
              <p className="text-lg font-bold text-neutral-900">Stock Alert</p>
              <p className="text-xs text-neutral-500">{attention.length} product(s) need attention</p>
            </div>
          </div>
          {attention.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">All products are well stocked. 🎉</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {attention.map((p) => (
                <div key={p.id} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${statusOf(p) === 'out' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{p.name}</p>
                    <p className="text-xs text-neutral-500">{p.category} · {p.stock} left</p>
                  </div>
                  <button onClick={() => updateProduct(p.id, { stock: p.stock + 10 })} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800">Restock +10</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setAlertOpen(false)} className="mt-5 w-full rounded-xl border border-black/[0.1] py-2.5 text-sm font-bold text-neutral-700 hover:bg-black/[0.03]">Dismiss</button>
        </div>
      </Modal>

      <ProductForm state={form} onClose={() => setForm({ open: false, product: null })} />

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} size="sm">
        <div className="p-6 text-center">
          <p className="text-lg font-bold text-neutral-900">Delete product?</p>
          <p className="mt-1 text-sm text-neutral-500">This removes it from the catalog. Past orders keep their line items.</p>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setConfirmId(null)} className="flex-1 rounded-xl border border-black/[0.1] py-2.5 text-sm font-bold text-neutral-700 hover:bg-black/[0.03]">Cancel</button>
            <button onClick={() => { if (confirmId) deleteProduct(confirmId); setConfirmId(null); }} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StockBadge({ status }: { status: 'ok' | 'low' | 'out' }) {
  const map = { ok: 'bg-emerald-500 text-white', low: 'bg-amber-500 text-white', out: 'bg-red-500 text-white' } as const;
  const label = status === 'ok' ? 'In stock' : status === 'low' ? 'Low stock' : 'Out of stock';
  return <span className={`rounded-md px-2 py-1 text-[9px] font-bold uppercase shadow-sm ${map[status]}`}>{label}</span>;
}

function ProductForm({ state, onClose }: { state: { open: boolean; product: Product | null }; onClose: () => void }) {
  const editing = state.product;
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [lowStock, setLowStock] = useState('6');
  const [image, setImage] = useState('');

  // load values when the modal opens for a product
  useEffect(() => {
    if (state.open) {
      setName(editing?.name ?? '');
      setCategory(editing?.category ?? '');
      setPrice(editing ? String(editing.price) : '');
      setStock(editing ? String(editing.stock) : '');
      setLowStock(editing ? String(editing.lowStock) : '6');
      setImage(editing?.image ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.open, editing]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(f);
  };

  const save = () => {
    if (!name.trim() || !price) return;
    const payload = {
      name: name.trim(),
      category: category.trim() || 'General',
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      lowStock: Number(lowStock) || 6,
      image: image || undefined,
    };
    if (editing) updateProduct(editing.id, payload);
    else addProduct({ id: 'P' + Math.random().toString(36).slice(2, 7).toUpperCase(), ...payload });
    onClose();
  };

  return (
    <Modal open={state.open} onClose={onClose} size="md">
      <ModalHeader title={editing ? 'Edit Product' : 'Add Product'} onClose={onClose} />
      <div className="space-y-4 p-5 sm:p-6">
        {/* image picker */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-black/[0.08] bg-black/[0.04]">
            {image ? <img src={image} alt="preview" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-neutral-400"><ImagePlus className="h-6 w-6" /></div>}
          </div>
          <div className="flex-1 space-y-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-black/[0.1] px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-black/[0.03]">
              <ImagePlus className="h-3.5 w-3.5" /> Upload image
              <input type="file" accept="image/*" onChange={onFile} className="hidden" />
            </label>
            <input className={`${inputCls} text-xs`} value={image.startsWith('data:') ? '' : image} onChange={(e) => setImage(e.target.value)} placeholder="…or paste an image URL" />
          </div>
        </div>

        <Field label="Product Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Merino Sweater" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category"><input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Knitwear" /></Field>
          <Field label="Price (₹)"><input className={inputCls} value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="0" inputMode="numeric" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Stock"><input className={inputCls} value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ''))} placeholder="0" inputMode="numeric" /></Field>
          <Field label="Low-stock alert at"><input className={inputCls} value={lowStock} onChange={(e) => setLowStock(e.target.value.replace(/\D/g, ''))} placeholder="6" inputMode="numeric" /></Field>
        </div>
        <button onClick={save} className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-bold text-white hover:bg-neutral-800">{editing ? 'Save Changes' : 'Add to Catalog'}</button>
      </div>
    </Modal>
  );
}
