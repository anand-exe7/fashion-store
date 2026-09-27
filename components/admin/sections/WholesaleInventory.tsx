'use client';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Search, Save } from 'lucide-react';
import {
  fetchWholesaleItems,
  upsertWholesaleItem,
  deleteWholesaleItem,
  type WholesaleItem,
} from '@/lib/db';
import { Card, EmptyState, Toast, inputBase } from '../ui';

// A blank draft row the user fills in and saves as a new item.
const emptyDraft = { code: '', company: '', color: '' };

export default function WholesaleInventory() {
  const [items, setItems] = useState<WholesaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2400); };

  const load = async () => {
    try { setItems(await fetchWholesaleItems()); }
    catch (err) { console.error(err); flash('Could not load items.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const addRow = async () => {
    if (!draft.code.trim() && !draft.company.trim() && !draft.color.trim()) {
      flash('Enter a code, company, or colour first.');
      return;
    }
    setSaving(true);
    try {
      await upsertWholesaleItem(draft);
      setDraft(emptyDraft);
      await load();
      flash('Item added.');
    } catch (err) { console.error(err); flash('Could not add item.'); }
    finally { setSaving(false); }
  };

  // Debounced inline edit: update local state immediately, persist on blur.
  const editField = (id: string, field: keyof WholesaleItem, value: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const persist = async (item: WholesaleItem) => {
    try { await upsertWholesaleItem(item); }
    catch (err) { console.error(err); flash('Could not save change.'); load(); }
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    try { await deleteWholesaleItem(id); flash('Item removed.'); }
    catch { flash('Delete failed.'); load(); }
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      [it.code, it.company, it.color].some((v) => (v || '').toLowerCase().includes(q)),
    );
  }, [items, query]);

  const cell = `${inputBase} w-full !py-1.5`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Wholesale Inventory</h2>
          <p className="text-xs text-neutral-500 sm:text-sm">Simple items — code, company/manufacturer, and colour.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items…" className="w-full rounded-xl border border-black/[0.09] bg-white py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <th className="px-4 py-3">Code</th>
                <th className="px-3 py-3">Company / Name</th>
                <th className="px-3 py-3">Colour</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* New-item draft row */}
              <tr className="border-t border-black/[0.05] bg-black/[0.015]">
                <td className="px-4 py-2.5"><input className={cell} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="e.g. SK-102" /></td>
                <td className="px-3 py-2.5"><input className={cell} value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="e.g. Ravi Textiles" /></td>
                <td className="px-3 py-2.5"><input className={cell} value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} placeholder="e.g. Navy" onKeyDown={(e) => e.key === 'Enter' && addRow()} /></td>
                <td className="px-3 py-2.5 text-right">
                  <button onClick={addRow} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-black disabled:opacity-60">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </td>
              </tr>

              {list.map((it) => (
                <tr key={it.id} className="border-t border-black/[0.05] hover:bg-black/[0.01]">
                  <td className="px-4 py-2"><input className={cell} value={it.code || ''} onChange={(e) => editField(it.id, 'code', e.target.value)} onBlur={() => persist(it)} /></td>
                  <td className="px-3 py-2"><input className={cell} value={it.company || ''} onChange={(e) => editField(it.id, 'company', e.target.value)} onBlur={() => persist(it)} /></td>
                  <td className="px-3 py-2"><input className={cell} value={it.color || ''} onChange={(e) => editField(it.id, 'color', e.target.value)} onBlur={() => persist(it)} /></td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => remove(it.id)} className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50" aria-label="Delete item">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <EmptyState message="Loading…" />}
        {!loading && list.length === 0 && <EmptyState message="No items yet — add one in the top row." />}
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Save className="h-3.5 w-3.5" /> Edits save automatically when you click away from a field.
      </p>

      <Toast show={!!toast} message={toast} />
    </div>
  );
}
