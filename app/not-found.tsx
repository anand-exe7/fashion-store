import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true },
};

// Custom 404 — returns the correct status and keeps visitors (and crawlers) on
// a path back into the catalogue instead of a dead end.
export default function NotFound() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: '#F5F2EB' }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-neutral-400">
        404
      </p>
      <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-neutral-900 sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm text-neutral-500">
        The page you’re looking for doesn’t exist or has moved. Let’s get you back
        to the good stuff.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-neutral-900 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black"
        >
          Back to Home
        </Link>
        <Link
          href="/products"
          className="rounded-full border border-black/10 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-700 transition-colors hover:bg-black/[0.03]"
        >
          Shop All Products
        </Link>
      </div>
    </main>
  );
}
