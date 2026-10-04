import { adminSupabase } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_IMAGE_SPEC, isCategorySlotKey } from '@/lib/categoryImages';
import {
  BUCKET,
  IMAGE_DIR,
  deleteSlotFiles,
  readCategoryImages,
} from '@/lib/server/categoryImages';

// Admin-managed photos for the four landing-page category cards.
// GET is public; POST (replace a photo) and DELETE (reset to default) are
// restricted to the signed-in admin and use the service-role key.

const NO_STORE = { 'Cache-Control': 'no-store' };
const EXT_BY_TYPE: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

async function requireAdmin(): Promise<Response | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return Response.json({ error: 'Not allowed' }, { status: 403 });
  }
  return null;
}

export async function GET() {
  return Response.json(await readCategoryImages(), { headers: NO_STORE });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const form = await req.formData().catch(() => null);
  const slot = form?.get('slot');
  const file = form?.get('file');
  if (!isCategorySlotKey(slot)) return Response.json({ error: 'Unknown category' }, { status: 400 });
  if (!(file instanceof File)) return Response.json({ error: 'No image provided' }, { status: 400 });

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return Response.json({ error: 'Use a JPG, PNG or WebP image' }, { status: 400 });
  if (file.size > CATEGORY_IMAGE_SPEC.maxUploadBytes) {
    return Response.json({ error: `Image is too large (max ${CATEGORY_IMAGE_SPEC.maxUploadBytes / 1024 / 1024} MB)` }, { status: 413 });
  }

  try {
    // 1. Upload the new photo under a unique name (so CDN / optimizer caches never serve a stale one).
    //    The newest file for a slot is the live one, so it takes over as soon as it lands.
    const name = `${slot}_${Date.now()}.${ext}`;
    const { error: upErr } = await adminSupabase.storage
      .from(BUCKET)
      .upload(`${IMAGE_DIR}/${name}`, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = adminSupabase.storage.from(BUCKET).getPublicUrl(`${IMAGE_DIR}/${name}`);

    // 2. Only now delete the old photo(s) for this slot from the bucket.
    await deleteSlotFiles(slot, name);

    return Response.json({ ok: true, slot, url: pub.publicUrl });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const slot = new URL(req.url).searchParams.get('slot');
  if (!isCategorySlotKey(slot)) return Response.json({ error: 'Unknown category' }, { status: 400 });

  try {
    await deleteSlotFiles(slot);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Reset failed' }, { status: 500 });
  }
}
