import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS. Only use in Route Handlers / server code.
// NEVER expose this key client-side.
export const adminSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
