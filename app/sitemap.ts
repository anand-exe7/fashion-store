import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { fetchProducts } from '@/lib/db';

// Dynamic sitemap: static marketing/catalogue pages plus one entry per live
// product. Product data is fetched at request/build time (same Supabase helper
// the storefront uses) so new products appear without a code change.
//
// Well under Google's 50,000-URL single-file limit for this catalogue; if the
// product count ever approaches that, split with generateSitemaps.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/new-arrivals`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await fetchProducts();
    productRoutes = products
      // Don't advertise products that are hidden/unavailable in the store.
      .filter((p) => p.isAvailable !== false)
      .map((p) => ({
        url: `${SITE_URL}/product/${p.id}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
  } catch (err) {
    // A data hiccup must not fail the whole sitemap — ship the static routes.
    console.error('sitemap: failed to load products', err);
  }

  return [...staticRoutes, ...productRoutes];
}
