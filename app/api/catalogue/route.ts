import { getCatalogue } from '@/lib/server/catalogue';

// Public, read-only catalogue for the storefront's client pages. The server cache holds it, so shoppers don't each query Supabase directly.
export async function GET() {
  try {
    const products = await getCatalogue();
    return Response.json(products, {
      headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' },
    });
  } catch (err) {
    console.error('catalogue route failed:', err);
    return Response.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
