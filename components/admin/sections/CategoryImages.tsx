'use client';
import { useEffect, useRef, useState } from 'react';
import { ImagePlus, RefreshCw, RotateCcw, Check, X, Info } from 'lucide-react';
import { cropToRatio } from '@/lib/image';
import {
  CATEGORY_IMAGES_ENDPOINT,
  CATEGORY_IMAGE_SPEC as SPEC,
  CATEGORY_SLOTS,
  fetchCategoryImages,
  type CategoryImageMap,
  type CategorySlotKey,
} from '@/lib/categoryImages';
import { Card, Toast } from '../ui';

const MB = 1024 * 1024;
const msg = (e: unknown, fallback: string) => (e instanceof Error && e.message) || fallback;

// A cropped photo waiting for the admin to confirm before it replaces the live one.
type Staged = { file: File; previewUrl: string; width: number; height: number };

export default function CategoryImages() {
  const [images, setImages] = useState<CategoryImageMap>({});
  const [loading, setLoading] = useState(true);
  const [staged, setStaged] = useState<Partial<Record<CategorySlotKey, Staged>>>({});
  const [busy, setBusy] = useState<CategorySlotKey | null>(null);
  const [toast, setToast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<CategorySlotKey>('infants');

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 3500);
  };

  const load = async () => {
    setImages(await fetchCategoryImages());
    setLoading(false);
  };
  useEffect(() => {
    fetchCategoryImages().then((m) => { setImages(m); setLoading(false); });
  }, []);

  const discard = (slot: CategorySlotKey) =>
    setStaged((prev) => {
      if (prev[slot]) URL.revokeObjectURL(prev[slot]!.previewUrl);
      const rest = { ...prev };
      delete rest[slot];
      return rest;
    });

  const pick = (slot: CategorySlotKey) => {
    targetRef.current = slot;
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slot = targetRef.current;
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      flash('Please choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > SPEC.maxInputBytes) {
      flash(`That image is ${(file.size / MB).toFixed(1)} MB — the limit is ${SPEC.maxInputBytes / MB} MB.`);
      return;
    }
    try {
      const out = await cropToRatio(file, SPEC.ratioW, SPEC.ratioH, { maxW: SPEC.recommendedW, minW: SPEC.minW, minH: SPEC.minH });
      discard(slot);
      setStaged((prev) => ({ ...prev, [slot]: { ...out, previewUrl: URL.createObjectURL(out.file) } }));
    } catch (err) {
      flash(msg(err, 'Could not process that image.'));
    }
  };

  const save = async (slot: CategorySlotKey) => {
    const s = staged[slot];
    if (!s) return;
    setBusy(slot);
    try {
      const body = new FormData();
      body.append('slot', slot);
      body.append('file', s.file);
      const res = await fetch(CATEGORY_IMAGES_ENDPOINT, { method: 'POST', body });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `Upload failed (${res.status})`);
      discard(slot);
      await load();
      flash('Photo updated — the old photo was deleted from storage.');
    } catch (err) {
      flash(msg(err, 'Upload failed.'));
    } finally {
      setBusy(null);
    }
  };

  const reset = async (slot: CategorySlotKey) => {
    if (!window.confirm('Go back to the default photo? The uploaded photo is deleted from storage.')) return;
    setBusy(slot);
    try {
      const res = await fetch(`${CATEGORY_IMAGES_ENDPOINT}?slot=${slot}`, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `Reset failed (${res.status})`);
      await load();
      flash('Restored the default photo.');
    } catch (err) {
      flash(msg(err, 'Reset failed.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Category Photos</h2>
        <p className="text-xs text-neutral-500 sm:text-sm">
          The four “Shop By Category” cards on the home page. Replacing a photo deletes the old one from storage.
        </p>
      </div>

      <Card className="flex gap-3 p-4 text-xs text-neutral-600 sm:text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
        <div className="space-y-1">
          <p>
            <b>Proportion: {SPEC.ratioW}:{SPEC.ratioH} portrait</b> (taller than wide). Best size{' '}
            <b>{SPEC.recommendedW} × {SPEC.recommendedH} px</b>; minimum {SPEC.minW} × {SPEC.minH} px. JPG, PNG or WebP up to {SPEC.maxInputBytes / MB} MB.
          </p>
          <p className="text-neutral-500">
            Photos of any other shape are cropped to {SPEC.ratioW}:{SPEC.ratioH} from the top-centre — you’ll see the result before saving.
            The coloured label covers the bottom ~25% of the card, so keep faces and the main outfit in the upper part.
          </p>
        </div>
      </Card>

      {/* One shared hidden picker, targeted per card. */}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORY_SLOTS.map((slot) => {
          const s = staged[slot.key];
          const custom = images[slot.key];
          const working = busy === slot.key;
          const src = s?.previewUrl ?? custom ?? slot.defaultImage;
          const status = s ? 'Preview' : custom ? 'Custom photo' : 'Default photo';

          return (
            <Card key={slot.key} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-black/[0.06] px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{slot.title}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                    s ? 'bg-amber-50 text-amber-700' : custom ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {status}
                </span>
              </div>

              {/* Same shape + label overlay as the storefront card. */}
              <div className="relative flex aspect-[3/4] flex-col justify-end overflow-hidden bg-neutral-100">
                {loading ? (
                  <div className="absolute inset-0 animate-pulse bg-black/[0.04]" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={slot.title} className={`absolute inset-0 h-full w-full object-cover ${s || custom ? 'object-top' : slot.position}`} />
                )}
                <div className="relative z-10 w-full p-3">
                  <div className={`${slot.bgColor} rounded-xl p-3 text-center shadow-md`}>
                    <p className="text-sm font-bold text-neutral-900">{slot.title}</p>
                    <p className="text-[10px] font-medium text-neutral-600">{slot.desc}</p>
                  </div>
                </div>
                {working && (
                  <div className="absolute inset-0 z-20 grid place-items-center bg-black/50">
                    <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-800">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Working…
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2">
                {s ? (
                  <div className="space-y-2">
                    <p className="px-1 text-[10px] text-neutral-400">
                      {s.width}×{s.height}px · {(s.file.size / 1024).toFixed(0)} KB
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => save(slot.key)}
                        disabled={working}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-[11px] font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={() => discard(slot.key)}
                        disabled={working}
                        className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold text-neutral-600 hover:bg-black/[0.04] disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => pick(slot.key)}
                      disabled={working}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-neutral-700 hover:bg-black/[0.04] disabled:opacity-50"
                    >
                      <ImagePlus className="h-3.5 w-3.5" /> {custom ? 'Replace photo' : 'Upload photo'}
                    </button>
                    {custom && (
                      <button
                        onClick={() => reset(slot.key)}
                        disabled={working}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-50 disabled:opacity-50"
                        title="Delete the uploaded photo and go back to the default"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Toast show={!!toast} message={toast} />
    </div>
  );
}
