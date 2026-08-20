'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, EmptyState } from '../ui';

const USERS = [
  { name: 'Admin', email: 'admin@shalistone.com', role: 'Owner', status: 'Active' },
  { name: 'Priya Nair', email: 'priya@shalistone.com', role: 'Manager', status: 'Active' },
  { name: 'Rahul Verma', email: 'rahul@shalistone.com', role: 'Cashier', status: 'Active' },
  { name: 'Sana Iqbal', email: 'sana@shalistone.com', role: 'Cashier', status: 'Invited' },
];

const ROLE = {
  Owner: 'bg-neutral-900 text-white',
  Manager: 'bg-blue-50 text-blue-700',
  Cashier: 'bg-amber-50 text-amber-700',
} as Record<string, string>;

export default function Users() {
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return USERS.filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }, [query]);

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
                <tr key={u.email} className="border-t border-black/[0.05]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-900 text-sm font-bold text-white">{u.name[0]}</span>
                      <span className="text-sm font-bold text-neutral-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-neutral-600">{u.email}</td>
                  <td className="px-3 py-4"><span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${ROLE[u.role]}`}>{u.role}</span></td>
                  <td className="px-3 py-4">
                    <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>{u.status}</span>
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
