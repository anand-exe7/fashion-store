import type { Metadata } from 'next';
import { cache } from 'react';
import { getProductCached } from '@/lib/server/catalogue';
import type { fetchProductById } from '@/lib/db';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import { optimizedSrc } from '@/lib/image';

// The product page is a Client Component, so per-product SEO (dynamic title,
// description, canonical, OG image and Product JSON-LD) lives here in the
// Server Component layout. `cache` dedupes the Supabase read so generateMetadata
// and the component below share one fetch per request.
// A transient failure must not be reported as "not found" (noindex) - treat it as unknown.
const getProduct = cache(async (id: string) => {
  try {
    return { product: await getProductCached(id), failed: false };
  } catch (err) {
    console.error('product metadata load failed:', err);
    return { product: null, failed: true };
  }
});

// Link previews and crawlers fetch this image, so point them at the resized,
// cached copy (1200px is the standard OG width) instead of the multi-MB original
// in Storage. Crawlers need an absolute URL.
const primaryImage = (p: NonNullable<Awaited<ReturnType<typeof fetchProductById>>>) => {
  const raw = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url || p.image || undefined;
  if (!raw) return undefined;
  const src = optimizedSrc(raw, 1200);
  return src.startsWith('/') ? `${SITE_URL}${src}` : src;
};

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { product, failed } = await getProduct(id);

  if (failed) return {};
  if (!product) {
    return { title: 'Product not found', robots: { index: false, follow: true } };
  }

  const description =
    product.description?.trim() ||
    `${product.name} — ${product.category} from ${SITE_NAME}. Shop online across India.`;
  const img = primaryImage(product);
  const canonical = `/product/${id}`;

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: `${product.name} · ${SITE_NAME}`,
      description,
      url: canonical,
      images: img ? [{ url: img }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} · ${SITE_NAME}`,
      description,
      images: img ? [img] : undefined,
    },
  };
}

export default async function ProductLayout({ params, children }: Props) {
  const { id } = await params;
  const { product } = await getProduct(id);

  // Product + breadcrumb structured data for rich results. Skipped if the
  // product can't be loaded (the client page renders its own not-found state).
  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Product',
            '@id': `${SITE_URL}/product/${id}#product`,
            name: product.name,
            description:
              product.description?.trim() ||
              `${product.name} — ${product.category} from ${SITE_NAME}.`,
            category: product.category,
            image: primaryImage(product),
            url: `${SITE_URL}/product/${id}`,
            brand: { '@type': 'Brand', name: SITE_NAME },
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: 'INR',
              availability:
                product.isAvailable !== false && (product.stock ?? 0) > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              url: `${SITE_URL}/product/${id}`,
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
              { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
              { '@type': 'ListItem', position: 3, name: product.name },
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
