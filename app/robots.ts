import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Crawl rules. Public catalogue is open; anything operational, personal or
// transactional is kept out of the index. Mirrors the per-page noindex on
// those same routes.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/',
        '/auth/',
        '/cart',
        '/profile',
        '/login',
        '/invoice/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
