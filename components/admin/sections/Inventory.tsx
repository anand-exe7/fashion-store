'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Minus, Trash2, Bell, AlertTriangle, Pencil, ChevronDown, ImagePlus, Eye, EyeOff, ArrowUp, ArrowDown, X, Sparkles } from 'lucide-react';
import {
  useAdminData,
  adjustStock,
  updateProduct,
  addProduct,
  deleteProduct,
  fetchSuggestionIds,
  updateSuggestions,
  showToast,
  inr,
  type Product,
} from '@/lib/store';
import { Card, Modal, ModalHeader, EmptyState, Field, inputCls, AgeRangeInput } from '../ui';
import { formatAgeRange } from '@/lib/db';

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
  const { products, departments } = useAdminData();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [dept, setDept] = useState<string>('all');
  const [status, setStatus] = useState<'all' | 'low' | 'out'>('all');
  const [sort, setSort] = useState<'name' | 'stock-asc' | 'stock-desc' | 'price'>('name');
  const [alertOpen, setAlertOpen] = useState(false);
  const [form, setForm] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const attention = useMemo(() => {
    const alerts: { product: Product, variant: any }[] = [];
    products.forEach(p => {
      if (p.variants && p.variants.some(v => v.size && v.size !== 'Default')) {
        p.variants.forEach(v => {
          if (v.size && v.size !== 'Default' && v.stock <= (p.lowStock || 6)) {
            alerts.push({ product: p, variant: v });
          }
        });
      } else {
        if (p.stock <= p.lowStock) alerts.push({ product: p, variant: null });
      }
    });
    return alerts;
  }, [products]);

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
        (dept === 'all' || p.department === dept || (!p.department && dept === 'Unisex')) &&
        (status === 'all' || statusOf(p) === status) &&
        (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
    );
    return [...filtered].sort((a, b) => {
      if (sort === 'stock-asc') return a.stock - b.stock;
      if (sort === 'stock-desc') return b.stock - a.stock;
      if (sort === 'price') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
  }, [products, query, cat, dept, status, sort]);

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
          <span><b>{attention.filter((a) => (a.variant ? a.variant.stock : a.product.stock) <= 0).length}</b> variants out of stock · <b>{attention.filter((a) => (a.variant ? a.variant.stock : a.product.stock) > 0).length}</b> running low — restock soon.</span>
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
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="appearance-none rounded-lg border border-black/[0.09] bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-neutral-700 outline-none focus:border-neutral-400">
              <option value="all">All Depts</option>
              {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {list.map((p) => {
            const st = statusOf(p);
            const cardCls = st === 'out' ? 'border-red-300 bg-red-50' : st === 'low' ? 'border-amber-300 bg-amber-50' : 'border-black/[0.06] bg-white';
            return (
              <div key={p.id} className={`overflow-hidden rounded-2xl border ${cardCls}`}>
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/[0.04]">
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
                  <div className="mt-4 flex flex-col gap-2 2xl:flex-row 2xl:items-center 2xl:justify-between">
                    <div className="flex w-max items-center rounded-lg border border-black/[0.12] bg-neutral-50 px-3 py-1.5">
                      <span className="text-sm font-bold text-neutral-900">{p.stock} Total Units</span>
                    </div>
                    <span className="text-[11px] font-medium text-neutral-500 leading-tight whitespace-nowrap">
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
            <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
              {attention.map((a, i) => {
                const p = a.product;
                const v = a.variant;
                const stockVal = v ? v.stock : p.stock;
                const isOut = stockVal <= 0;
                return (
                  <div key={`${p.id}-${i}`} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${isOut ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{p.name}</p>
                      <p className="text-xs text-neutral-500">
                        {p.category} {v ? `· ${v.colorName || ''} (${v.size})` : ''} · 
                        <span className={`ml-1 font-bold ${isOut ? 'text-red-600' : 'text-amber-600'}`}>
                          {stockVal} Unit{stockVal === 1 ? '' : 's'} left
                        </span>
                      </p>
                    </div>
                    <button onClick={() => { setAlertOpen(false); setForm({ open: true, product: p }); }} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800">Edit</button>
                  </div>
                );
              })}
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
            <button onClick={async () => { if (confirmId) { await deleteProduct(confirmId); showToast("Product deleted"); } setConfirmId(null); }} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700">Delete</button>
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

const MAX_SUGGESTIONS = 4;

function ProductForm({ state, onClose }: { state: { open: boolean; product: Product | null }; onClose: () => void }) {
  const editing = state.product;
  const { products, categories = [], departments } = useAdminData();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState<string>('');
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [stock, setStock] = useState('');
  const [lowStock, setLowStock] = useState('6');
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [discountLabel, setDiscountLabel] = useState('');
  const [suggestionIds, setSuggestionIds] = useState<string[]>([]);
  const [suggestionQuery, setSuggestionQuery] = useState('');

  // load values when the modal opens for a product
  useEffect(() => {
    if (state.open) {
      setName(editing?.name ?? '');
      setCategory(editing?.category ?? '');
      setDepartment(editing?.department ?? (departments.find(d => d.name === 'Unisex')?.name ?? departments[0]?.name ?? ''));
      setDescription(editing?.description ?? '');
      setPrice(editing ? String(editing.price) : '');
      setWeight(editing ? String(editing.weightGrams || '') : '');
      setStock(editing ? String(editing.stock) : '');
      setLowStock(editing ? String(editing.lowStock) : '6');
      setIsNew(editing?.isNew ?? false);
      setDiscountLabel(editing?.discountLabel ?? '');
      
      const allImages = editing?.images ? [...editing.images] : [];
      if (editing?.image && !allImages.includes(editing.image)) {
        allImages.unshift(editing.image);
      }
      setImages(allImages);

      setVariants(editing?.variants ? [...editing.variants] : [{ size: '', stock: 0 }]);

      setSuggestionQuery('');
      if (editing?.id) {
        fetchSuggestionIds(editing.id).then(setSuggestionIds).catch(() => setSuggestionIds([]));
      } else {
        setSuggestionIds([]);
      }
    }
  }, [state.open, editing]);

  const addVariant = () => setVariants([...variants, { size: '', stock: 0, weightGrams: '', isAvailable: true }]);
  const removeVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));
  const updateVariant = (idx: number, field: string, val: any) => {
    setVariants(prev => {
      const v = [...prev];
      v[idx] = { ...v[idx], [field]: val };
      return v;
    });
  };
  const toggleVariantStatus = (idx: number) => {
    const v = [...variants];
    v[idx].isAvailable = v[idx].isAvailable === false ? true : false;
    setVariants(v);
  };

  const addSuggestion = (id: string) => {
    if (suggestionIds.includes(id) || suggestionIds.length >= MAX_SUGGESTIONS) return;
    setSuggestionIds([...suggestionIds, id]);
  };
  const removeSuggestion = (id: string) => setSuggestionIds(suggestionIds.filter((s) => s !== id));
  const moveSuggestion = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= suggestionIds.length) return;
    const next = [...suggestionIds];
    [next[idx], next[target]] = [next[target], next[idx]];
    setSuggestionIds(next);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    setUploading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const newUrls: string[] = [];
      for (const f of files) {
        const ext = f.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
        const filePath = `products/${fileName}`;
        
        const { error } = await supabase.storage.from('images').upload(filePath, f);
        if (error) {
          alert(`Upload failed for ${f.name}. Make sure you have created an 'images' bucket in Supabase and made it public.`);
          console.error(error);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        newUrls.push(publicUrl);
      }
      
      setImages(prev => [...prev, ...newUrls]);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim() || !price) return;
    setUploading(true);
    
    try {
      const validVariants = variants.filter(v => v.size.trim());
      const totalStock = validVariants.length > 0 
        ? validVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : (Number(stock) || 0);

      const payload = {
        name: name.trim(),
        category: category.trim() || 'General',
        department: department,
        description: description.trim(),
        price: Number(price) || 0,
        weightGrams: Number(weight) || 0,
        stock: totalStock,
        lowStock: Number(lowStock) || 6,
        isNew: isNew,
        discountLabel: discountLabel.trim() || null,
        image: images[0] || undefined,
        images: images.length > 0 ? images : undefined,
        variants: validVariants.length > 0 ? validVariants : undefined,
      };
      
      if (editing) {
        await updateProduct(editing.id, payload);
        await updateSuggestions(editing.id, suggestionIds);
        showToast("Product updated successfully!");
      } else {
        const newId = 'P' + Math.random().toString(36).slice(2, 7).toUpperCase();
        await addProduct({ id: newId, ...payload } as Product);
        if (suggestionIds.length > 0) await updateSuggestions(newId, suggestionIds);
        showToast("Product added to catalog!");
      }
      onClose();
    } catch (e: any) {
      console.error(e);
      showToast("An error occurred while saving.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={state.open} onClose={onClose} size="xl">
      <ModalHeader title={editing ? 'Edit Product' : 'Add Product'} onClose={onClose} />
      
      <div className="flex flex-col">
        {/* Top 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Basic Info & Images */}
          <div className="space-y-6 p-5 sm:p-6 border-b md:border-b-0 md:border-r border-black/[0.06] bg-white">
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold tracking-tight text-neutral-900">Basic Details</h3>
              <Field label="Product Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Merino Sweater" /></Field>
              <Field label="Description"><textarea className={`${inputCls} h-28 resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell your customers about this product..." /></Field>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold tracking-tight text-neutral-900">Media Gallery</h3>
                <label className="cursor-pointer text-xs font-bold text-neutral-900 hover:underline">
                  Upload
                  <input type="file" accept="image/*" multiple onChange={onFile} className="hidden" disabled={uploading} />
                </label>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {images.map((url, i) => (
                  <div key={i} className={`group relative h-20 w-20 overflow-hidden rounded-xl border ${i === 0 ? 'border-neutral-900 shadow-sm' : 'border-black/[0.08]'} bg-black/[0.04]`}>
                    {i === 0 && <div className="absolute top-0 left-0 right-0 bg-neutral-900/80 px-1 py-0.5 text-center text-[8px] font-bold uppercase text-white backdrop-blur-sm z-10">Primary</div>}
                    <img src={url} alt={`Preview ${i}`} className="h-full w-full object-cover" />
                    <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute inset-0 z-20 grid place-items-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-black/[0.15] bg-black/[0.02] text-neutral-500 hover:bg-black/[0.04] hover:text-neutral-700 transition-colors">
                  <ImagePlus className="h-5 w-5" />
                  <input type="file" accept="image/*" multiple onChange={onFile} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Organization, Pricing */}
          <div className="space-y-6 p-5 sm:p-6 bg-neutral-50 flex flex-col">
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold tracking-tight text-neutral-900">Organization & Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="" disabled>Select category</option>
                    {categories.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Department">
                  <select className={inputCls} value={department} onChange={(e) => setDepartment(e.target.value)}>
                    {departments.length === 0 && <option value="">No departments configured</option>}
                    {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Base Price (₹)"><input className={inputCls} value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="0" inputMode="numeric" /></Field>
                <Field label="Base Weight (g)"><input className={inputCls} value={weight} onChange={(e) => setWeight(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 500" inputMode="numeric" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Discount Label"><input className={inputCls} value={discountLabel} onChange={(e) => setDiscountLabel(e.target.value)} placeholder="e.g. -20% or SALE" /></Field>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm font-bold text-neutral-700">
                <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" />
                Mark as "New Arrival"
              </label>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold tracking-tight text-neutral-900">Inventory Alerts</h3>
              <div className="grid grid-cols-2 gap-4">
                {!variants.some(v => v.size.trim()) && (
                  <Field label="Default Stock"><input className={inputCls} value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ''))} placeholder="0" inputMode="numeric" /></Field>
                )}
                <Field label="Low-stock alert at"><input className={inputCls} value={lowStock} onChange={(e) => setLowStock(e.target.value.replace(/\D/g, ''))} placeholder="6" inputMode="numeric" /></Field>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Variants Section */}
        <div className="p-5 sm:p-6 bg-neutral-100 border-t border-black/[0.06] rounded-b-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-neutral-900">Product Variants</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mt-1">Manage sizes, colors, and specific inventory</p>
            </div>
            <button type="button" onClick={addVariant} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold shadow-sm hover:bg-neutral-800 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>
          
          <div className="space-y-2">
            {variants.length > 0 && (
              <div className="grid grid-cols-[1.3fr_1.3fr_0.8fr_0.8fr_0.8fr_1.6fr_100px] gap-3 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                <span>Size</span>
                <span>Color</span>
                <span>Price (+₹)</span>
                <span>Weight (g)</span>
                <span>Stock</span>
                <span>Age Range (opt.)</span>
                <span className="text-center">Actions</span>
              </div>
            )}

            {variants.map((v, i) => (
              <div key={i} className={`grid grid-cols-[1.3fr_1.3fr_0.8fr_0.8fr_0.8fr_1.6fr_100px] gap-3 items-center bg-white p-2 rounded-xl border ${v.isAvailable === false ? 'border-neutral-200 opacity-50 grayscale' : 'border-black/[0.08] shadow-sm'} transition-all`}>
                <input className={`${inputCls} !shadow-none`} placeholder="e.g. M" value={v.size} onChange={e => updateVariant(i, 'size', e.target.value)} disabled={v.isAvailable === false} />
                <input className={`${inputCls} !shadow-none`} placeholder="e.g. Blue" value={v.colorName || ''} onChange={e => updateVariant(i, 'colorName', e.target.value)} disabled={v.isAvailable === false} />
                <input className={`${inputCls} !shadow-none font-mono text-xs`} placeholder="Base" type="number" value={v.price || ''} onChange={e => updateVariant(i, 'price', Number(e.target.value) || undefined)} disabled={v.isAvailable === false} />
                <input className={`${inputCls} !shadow-none font-mono text-xs`} placeholder="Base" type="number" value={v.weightGrams || ''} onChange={e => updateVariant(i, 'weightGrams', Number(e.target.value) || undefined)} disabled={v.isAvailable === false} />
                <input className={`${inputCls} !shadow-none font-mono text-xs`} placeholder="0" type="number" value={v.stock || ''} onChange={e => updateVariant(i, 'stock', Number(e.target.value) || 0)} disabled={v.isAvailable === false} />
                <AgeRangeInput
                  minMonths={v.ageMinMonths}
                  maxMonths={v.ageMaxMonths}
                  onChange={(min, max) => { updateVariant(i, 'ageMinMonths', min); updateVariant(i, 'ageMaxMonths', max); }}
                />

                <div className="flex items-center justify-center gap-1.5">
                  <button 
                    type="button" 
                    onClick={() => toggleVariantStatus(i)} 
                    className={`shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-colors ${
                      v.isAvailable === false 
                        ? 'bg-neutral-900 text-white hover:bg-neutral-800' 
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {v.isAvailable === false ? 'Enable' : 'Disable'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => removeVariant(i)} 
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete Row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {variants.length === 0 && (
              <div className="py-8 border-2 border-dashed border-black/[0.08] rounded-2xl flex flex-col items-center justify-center bg-white/50">
                <span className="text-xs font-bold text-neutral-700">No variants added</span>
                <span className="text-[10px] font-medium text-neutral-500 mt-1">This product will use the base stock and pricing.</span>
              </div>
            )}
          </div>

          {(() => {
            const mins = variants.map(v => v.ageMinMonths).filter((m): m is number => m != null);
            const maxes = variants.map(v => v.ageMaxMonths).filter((m): m is number => m != null);
            if (mins.length === 0 && maxes.length === 0) return null;
            const resolved = formatAgeRange(
              mins.length ? Math.min(...mins) : null,
              maxes.length ? Math.max(...maxes) : null,
            );
            return (
              <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Resolved age range: <span className="text-neutral-900">{resolved}</span> — computed from the rows above, saved automatically.
              </p>
            );
          })()}

          <div className="mt-8 pt-4 border-t border-black/[0.06] flex justify-end">
            <button disabled={uploading} onClick={save} className="w-full sm:w-auto px-10 rounded-xl bg-neutral-900 py-3.5 text-sm font-extrabold tracking-wide text-white shadow-lg shadow-black/10 transition-all hover:bg-neutral-800 hover:shadow-xl active:scale-[0.98] disabled:opacity-50">
              {uploading ? 'Uploading...' : editing ? 'Save Changes' : 'Add to Catalog'}
            </button>
          </div>
        </div>

        {/* Suggested Products ("Complete the Look") */}
        <div className="p-5 sm:p-6 bg-white border-t border-black/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-neutral-400" />
              <div>
                <h3 className="text-sm font-extrabold tracking-tight text-neutral-900">Suggested Products ({suggestionIds.length}/{MAX_SUGGESTIONS})</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mt-1">Shown under &ldquo;Complete The Look&rdquo; on this product&apos;s page</p>
              </div>
            </div>
          </div>

          {!editing ? (
            <div className="py-6 border-2 border-dashed border-black/[0.08] rounded-2xl flex items-center justify-center bg-neutral-50/50">
              <span className="text-xs font-medium text-neutral-500">Save this product first to add suggestions.</span>
            </div>
          ) : (
            <SuggestionPicker
              products={products}
              currentId={editing.id}
              selectedIds={suggestionIds}
              query={suggestionQuery}
              onQueryChange={setSuggestionQuery}
              onAdd={addSuggestion}
              onRemove={removeSuggestion}
              onMove={moveSuggestion}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

function SuggestionPicker({
  products,
  currentId,
  selectedIds,
  query,
  onQueryChange,
  onAdd,
  onRemove,
  onMove,
}: {
  products: Product[];
  currentId: string;
  selectedIds: string[];
  query: string;
  onQueryChange: (q: string) => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
}) {
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selected = selectedIds.map((id) => byId.get(id)).filter((p): p is Product => !!p);
  const atMax = selectedIds.length >= MAX_SUGGESTIONS;

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.id !== currentId &&
        !selectedIds.includes(p.id) &&
        (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
    );
  }, [products, currentId, selectedIds, query]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search products to suggest…"
          className="w-full rounded-xl border border-black/[0.09] bg-white py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available */}
        <div className="rounded-xl border border-black/[0.08] bg-neutral-50">
          <div className="px-3 py-2 border-b border-black/[0.06] text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Available
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-black/[0.05]">
            {available.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-neutral-400">No matching products.</p>
            ) : (
              available.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onAdd(p.id)}
                  disabled={atMax}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ProductImg product={p} className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-neutral-900">{p.name}</p>
                    <p className="truncate text-[10px] text-neutral-500">{p.category}</p>
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-neutral-400" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected */}
        <div className="rounded-xl border border-black/[0.08] bg-white">
          <div className="px-3 py-2 border-b border-black/[0.06] flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Selected</span>
            {atMax && <span className="text-[10px] font-bold text-amber-600">Max {MAX_SUGGESTIONS} reached</span>}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-black/[0.05]">
            {selected.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-neutral-400">No suggestions selected yet.</p>
            ) : (
              selected.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2">
                  <ProductImg product={p} className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-neutral-900">{p.name}</p>
                    <p className="truncate text-[10px] text-neutral-500">{p.category}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0} className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 hover:bg-black/[0.05] hover:text-neutral-800 disabled:opacity-30" aria-label="Move up">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => onMove(i, 1)} disabled={i === selected.length - 1} className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 hover:bg-black/[0.05] hover:text-neutral-800 disabled:opacity-30" aria-label="Move down">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => onRemove(p.id)} className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
