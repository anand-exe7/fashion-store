import { unstable_cache, revalidateTag } from 'next/cache';
import { adminSupabase } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Admin-editable delivery copy (landing page + every product page).
// Stored as a small JSON file in the existing public 'images' storage bucket,
// so no extra database table/migration is needed. Reads are public; writes are
// restricted to signed-in admin/staff and use the service-role key.
const BUCKET = 'images';
const PATH = 'settings/delivery_info.json';

// One storage download per window for all visitors, instead of one per page view.
// The admin's save (POST) clears it immediately.
const readSaved = unstable_cache(
  async () => {
    const { data, error } = await adminSupabase.storage.from(BUCKET).download(PATH);
    if (error) {
      // No file yet is a normal "nothing saved". Anything else is transient: throw so
      // the cache doesn't keep a bogus "nothing saved" for 5 minutes.
      const e = error as { status?: number | string; statusCode?: number | string; message?: string };
      const code = Number(e.status ?? e.statusCode ?? 0);
      if (code === 400 || code === 404 || /not.?found|does not exist/i.test(e.message ?? '')) return null;
      throw error;
    }
    if (!data) return null;
    try {
      return JSON.parse(await data.text());
    } catch {
      return null;
    }
  },
  ['delivery-settings'],
  { revalidate: 300, tags: ['delivery-settings'] },
);

export async function GET(req: Request) {
  // The admin editor asks for ?fresh=1 so it never edits from a cached copy.
  const fresh = new URL(req.url).searchParams.has('fresh');
  try {
    return Response.json(await readSaved(), {
      headers: { 'Cache-Control': fresh ? 'no-store' : 'public, max-age=30, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('settings read failed:', err);
    return Response.json(null, { headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return Response.json({ error: 'Not allowed' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const landingText = typeof body?.landingText === 'string' ? body.landingText.trim().slice(0, 500) : '';
  const productLines = Array.isArray(body?.productLines)
    ? body.productLines.filter((l: unknown): l is string => typeof l === 'string' && !!l.trim()).map((l: string) => l.trim().slice(0, 300)).slice(0, 20)
    : [];

  const { error } = await adminSupabase.storage
    .from(BUCKET)
    .upload(PATH, JSON.stringify({ landingText, productLines }), { contentType: 'application/json', upsert: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  revalidateTag('delivery-settings', { expire: 0 });
  return Response.json({ ok: true });
}
