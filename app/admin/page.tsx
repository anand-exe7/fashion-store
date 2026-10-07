import type { Metadata } from 'next';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Shalistone · Admin',
  description: 'Shalistone store admin — WhatsApp Center, orders and operations.',
  // Operational dashboard — must never be indexed (also disallowed in robots.ts).
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
