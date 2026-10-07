import type { Metadata } from 'next';

// Auth page — never indexed (also disallowed in robots.ts).
export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
