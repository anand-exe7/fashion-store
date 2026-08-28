'use client';
import { useState } from 'react';
import { ImagePlus, Trash2, Save, Plus, GripVertical, Check } from 'lucide-react';
import { Card, Field, inputCls } from '../ui';
import { useAdminData, showToast } from '@/lib/store';

interface HeroSettings {
  headline: string[];
  subtext: string;
  rightCopy: string;
  featuredTitle: string;
  featuredPrice: string;
}

interface CategoryItem {
  title: string;
  desc: string;
  bgColor: string;
  image: string;
}

interface NewArrivalsSettings {
  label: string;
  heading: string;
  linkText: string;
  count: number;
  selectedProductIds: string[];
}

const COLOR_OPTIONS = [
  { label: 'Blue', value: 'bg-[#D3EAFC]' },
  { label: 'Pink', value: 'bg-[#FCD3E1]' },
  { label: 'Green', value: 'bg-[#D5EAD8]' },
  { label: 'Yellow', value: 'bg-[#FCEFD3]' },
  { label: 'Purple', value: 'bg-[#E3D5F0]' },
  { label: 'Peach', value: 'bg-[#FCE0D3]' },
];

const STORAGE_KEY_HERO = 'shalistone_hero_settings';
const STORAGE_KEY_CATEGORIES = 'shalistone_category_settings';
const STORAGE_KEY_NEW_ARRIVALS = 'shalistone_new_arrivals_settings';

function loadHero(): HeroSettings {
  if (typeof window === 'undefined') return defaultHero();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HERO);
    return raw ? JSON.parse(raw) : defaultHero();
  } catch { return defaultHero(); }
}

function defaultHero(): HeroSettings {
  return {
    headline: ['Little Stars,', 'Big Style —', 'Made for', 'Every Age'],
    subtext: 'Adorable outfits for kids aged 0–16. Designed to play, built to last.',
    rightCopy: 'Where comfort meets playful style for your little ones.',
    featuredTitle: 'Kids Comfort Set',
    featuredPrice: '₹899.00',
  };
}

function loadCategories(): CategoryItem[] {
  if (typeof window === 'undefined') return defaultCategories();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    return raw ? JSON.parse(raw) : defaultCategories();
  } catch { return defaultCategories(); }
}

function defaultNewArrivals(): NewArrivalsSettings {
  return { label: 'Curated Selection', heading: 'New\nArrivals', linkText: 'Discover All', count: 3, selectedProductIds: [] };
}

function loadNewArrivals(): NewArrivalsSettings {
  if (typeof window === 'undefined') return defaultNewArrivals();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NEW_ARRIVALS);
    if (!raw) return defaultNewArrivals();
    const parsed = JSON.parse(raw);
    return { ...defaultNewArrivals(), ...parsed, selectedProductIds: parsed.selectedProductIds || [] };
  } catch { return defaultNewArrivals(); }
}

