import { adminSupabase } from '@/lib/supabase/admin';
import { CATEGORY_SLOTS, type CategoryImageMap, type CategorySlotKey } from '@/lib/categoryImages';

// Category card photos live in the existing public 'images' bucket as
//   category-images/<slot>_<timestamp>.<ext>
// The live photo for a slot is simply its newest file. There is no separate
// mapping file: a mapping read back through the storage CDN can be stale, which
// made old photos get missed on replace. Listing the folder is always current.
export const BUCKET = 'images';
export const IMAGE_DIR = 'category-images';

const FILE_RE = /^(infants|toddlers|kids|teens)_(\d+)\.[a-z0-9]+$/i;

type Entry = { slot: CategorySlotKey; ts: number; name: string };

async function listEntries(): Promise<Entry[]> {
  const { data, error } = await adminSupabase.storage.from(BUCKET).list(IMAGE_DIR, { limit: 1000 });
  if (error) throw new Error(error.message);
  const out: Entry[] = [];
  for (const f of data ?? []) {
    const m = FILE_RE.exec(f.name);
    if (m) out.push({ slot: m[1].toLowerCase() as CategorySlotKey, ts: Number(m[2]), name: f.name });
  }
  return out;
}

const publicUrl = (name: string) => adminSupabase.storage.from(BUCKET).getPublicUrl(`${IMAGE_DIR}/${name}`).data.publicUrl;

export async function readCategoryImages(): Promise<CategoryImageMap> {
  try {
    const newest: Partial<Record<CategorySlotKey, Entry>> = {};
    for (const e of await listEntries()) {
      if (!newest[e.slot] || e.ts > newest[e.slot]!.ts) newest[e.slot] = e;
    }
    const out: CategoryImageMap = {};
    for (const s of CATEGORY_SLOTS) {
      const e = newest[s.key];
      if (e) out[s.key] = publicUrl(e.name);
    }
    return out;
  } catch (e) {
    console.warn('Could not read category images:', e);
    return {}; // storefront falls back to the default photos
  }
}

// Deletes every stored photo for a slot except `keepName` (or all of them when omitted).
// This also sweeps up any orphans left by an earlier interrupted upload.
export async function deleteSlotFiles(slot: CategorySlotKey, keepName?: string) {
  const stale = (await listEntries()).filter((e) => e.slot === slot && e.name !== keepName).map((e) => `${IMAGE_DIR}/${e.name}`);
  if (!stale.length) return;
  const { error } = await adminSupabase.storage.from(BUCKET).remove(stale);
  if (error) throw new Error(error.message);
}
