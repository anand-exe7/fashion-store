import type { Metadata } from 'next';

// The products page is a Client Component, so its SEO metadata lives in this
// Server Component layout (metadata exports aren't allowed in Client pages).
export const metadata: Metadata = {
  title: 'Shop All Products',
  description:
    'Browse the full Shalistone collection — kids and mens fashion for every age, from playful sets and shirts to ethnic wear. Shop online across India.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'Shop All Products · Shalistone',
    description:
      'Browse the full Shalistone collection — kids and mens fashion for every age.',
    url: '/products',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
