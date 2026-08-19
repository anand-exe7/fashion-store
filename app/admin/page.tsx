import type { Metadata } from 'next';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Shalistone · Admin',
  description: 'Shalistone store admin — WhatsApp Center, orders and operations.',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
