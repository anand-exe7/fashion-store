import { adminSupabase } from '@/lib/supabase/admin';
import { isCategorySlotKey, type CategoryImageMap } from '@/lib/categoryImages';

// Category card photos live in the existing public 'images' bucket:
//   category-images/<slot>_<timestamp>.<ext>   — the photos (one live file per slot)
//   settings/category_images.json              — { slot: publicUrl } mapping
// No table/migration needed (same approach as the delivery settings).
export const BUCKET = 'images';
export const IMAGE_DIR = 'category-images';
const MAP_PATH = 'settings/category_images.json';

export async function readCategoryImages(): Promise<CategoryImageMap> {
  const { data, error } = await adminSupabase.storage.from(BUCKET).download(MAP_PATH);
  if (error || !data) return {};
  try {
    const raw = JSON.parse(await data.text());
    const out: CategoryImageMap = {};
    for (const [k, v] of Object.entries(raw ?? {})) {
      if (isCategorySlotKey(k) && typeof v === 'string' && v) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export async function writeCategoryImages(map: CategoryImageMap) {
  const { error } = await adminSupabase.storage
    .from(BUCKET)
    .upload(MAP_PATH, JSON.stringify(map), { contentType: 'application/json', upsert: true });
  if (error) throw new Error(error.message);
}

// Removes a previously uploaded photo from the bucket. Only ever touches files
// under category-images/, so a bad/foreign URL in the mapping can't delete anything else.
export async function deleteCategoryImageFile(url: string | undefined) {
  if (!url) return;
  const marker = `/${BUCKET}/${IMAGE_DIR}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const name = decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
  if (!name || name.includes('/') || name.includes('..')) return;
  const { error } = await adminSupabase.storage.from(BUCKET).remove([`${IMAGE_DIR}/${name}`]);
  if (error) console.warn('Could not remove old category image:', error.message);
}
