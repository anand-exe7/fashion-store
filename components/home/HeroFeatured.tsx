import { fetchProducts } from '@/lib/db';
import type { Product } from '@/lib/db';

const shell =
  'w-56 rounded-2xl border border-white/50 bg-white/80 p-3 shadow-[0_16px_40px_rgba(40,45,60,0.1)] backdrop-blur-sm';

// Nothing in the schema marks a product as "featured", so pick the newest one a
// shopper can actually buy and that has artwork to show — fetchProducts already
// returns newest-first.
const pickFeatured = (products: Product[]) =>
  products.find(p => p.isAvailable && p.stock > 0 && p.images?.[0]?.url) ||
  products.find(p => p.isAvailable && p.images?.[0]?.url);

export const HeroFeaturedSkeleton = () => (
  <div className={shell}>
    <div className="flex items-center gap-3">
      <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-neutral-200" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-2 w-12 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-28 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
    <div className="mt-2.5 h-[30px] animate-pulse rounded-full bg-neutral-200" />
  </div>
);

export const HeroFeatured = async () => {
  let product: Product | undefined;
  try {
    product = pickFeatured(await fetchProducts());
  } catch {
    return null;
  }
  if (!product) return null;

  const image = product.images.find(i => i.isPrimary) || product.images[0];

  return (
    <div className={shell}>
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
          <img
            src={image.url}
            alt={image.altText || product.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-400">Featured</p>
          <p className="truncate text-[12px] font-semibold text-neutral-900 mt-0.5">{product.name}</p>
          <p className="text-[12px] font-bold text-neutral-900">
            ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      <a
        href={`/product/${product.id}`}
        className="mt-2.5 flex items-center justify-center gap-2 rounded-full bg-black py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800"
      >
        Shop the look
        <svg width="9" height="9" viewBox="0 0 15 15" fill="none">
          <path d="M8.146 3.146a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L11.293 8H2.5a.5.5 0 0 1 0-1h8.793L8.146 3.854a.5.5 0 0 1 0-.708Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
        </svg>
      </a>
    </div>
  );
};
