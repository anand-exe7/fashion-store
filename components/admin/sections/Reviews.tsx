'use client';
import { useEffect, useMemo, useState } from 'react';
import { Star, Check, EyeOff, Trash2, ImagePlus, X, Search } from 'lucide-react';
import { useAdminData } from '@/lib/store';
import { fetchAllReviews, updateReview, deleteReview, type Review } from '@/lib/db';
import { Card, EmptyState, Modal, ModalHeader, Toast } from '../ui';

// A flat, de-duplicated list of every product image, for the "attach image" picker.
function useProductImages() {
  const { products } = useAdminData();
  return useMemo(() => {
    const seen = new Set<string>();
    const out: { url: string; product: string }[] = [];
    for (const p of products) {
      const urls = [...(p.images || []), p.image].filter(Boolean) as string[];
      for (const url of urls) {
        if (seen.has(url)) continue;
        seen.add(url);
        out.push({ url, product: p.name });
      }
    }
    return out;
  }, [products]);
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState<Review | null>(null);
  const [editText, setEditText] = useState('');
  const [imagePickerFor, setImagePickerFor] = useState<Review | null>(null);
  const productImages = useProductImages();

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = async () => {
    try {
      setReviews(await fetchAllReviews());
    } catch (err) {
      console.error(err);
      flash('Could not load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const patch = async (id: string, p: Parameters<typeof updateReview>[1], msg: string) => {
    // Optimistic local update.
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...normalize(p) } : r)));
    try {
      await updateReview(id, p);
      flash(msg);
    } catch (err) {
      console.error(err);
      flash('Update failed.');
      load();
    }
  };

  const remove = async (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteReview(id);
      flash('Review deleted.');
    } catch {
      flash('Delete failed.');
      load();
    }
  };

  const list = reviews.filter((r) =>
    filter === 'all' ? true : filter === 'pending' ? !r.isApproved : r.isApproved,
  );
  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Customer Reviews</h2>
          <p className="text-xs text-neutral-500 sm:text-sm">
            Approve, hide, edit, or attach a product photo before a review appears on the storefront.
          </p>
        </div>
        <div className="flex items-center gap-1 self-start rounded-xl border border-black/[0.08] bg-black/[0.03] p-1">
          {(['pending', 'approved', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                filter === f ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {f}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-950">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card><EmptyState message="Loading reviews…" /></Card>
      ) : list.length === 0 ? (
        <Card><EmptyState message={filter === 'pending' ? 'No reviews waiting for approval.' : 'No reviews here yet.'} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => (
            <Card key={r.id} className="flex flex-col overflow-hidden">
              <div className="flex gap-3 p-4">
                {r.imageUrl ? (
                  <img src={r.imageUrl} alt="" className="h-20 w-16 shrink-0 rounded-lg object-cover ring-1 ring-black/10" />
                ) : (
                  <div className="grid h-20 w-16 shrink-0 place-items-center rounded-lg bg-neutral-100 text-neutral-300 ring-1 ring-black/10">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-neutral-900">{r.name}</p>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        r.isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {r.isApproved ? 'Live' : 'Pending'}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {r.product && <p className="mt-0.5 truncate text-[11px] text-neutral-400">{r.product}</p>}
                </div>
              </div>
              <p className="px-4 pb-3 text-sm italic leading-snug text-neutral-700 line-clamp-4">“{r.note}”</p>

              <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-black/[0.06] p-3">
                {r.isApproved ? (
                  <button
                    onClick={() => patch(r.id, { isApproved: false }, 'Review hidden.')}
                    className="flex items-center gap-1.5 rounded-lg border border-black/[0.1] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/[0.03]"
                  >
                    <EyeOff className="h-3.5 w-3.5" /> Hide
                  </button>
                ) : (
                  <button
                    onClick={() => patch(r.id, { isApproved: true }, 'Review published.')}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" /> Show
                  </button>
                )}
                <button
                  onClick={() => setImagePickerFor(r)}
                  className="flex items-center gap-1.5 rounded-lg border border-black/[0.1] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/[0.03]"
                >
                  <ImagePlus className="h-3.5 w-3.5" /> {r.imageUrl ? 'Change' : 'Image'}
                </button>
                {r.imageUrl && (
                  <button
                    onClick={() => patch(r.id, { imageUrl: null }, 'Image removed.')}
                    className="rounded-lg border border-black/[0.1] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/[0.03]"
                  >
                    No image
                  </button>
                )}
                <button
                  onClick={() => { setEditing(r); setEditText(r.note); }}
                  className="rounded-lg border border-black/[0.1] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/[0.03]"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                  aria-label="Delete review"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit text modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} size="md">
        {editing && (
          <>
            <ModalHeader title={`Edit — ${editing.name}`} onClose={() => setEditing(null)} />
            <div className="space-y-4 p-5 sm:p-6">
              <textarea
                rows={5}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full rounded-xl border border-black/[0.1] px-4 py-3 text-sm outline-none focus:border-neutral-400"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="rounded-xl border border-black/[0.1] px-4 py-2 text-sm font-bold text-neutral-600 hover:bg-black/[0.03]">
                  Cancel
                </button>
                <button
                  onClick={() => { patch(editing.id, { note: editText.trim() }, 'Review updated.'); setEditing(null); }}
                  className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-bold text-white hover:bg-black"
                >
                  Save
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Product-image picker */}
      <Modal open={!!imagePickerFor} onClose={() => setImagePickerFor(null)} size="lg">
        {imagePickerFor && (
          <>
            <ModalHeader title="Attach a product photo" onClose={() => setImagePickerFor(null)} />
            <div className="p-5 sm:p-6">
              {productImages.length === 0 ? (
                <EmptyState message="No product images available yet." />
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {productImages.map((img) => (
                    <button
                      key={img.url}
                      onClick={() => {
                        patch(imagePickerFor.id, { imageUrl: img.url }, 'Image attached.');
                        setImagePickerFor(null);
                      }}
                      className="group relative aspect-[4/5] overflow-hidden rounded-lg ring-1 ring-black/10 hover:ring-2 hover:ring-neutral-900"
                      title={img.product}
                    >
                      <img src={img.url} alt={img.product} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Modal>

      <Toast show={!!toast} message={toast} />
    </div>
  );
}

// Maps the DB-style patch onto the local Review shape for optimistic updates.
function normalize(p: { note?: string; isApproved?: boolean; imageUrl?: string | null }): Partial<Review> {
  const out: Partial<Review> = {};
  if (p.note !== undefined) out.note = p.note;
  if (p.isApproved !== undefined) out.isApproved = p.isApproved;
  if (p.imageUrl !== undefined) out.imageUrl = p.imageUrl;
  return out;
}
