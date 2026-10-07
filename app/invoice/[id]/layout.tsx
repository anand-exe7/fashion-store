import type { Metadata } from 'next';

// Customer invoices are private documents — never indexed (also disallowed in
// robots.ts). noindex applies to every /invoice/[id].
export const metadata: Metadata = {
  title: 'Invoice',
  robots: { index: false, follow: false },
};

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
