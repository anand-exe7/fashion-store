import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product/review photos live in Supabase storage; allow them through the
    // image optimizer so catalogue pages load resized WebP instead of 2 MB PNGs.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      // Stock photos used by next/image on the landing page.
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    qualities: [75],
    formats: ['image/webp'],
    // Optimized images are keyed by URL and uploads get unique filenames, so a
    // long TTL is safe.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