function defaultCategories(): CategoryItem[] {
  return [
    { title: 'Infants (0–2)', desc: 'Soft onesies & rompers', bgColor: 'bg-[#D5EAD8]', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800&auto=format&fit=crop' },
    { title: 'Toddlers (3–5)', desc: 'Playful sets & combos', bgColor: 'bg-[#FCD3E1]', image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=800&auto=format&fit=crop' },
    { title: 'Kids (6–12)', desc: 'Cool & comfy everyday', bgColor: 'bg-[#D3EAFC]', image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=800&auto=format&fit=crop' },
    { title: 'Teens (13–16)', desc: 'Trendy fits, their style', bgColor: 'bg-[#FCEFD3]', image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=800&auto=format&fit=crop' },
  ];
}

export default function WebsiteContent() {
  const [hero, setHero] = useState<HeroSettings>(loadHero);
  const [categories, setCategories] = useState<CategoryItem[]>(loadCategories);
  const { products } = useAdminData();
  const [newArrivals, setNewArrivals] = useState<NewArrivalsSettings>(loadNewArrivals);
  const [heroSaved, setHeroSaved] = useState(false);
  const [catSaved, setCatSaved] = useState(false);
  const [naSaved, setNaSaved] = useState(false);

  const toggleProduct = (id: string) => {
    const ids = newArrivals.selectedProductIds;
    if (ids.includes(id)) {
      setNewArrivals({ ...newArrivals, selectedProductIds: ids.filter(x => x !== id) });
    } else if (ids.length < newArrivals.count) {
      setNewArrivals({ ...newArrivals, selectedProductIds: [...ids, id] });
    } else {
      showToast(`You can select up to ${newArrivals.count} products. Remove one first or increase the count.`);
    }
  };

  const updateHeadline = (idx: number, val: string) => {
    const h = [...hero.headline];
    h[idx] = val;
    setHero({ ...hero, headline: h });
  };

  const saveHero = () => {
    localStorage.setItem(STORAGE_KEY_HERO, JSON.stringify(hero));
    setHeroSaved(true);
    showToast('Hero settings saved! Refresh the storefront to see changes.');
    setTimeout(() => setHeroSaved(false), 2000);
  };

  const updateCategory = (idx: number, field: keyof CategoryItem, val: string) => {
    const cats = [...categories];
    cats[idx] = { ...cats[idx], [field]: val };
    setCategories(cats);
  };

  const addCategory = () => {
    setCategories([...categories, { title: '', desc: '', bgColor: 'bg-[#D3EAFC]', image: '' }]);
  };

  const removeCategory = (idx: number) => {
    setCategories(categories.filter((_, i) => i !== idx));
  };

  const saveCategories = () => {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    setCatSaved(true);
    showToast('Category settings saved! Refresh the storefront to see changes.');
    setTimeout(() => setCatSaved(false), 2000);
  };

  const saveNewArrivals = () => {
    localStorage.setItem(STORAGE_KEY_NEW_ARRIVALS, JSON.stringify(newArrivals));
    setNaSaved(true);
    showToast('New Arrivals settings saved! Refresh the storefront to see changes.');
    setTimeout(() => setNaSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Website Content</h2>
        <p className="text-sm text-neutral-500">Manage hero, new arrivals label, and shop-by-category on the storefront</p>
      </div>

      {/* Hero Section Editor */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Hero Section</h3>
            <p className="text-xs text-neutral-500">Customize the main landing page hero content</p>
          </div>
          <button
            onClick={saveHero}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
          >
            <Save className="h-4 w-4" /> {heroSaved ? 'Saved!' : 'Save Hero'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold tracking-tight text-neutral-900">Headline Lines</h4>
            {hero.headline.map((line, i) => (
              <Field key={i} label={`Line ${i + 1}`}>
                <input className={inputCls} value={line} onChange={(e) => updateHeadline(i, e.target.value)} />
              </Field>
            ))}
          </div>
          <div className="space-y-4">
            <Field label="Subtext">
              <textarea className={`${inputCls} h-20 resize-none`} value={hero.subtext} onChange={(e) => setHero({ ...hero, subtext: e.target.value })} />
            </Field>
            <Field label="Right Side Copy (Desktop)">
              <textarea className={`${inputCls} h-20 resize-none`} value={hero.rightCopy} onChange={(e) => setHero({ ...hero, rightCopy: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Featured Product Title">
                <input className={inputCls} value={hero.featuredTitle} onChange={(e) => setHero({ ...hero, featuredTitle: e.target.value })} />
              </Field>
              <Field label="Featured Price">
                <input className={inputCls} value={hero.featuredPrice} onChange={(e) => setHero({ ...hero, featuredPrice: e.target.value })} />
              </Field>
            </div>
          </div>
        </div>
      </Card>

      {/* New Arrivals Editor */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">New Arrivals Section</h3>
            <p className="text-xs text-neutral-500">Choose which products appear in New Arrivals on the storefront</p>
          </div>
          <button
            onClick={saveNewArrivals}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
          >
            <Save className="h-4 w-4" /> {naSaved ? 'Saved!' : 'Save'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Section Label">
            <input className={inputCls} value={newArrivals.label} onChange={(e) => setNewArrivals({ ...newArrivals, label: e.target.value })} placeholder="e.g. Curated Selection" />
          </Field>
          <Field label="Heading (use \n for line break)">
            <input className={inputCls} value={newArrivals.heading} onChange={(e) => setNewArrivals({ ...newArrivals, heading: e.target.value })} placeholder="e.g. New\nArrivals" />
          </Field>
          <Field label="Link Text">
            <input className={inputCls} value={newArrivals.linkText} onChange={(e) => setNewArrivals({ ...newArrivals, linkText: e.target.value })} placeholder="e.g. Discover All" />
          </Field>
          <Field label="Max Products to Show">
            <select className={inputCls} value={newArrivals.count} onChange={(e) => setNewArrivals({ ...newArrivals, count: Number(e.target.value) })}>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
            </select>
          </Field>
        </div>

        <div>
          <h4 className="text-sm font-extrabold tracking-tight text-neutral-900 mb-1">Select Products</h4>
          <p className="text-xs text-neutral-500 mb-4">Click to select up to {newArrivals.count} products for the New Arrivals section. {newArrivals.selectedProductIds.length > 0 ? `${newArrivals.selectedProductIds.length} selected.` : 'If none selected, products marked as "New" will be shown.'}</p>
          {products.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4 text-center">No products in inventory yet. Add products in the Inventory section first.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {products.map((p: any) => {
                const selected = newArrivals.selectedProductIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className={`relative rounded-xl border-2 p-2 text-left transition-all ${selected ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900' : 'border-black/[0.06] hover:border-neutral-300'}`}
                  >
                    {selected && (
                      <span className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-neutral-900 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <div className="aspect-square w-full rounded-lg bg-neutral-100 overflow-hidden mb-2">
                      <img src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=200'} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                    <p className="text-xs font-bold text-neutral-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-neutral-500">{'₹'}{p.price?.toLocaleString()}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Shop by Category Editor */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Shop by Category</h3>
            <p className="text-xs text-neutral-500">Manage category cards on the homepage</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addCategory}
              className="flex items-center gap-2 rounded-xl border border-black/10 px-3.5 py-2.5 text-sm font-bold text-neutral-700 hover:bg-black/[0.03]"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
            <button
              onClick={saveCategories}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
            >
              <Save className="h-4 w-4" /> {catSaved ? 'Saved!' : 'Save Categories'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {categories.map((cat, idx) => (
            <div key={idx} className="rounded-2xl border border-black/[0.06] bg-neutral-50 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-neutral-300" />
                  <span className="text-sm font-bold text-neutral-900">Category {idx + 1}</span>
                </div>
                <button
                  onClick={() => removeCategory(idx)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Title">
                  <input className={inputCls} value={cat.title} onChange={(e) => updateCategory(idx, 'title', e.target.value)} placeholder="e.g. Boys Sets" />
                </Field>
                <Field label="Description">
                  <input className={inputCls} value={cat.desc} onChange={(e) => updateCategory(idx, 'desc', e.target.value)} placeholder="Short tagline" />
                </Field>
                <Field label="Card Color">
                  <select className={inputCls} value={cat.bgColor} onChange={(e) => updateCategory(idx, 'bgColor', e.target.value)}>
                    {COLOR_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Image URL">
                  <input className={inputCls} value={cat.image} onChange={(e) => updateCategory(idx, 'image', e.target.value)} placeholder="https://..." />
                </Field>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="py-8 border-2 border-dashed border-black/[0.08] rounded-2xl flex flex-col items-center justify-center bg-white/50">
              <span className="text-xs font-bold text-neutral-700">No categories added</span>
              <span className="text-[10px] font-medium text-neutral-500 mt-1">Add categories to show on the homepage.</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
