// ============================================================
// Price presentation — one place that decides how a selling price
// and its MRP are shown, so the card, the product page and the
// cart can never disagree.
//
// An original price only counts when it is genuinely HIGHER than
// what we're charging: a stale MRP equal to (or below) the selling
// price must not render as a strike-through of the same number.
// ============================================================

export const inrPrice = (n: number): string => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

export interface PriceParts {
  /** The selling price, formatted. Shown in green when discounted. */
  priceLabel: string;
  /** The MRP, formatted — or null when there is nothing to strike through. */
  originalLabel: string | null;
  /** Whether a usable MRP is present. */
  hasMrp: boolean;
  /** Whole-percent saving, e.g. 20 for "20% OFF". 0 when hasMrp is false. */
  discountPct: number;
}

export function priceParts(
  price: number | string | null | undefined,
  originalPrice?: number | string | null,
): PriceParts {
  const selling = Number(price) || 0;
  const mrp = Number(originalPrice) || 0;
  const hasMrp = mrp > selling && selling > 0;

  return {
    priceLabel: inrPrice(selling),
    originalLabel: hasMrp ? inrPrice(mrp) : null,
    hasMrp,
    discountPct: hasMrp ? Math.round(((mrp - selling) / mrp) * 100) : 0,
  };
}

// ============================================================
// Variant pricing
//
// Each size/colour row can carry its own price, which overrides the
// product's base price. The till has always honoured that; the website
// used to ignore it completely and sell at the base price, so a pant
// priced ₹999 per size went out at its ₹799 base.
// ============================================================

export interface PricedVariant {
  price?: number | null;
  isAvailable?: boolean | null;
}

/** What one variant actually costs: its own price, else the product's base. */
export function variantPrice(
  basePrice: number | null | undefined,
  variant?: PricedVariant | null,
): number {
  const own = Number(variant?.price);
  return Number.isFinite(own) && own > 0 ? own : Number(basePrice) || 0;
}

/**
 * What a listing card should show for a product: the cheapest price a shopper
 * could actually pay. `from` is true when the sizes aren't all the same price,
 * so the card can say "from ₹X" instead of implying a single price.
 */
export function listingPrice(
  basePrice: number | null | undefined,
  variants?: PricedVariant[] | null,
): { price: number; from: boolean } {
  const sellable = (variants || []).filter((v) => v.isAvailable !== false);
  if (sellable.length === 0) return { price: Number(basePrice) || 0, from: false };

  const prices = sellable.map((v) => variantPrice(basePrice, v));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { price: min, from: max > min };
}
