import type { Metadata } from 'next';

// Client page → metadata lives in this Server Component layout.
export const metadata: Metadata = {
  title: 'New Arrivals',
  description:
    'The latest Shalistone drops — new kids and mens fashion added regularly. Discover fresh sets, shirts and styles for ages 0–16.',
  alternates: { canonical: '/new-arrivals' },
  openGraph: {
    title: 'New Arrivals · Shalistone',
    description: 'The latest Shalistone drops — fresh kids and mens fashion.',
    url: '/new-arrivals',
  },
};

export default function NewArrivalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
