import type { Metadata } from 'next';

// Transactional page — keep it out of the index (also disallowed in robots.ts).
export const metadata: Metadata = {
  title: 'Your Cart',
  robots: { index: false, follow: true },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
