import { adminSupabase } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Admin-editable GST settings (whether the business GSTIN prints on retail and
// wholesale invoices, and the number itself). Stored as a small JSON file in
// the existing public 'images' storage bucket, so no extra table/migration is
// needed. Reads are public (the invoice page needs them); writes are
// restricted to signed-in admin/staff and use the service-role key.
const BUCKET = 'images';
const PATH = 'settings/gst_info.json';

export async function GET() {
  const { data, error } = await adminSupabase.storage.from(BUCKET).download(PATH);
  if (error || !data) {
    // Nothing saved yet — the client falls back to its defaults (GST off).
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

  return Response.json({ ok: true });
}
