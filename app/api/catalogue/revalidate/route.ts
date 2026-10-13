import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// Called by the admin panel after a product/stock change so the storefront's
// shared catalogue cache refreshes immediately instead of at the next expiry.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return Response.json({ error: 'Not allowed' }, { status: 403 });
  }

  revalidateTag('catalogue', { expire: 0 });
  return Response.json({ ok: true });
}
