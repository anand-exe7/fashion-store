import { unstable_cache, revalidateTag } from 'next/cache';
import { adminSupabase } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Admin-editable GST settings (whether the business GSTIN prints on retail and
// wholesale invoices, and the number itself). Stored as a small JSON file in
// the existing public 'images' storage bucket, so no extra table/migration is
// needed. Reads are public (the invoice page needs them); writes are
// restricted to signed-in admin/staff and use the service-role key.
const BUCKET = 'images';
const PATH = 'settings/gst_info.json';

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
  ['gst-settings'],
  { revalidate: 300, tags: ['gst-settings'] },
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
  const gstin = typeof body?.gstin === 'string' ? body.gstin.trim().toUpperCase().slice(0, 15) : '';
  const payload = {
    retailEnabled: !!body?.retailEnabled,
    wholesaleEnabled: !!body?.wholesaleEnabled,
    gstin,
  };

  const { error } = await adminSupabase.storage
    .from(BUCKET)
    .upload(PATH, JSON.stringify(payload), { contentType: 'application/json', upsert: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  revalidateTag('gst-settings', { expire: 0 });
  return Response.json({ ok: true });
}
