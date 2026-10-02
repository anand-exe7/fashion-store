import { adminSupabase } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Admin-editable delivery copy (landing page + every product page).
// Stored as a small JSON file in the existing public 'images' storage bucket,
// so no extra database table/migration is needed. Reads are public; writes are
// restricted to signed-in admin/staff and use the service-role key.
const BUCKET = 'images';
const PATH = 'settings/delivery_info.json';

export async function GET() {
  const { data, error } = await adminSupabase.storage.from(BUCKET).download(PATH);
  if (error || !data) {
    // Nothing saved yet — the client falls back to its defaults.
    return Response.json(null, { headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    return Response.json(JSON.parse(await data.text()), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
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

  return Response.json({ ok: true });
}
