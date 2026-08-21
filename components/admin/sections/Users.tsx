'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, EmptyState } from '../ui';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/lib/store';

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

const ROLE_STYLES = {
  admin: 'bg-neutral-900 text-white',
  user: 'bg-neutral-100 text-neutral-600',
} as Record<string, string>;

export default function Users() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setUsers(data);
      }
    }
    fetchUsers();
  }, []);

  const toggleRole = async (user: Profile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const confirmed = window.confirm(`Are you sure you want to change ${user.name || user.email}'s role to ${newRole.toUpperCase()}?`);
    
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
      if (error) throw error;
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      showToast(`${user.name || user.email} is now an ${newRole.toUpperCase()}`);
    } catch (e: any) {
      alert("Failed to update role. Ensure you have admin privileges.");
    }
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => !q || (u.name || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }, [query, users]);

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
              {list.map((u) => (
                <tr key={u.id} className="border-t border-black/[0.05]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-900 text-sm font-bold text-white">{(u.name || u.email)[0].toUpperCase()}</span>
                      <span className="text-sm font-bold text-neutral-900">{u.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-neutral-600">{u.email}</td>
                  <td className="px-3 py-4">
                    <button 
                      onClick={() => toggleRole(u)}
                      className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase transition-colors cursor-pointer hover:opacity-80 ${ROLE_STYLES[u.role] || ROLE_STYLES.user}`}
                    >
                      {u.role}
                    </button>
                  </td>
                  <td className="px-3 py-4">
                    <span className="rounded-md px-2 py-1 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <EmptyState message="No users found." />}
      </Card>
    </div>
  );
}
