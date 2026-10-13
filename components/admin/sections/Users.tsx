'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Card, EmptyState } from '../ui';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/lib/store';

const USERS_PAGE = 25;

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

const ROLE_STYLES = {
  admin: 'border-neutral-900 bg-neutral-900 text-white',
  staff: 'border-sky-200 bg-sky-50 text-sky-700',
  user: 'border-black/10 bg-neutral-100 text-neutral-600',
} as Record<string, string>;

// Roles an admin can assign from the dropdown.
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
];

export default function Users() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // Server-side paging + search: only one page of profiles leaves the database
  // at a time, instead of every account on every visit.
  // Only the latest request may write results; older ones are dropped.
  const reqId = useRef(0);
  // The search term the visible list was loaded with ("Load more" must reuse it,
  // not the live input, which may be ahead of the debounce).
  const loadedTerm = useRef('');
  const loadPage = async (offset: number, term: string) => {
    const id = ++reqId.current;
    setLoading(true);
    let q = supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + USERS_PAGE - 1);
    // Strip characters that would break PostgREST's or() filter syntax.
    const safe = term.replace(/[,()%*\\]/g, ' ').trim();
    if (safe) q = q.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,role.ilike.%${safe}%`);
    const { data, error } = await q;
    if (id !== reqId.current) return;
    setLoading(false);
    if (error || !data) {
      console.error('Failed to load users:', error);
      showToast("Couldn't load users.");
      if (offset === 0) { setUsers([]); setHasMore(false); }
      return;
    }
    loadedTerm.current = term;
    // De-dupe by id: with offset paging, rows inserted meanwhile shift the window.
    setUsers((prev) => {
      if (offset === 0) return data;
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...data.filter((d) => !seen.has(d.id))];
    });
    setHasMore(data.length === USERS_PAGE);
  };

  // Debounced so typing a name doesn't fire a query per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { loadPage(0, query); }, query ? 300 : 0);
    return () => { clearTimeout(t); reqId.current++; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Pick a role straight from the dropdown — no multi-click cycling or confirm.
  const setRole = async (user: Profile, newRole: string) => {
    if (newRole === user.role) return;
    const prev = user.role;
    // Optimistic update so the select reflects the choice immediately.
    setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
      if (error) throw error;
      showToast(`${user.name || user.email} is now ${newRole.toUpperCase()}`);
    } catch {
      // Roll back if the write was rejected (e.g. not an admin).
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, role: prev } : u)));
      showToast('Could not update role — admin access required.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Users &amp; Roles</h2>
          <p className="text-xs text-neutral-500 sm:text-sm">Staff with access to this admin</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users…" className="w-full rounded-xl border border-black/[0.09] bg-white py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <th className="px-5 py-3">Name</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-black/[0.05]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-900 text-sm font-bold text-white">{(u.name || u.email)[0].toUpperCase()}</span>
                      <span className="text-sm font-bold text-neutral-900">{u.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-neutral-600">{u.email}</td>
                  <td className="px-3 py-4">
                    <div className="relative inline-block">
                      <select
                        value={ROLE_OPTIONS.some((o) => o.value === u.role) ? u.role : 'user'}
                        onChange={(e) => setRole(u, e.target.value)}
                        className={`cursor-pointer appearance-none rounded-md border py-1 pl-2.5 pr-7 text-[10px] font-bold uppercase tracking-wide outline-none transition-colors ${ROLE_STYLES[u.role] || ROLE_STYLES.user}`}
                        aria-label={`Role for ${u.name || u.email}`}
                      >
                        {ROLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value} className="bg-white text-neutral-800">
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className={`pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 ${u.role === 'admin' ? 'text-white/70' : 'text-neutral-400'}`} />
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className="rounded-md px-2 py-1 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && !loading && <EmptyState message="No users found." />}
        {hasMore && (
          <div className="border-t border-black/[0.05] p-3">
            <button
              onClick={() => loadPage(users.length, loadedTerm.current)}
              disabled={loading}
              className="w-full rounded-xl border border-black/[0.09] bg-white py-2.5 text-sm font-bold text-neutral-700 hover:bg-black/[0.03] disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
