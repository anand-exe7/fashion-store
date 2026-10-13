import { unstable_cache } from 'next/cache';
import { fetchProducts, fetchProductById } from '@/lib/db';

// One shared copy of the catalogue for every visitor. Without this each page view
// ran three full-table Supabase queries (products, images, variants); now the
// database is read at most once per window no matter how many people browse.
export const CATALOGUE_REVALIDATE = 300; // seconds

export const getCatalogue = unstable_cache(() => fetchProducts(), ['catalogue'], {
  revalidate: CATALOGUE_REVALIDATE,
  tags: ['catalogue'],
});

export const getProductCached = (id: string) =>
  unstable_cache(() => fetchProductById(id), ['product', id], {
    revalidate: CATALOGUE_REVALIDATE,
    tags: ['catalogue'],
  })();
