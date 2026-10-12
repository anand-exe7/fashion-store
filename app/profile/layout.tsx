import type { Metadata } from 'next';

// Personal account area — never indexed (also disallowed in robots.ts).
export const metadata: Metadata = {
  title: 'My Profile',
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
