'use client';
import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, ExternalLink, Eye, EyeOff, RefreshCw, Film } from 'lucide-react';
import { fetchAllReels, addReel, deleteReel, MAX_REEL_BYTES, type Reel } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';
import { Card, Field, inputCls, Toast } from '../ui';

const MB = 1024 * 1024;
// The home page shows exactly three reels, so the admin manages three slots.
const SLOTS = 3;

// A slot is either a stored reel or an empty upload target at that position.
type Slot = { reel: Reel | null; index: number };

export default function Reels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  // Optional Instagram links typed into empty slots before uploading, keyed by
  // slot position.
  const [linkDrafts, setLinkDrafts] = useState<Record<number, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  // The reel being replaced (delete-then-upload), or null for a fresh upload.
  const replaceRef = useRef<Reel | null>(null);
  const positionRef = useRef<number>(0);
  const supabase = createClient();

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 3200);
  };

  const load = async () => {
    try {
      setReels(await fetchAllReels());
    } catch (err) {
      console.error(err);
      flash('Could not load reels.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // Build exactly three slots (more only if extra reels already exist in the DB).
  const slots: Slot[] = [];
  const count = Math.max(SLOTS, reels.length);
  for (let i = 0; i < count; i++) slots.push({ reel: reels[i] ?? null, index: i });

  // Kick off the OS file picker for a given slot. `replace` carries the existing
  // reel so its bucket file + row are removed before the new one is stored.
  const pickFile = (position: number, replace: Reel | null) => {
    replaceRef.current = replace;
    positionRef.current = position;
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const position = positionRef.current;
    const replacing = replaceRef.current;
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      flash('Please choose a video file.');
      return;
    }
    if (file.size > MAX_REEL_BYTES) {
      flash(`That video is ${(file.size / MB).toFixed(1)} MB — the limit is 20 MB.`);
      return;
    }

    setBusySlot(position);
    try {
      // Replacing: delete the old reel (bucket file + row) before uploading the
      // new one, so the storage bucket never keeps the stale video around.
      if (replacing) {
        await deleteReel(replacing);
      }
      const href = replacing ? replacing.href || undefined : linkDrafts[position]?.trim() || undefined;
      // Keep a replacement in the same slot position; new uploads append.
      await addReel(file, href, replacing ? replacing.sortOrder : undefined);
      if (!replacing) setLinkDrafts((d) => ({ ...d, [position]: '' }));
      flash(replacing ? 'Reel replaced — old video removed from storage.' : 'Reel uploaded.');
      await load();
    } catch (err: any) {
      console.error(err);
      flash(err?.message || 'Upload failed.');
      await load();
    } finally {
      setBusySlot(null);
      replaceRef.current = null;
    }
  };

  const remove = async (reel: Reel) => {
    if (!window.confirm('Remove this reel? Its video is also deleted from storage.')) return;
    setReels((prev) => prev.filter((r) => r.id !== reel.id));
    try {
      await deleteReel(reel);
      flash('Reel removed.');
    } catch {
      flash('Delete failed.');
      load();
    }
  };

  const toggleActive = async (reel: Reel) => {
    const next = !reel.isActive;
    setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, isActive: next } : r)));
    const { error } = await supabase.from('instagram_reels').update({ is_active: next }).eq('id', reel.id);
    if (error) { flash('Update failed.'); load(); }
    else flash(next ? 'Reel shown on home page.' : 'Reel hidden.');
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Instagram Reels</h2>
        <p className="text-xs text-neutral-500 sm:text-sm">
          Three slots feed the reels on the home page. Replacing a reel deletes the old video from storage. Max 20 MB each.
        </p>
      </div>

      {/* One shared hidden picker, targeted per slot. */}
      <input ref={fileRef} type="file" accept="video/*" onChange={onFile} className="hidden" />

      {loading ? (
        <Card><p className="px-4 py-12 text-center text-sm text-neutral-400">Loading reels…</p></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map(({ reel, index }) => {
            const busy = busySlot === index;
            return (
              <Card key={reel?.id ?? `empty-${index}`} className="overflow-hidden">
                {/* Slot header */}
                <div className="flex items-center justify-between border-b border-black/[0.06] px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Slot {index + 1}</span>
                  {reel && (
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${reel.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>
                      {reel.isActive ? 'Live' : 'Hidden'}
                    </span>
                  )}
                </div>

                {reel ? (
                  <>
                    <div className="relative aspect-[9/16] bg-neutral-900">
                      <video src={reel.videoUrl} muted loop playsInline className="h-full w-full object-cover" />
                      {!reel.isActive && (
                        <div className="absolute inset-0 grid place-items-center bg-black/60">
                          <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-800">Hidden</span>
                        </div>
                      )}
                      {busy && (
                        <div className="absolute inset-0 grid place-items-center bg-black/60">
                          <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-800">
                            <RefreshCw className="h-3 w-3 animate-spin" /> Replacing…
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 p-2">
                      {reel.href ? (
                        <a href={reel.href} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 hover:bg-black/[0.04] hover:text-neutral-900" title="Open link">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : <span className="w-8" />}
                      <div className="flex items-center gap-1">
                        <button onClick={() => pickFile(index, reel)} disabled={busy} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-neutral-600 hover:bg-black/[0.04] hover:text-neutral-900 disabled:opacity-50" title="Replace">
                          <RefreshCw className="h-3.5 w-3.5" /> Replace
                        </button>
                        <button onClick={() => toggleActive(reel)} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 hover:bg-black/[0.04] hover:text-neutral-900 disabled:opacity-50" title={reel.isActive ? 'Hide' : 'Show'}>
                          {reel.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button onClick={() => remove(reel)} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50" title="Remove">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 p-4">
                    <button
                      onClick={() => pickFile(index, null)}
                      disabled={busy}
                      className="grid aspect-[9/16] w-full place-items-center rounded-xl border-2 border-dashed border-black/10 bg-black/[0.015] text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600 disabled:opacity-60"
                    >
                      <span className="flex flex-col items-center gap-2">
                        {busy ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Film className="h-7 w-7" />}
                        <span className="text-xs font-bold uppercase tracking-wide">{busy ? 'Uploading…' : 'Upload reel'}</span>
                      </span>
                    </button>
                    <Field label="Instagram link (optional)">
                      <input
                        className={inputCls}
                        value={linkDrafts[index] || ''}
                        onChange={(e) => setLinkDrafts((d) => ({ ...d, [index]: e.target.value }))}
                        placeholder="https://www.instagram.com/reel/…"
                      />
                    </Field>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-2 text-[11px] text-neutral-400">
        <Upload className="h-3.5 w-3.5" /> Only uploaded reels appear on the home page. The built-in sample reels are used only until you add your own.
      </p>

      <Toast show={!!toast} message={toast} />
    </div>
  );
}
