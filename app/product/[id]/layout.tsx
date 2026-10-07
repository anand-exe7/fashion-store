import type { Metadata } from 'next';
import { cache } from 'react';
import { fetchProductById } from '@/lib/db';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

// The product page is a Client Component, so per-product SEO (dynamic title,
// description, canonical, OG image and Product JSON-LD) lives here in the
// Server Component layout. `cache` dedupes the Supabase read so generateMetadata
// and the component below share one fetch per request.
const getProduct = cache((id: string) => fetchProductById(id));

const primaryImage = (p: NonNullable<Awaited<ReturnType<typeof fetchProductById>>>) =>
  p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url || p.image || undefined;

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

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
  const product = await getProduct(id);

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
