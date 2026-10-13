import { createClient } from './supabase/client';

const supabase = createClient();

// Fallback "alert below N" for a product with no stored threshold — and for a
// database on which migration 0005 (products.low_stock) hasn't been run yet.
export const DEFAULT_LOW_STOCK = 6;

// ============================
// TYPES
// ============================
export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size?: string;
  colorName?: string;
  colorHex?: string;
  price: number;
  weightGrams: number;
  stock: number;
  sku?: string;
  ageMinMonths?: number | null;
  ageMaxMonths?: number | null;
  isAvailable: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  details?: string;
  benefits?: string[];
  price: number;
  // Struck-through MRP shown beside the selling price. null = no MRP set.
  originalPrice?: number | null;
  weightGrams?: number;
  image?: string; // Legacy
  isNew?: boolean;
  // Ticked per product in Admin → Inventory. Drives the home page's
  // Best Sellers row; nothing infers it from sales.
  isBestSeller?: boolean;
  discountLabel?: string;
  department?: string;
  ageMinMonths?: number | null;
  ageMaxMonths?: number | null;
  // Derived, never authored: the SUM of every variant's stock.
  stock: number;
  // "Alert below N", compared against the product total above.
  lowStock: number;
  isAvailable: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface Coupon {
  code: string;
  discountPct: number;
  minOrder: number;
  expiry?: string;
  usageLimit: number;
  used: number;
  isActive: boolean;
}

export interface OrderItem {
  id?: string;
  productId?: string;
  /** The exact variant row this line sold — the handle used to restock it. */
  variantId?: string | null;
  name: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  // 'wholesale' is served by the orders API from the wholesale tables and
  // reuses this shape on the shared invoice page.
  source: 'online' | 'offline' | 'wholesale';
  subtotal: number;
  discount: number;
  couponCode?: string;
  delivery: number;
  total: number;
  amountReceived?: number;
  // Buyer's GSTIN — only ever set on wholesale invoices; null elsewhere.
  customerGstin?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  // How an offline (POS) bill was paid; null for online / legacy bills.
  paymentMethod?: 'cash' | 'gpay' | 'split' | null;
  // Customer date of birth (yyyy-mm-dd), captured at billing for birthday offers.
  dob?: string | null;
  // Online-order packing workflow: 'pending' | 'packed' | 'shipped'. NULL for POS bills.
  fulfillmentStatus?: 'pending' | 'packed' | 'shipped' | null;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface DeliveryTier {
  id: string;
  regionId: string;
  minWeightGrams: number;
  maxWeightGrams: number | null;
  charge: number;
}

export interface DeliveryRegion {
  id: string;
  name: string;
  isActive: boolean;
  tiers: DeliveryTier[];
}

// ============================
// TAXONOMY
// ============================
export interface Category {
  name: string;
  isActive: boolean;
}

export interface Department {
  name: string;
  isActive: boolean;
  ageMinMonths?: number | null;
  ageMaxMonths?: number | null;
}

// A department with no age range matches purely by the product's explicit
// `department` tag (Men/Women/Unisex-style). A department WITH an age range
// (Toddlers/Kids/Teens-style) matches by comparing its range against the
// product's own resolved age range — no product is ever tagged "Kids"
// directly for this to work. If the product has no age data yet, we fall
// back to the tag so existing untouched products don't vanish from filters.
export function productMatchesDepartment(product: Product, department: Department): boolean {
  const deptHasRange = department.ageMinMonths != null || department.ageMaxMonths != null;
  if (!deptHasRange) return product.department === department.name;

  const productHasRange = product.ageMinMonths != null || product.ageMaxMonths != null;
  if (!productHasRange) return product.department === department.name;

  const productMin = product.ageMinMonths ?? 0;
  const productMax = product.ageMaxMonths ?? Infinity;
  const deptMin = department.ageMinMonths ?? 0;
  const deptMax = department.ageMaxMonths ?? Infinity;
  return productMin < deptMax && productMax > deptMin;
}

// Formats a months-based age range for display, e.g. (36, 120) -> "3–9Y".
// The upper bound is stored exclusive, so it's shifted down by one unit
// before display (120 exclusive months -> "9Y" inclusive, not "10Y").
export function formatAgeRange(minMonths?: number | null, maxMonths?: number | null): string {
  if (minMonths == null && maxMonths == null) return '';
  const bound = (months: number, isUpper: boolean) => {
    const m = isUpper ? months - 1 : months;
    return m < 12 ? `${Math.max(m, 0)}M` : `${Math.floor(m / 12)}Y`;
  };
  if (minMonths != null && maxMonths != null) {
    const lo = bound(minMonths, false);
    const hi = bound(maxMonths, true);
    // A single-unit range (e.g. a size for exactly 2-year-olds, stored as
    // 24–36 months half-open) collapses to identical bounds — show "2Y",
    // not "2Y–2Y".
    return lo === hi ? lo : `${lo}–${hi}`;
  }
  if (minMonths != null) return `${bound(minMonths, false)}+`;
  return `Up to ${bound(maxMonths!, true)}`;
}

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) {
    console.error("fetchCategories error (table might not exist):", error);
    return [];
  }
  return (data || []).map(c => ({ name: c.name, isActive: c.is_active }));
};

export const fetchDepartments = async (): Promise<Department[]> => {
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) {
    console.error("fetchDepartments error (table might not exist):", error);
    return [];
  }
  return (data || []).map(d => ({
    name: d.name,
    isActive: d.is_active,
    ageMinMonths: d.age_min_months,
    ageMaxMonths: d.age_max_months,
  }));
};

export const updateCategory = async (name: string, isActive: boolean) => {
  const { error } = await supabase.from('categories').update({ is_active: isActive }).eq('name', name);
  if (error) throw error;
};

export const updateDepartment = async (name: string, isActive: boolean) => {
  const { error } = await supabase.from('departments').update({ is_active: isActive }).eq('name', name);
  if (error) throw error;
};

export const updateDepartmentAgeRange = async (name: string, ageMinMonths: number | null, ageMaxMonths: number | null) => {
  const { error } = await supabase
    .from('departments')
    .update({ age_min_months: ageMinMonths, age_max_months: ageMaxMonths })
    .eq('name', name);
  if (error) throw error;
};

export const deleteCategory = async (name: string) => {
  // Be careful: if products use this category, it might fail due to FK constraints
  const { error } = await supabase.from('categories').delete().eq('name', name);
  if (error) throw error;
};

// ============================
// PRODUCTS
// ============================
// `ids` narrows the load to specific products (used for "Complete the Look"
// suggestions) so we don't pull the whole catalogue for a handful of items.
export const fetchProducts = async (ids?: string[]): Promise<Product[]> => {
  if (ids && ids.length === 0) return [];
  const [
    { data: products, error: pError },
    { data: images, error: iError },
    { data: variants, error: vError },
  ] = await Promise.all([
    (ids ? supabase.from('products').select('*').in('id', ids) : supabase.from('products').select('*')).order('created_at', { ascending: false }),
    (ids ? supabase.from('product_images').select('*').in('product_id', ids) : supabase.from('product_images').select('*')).order('sort_order'),
    (ids ? supabase.from('product_variants').select('*').in('product_id', ids) : supabase.from('product_variants').select('*')).order('sort_order'),
  ]);

  // A partial result (products without their variants/photos) would show every
  // item as sold out or photo-less, and the shared cache would keep it for everyone.
  if (pError) throw pError;
  if (iError) throw iError;
  if (vError) throw vError;

  return (products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    originalPrice: p.original_price ?? null,
    image: p.image,
    isNew: p.is_new,
    isBestSeller: p.is_best_seller ?? false,
    discountLabel: p.discount_label,
    department: p.department,
    ageMinMonths: p.age_min_months,
    ageMaxMonths: p.age_max_months,
    weightGrams: p.weight_grams,
    stock: (variants || []).filter((v: any) => v.product_id === p.id).reduce((sum: number, v: any) => sum + (v.stock || 0), 0),
    lowStock: p.low_stock ?? DEFAULT_LOW_STOCK,
    isAvailable: p.is_available,
    images: (images || [])
      .filter((i: any) => i.product_id === p.id)
      .map((i: any) => ({
        id: i.id,
        productId: i.product_id,
        url: i.url,
        altText: i.alt_text,
        sortOrder: i.sort_order,
        isPrimary: i.is_primary,
      })),
    variants: (variants || [])
      .filter((v: any) => v.product_id === p.id)
      .map((v: any) => ({
        id: v.id,
        productId: v.product_id,
        size: v.size,
        colorName: v.color_name,
        colorHex: v.color_hex,
        price: v.price,
        weightGrams: v.weight_grams,
        stock: v.stock,
        sku: v.sku,
        ageMinMonths: v.age_min_months,
        ageMaxMonths: v.age_max_months,
        isAvailable: v.is_available,
        sortOrder: v.sort_order,
      })),
  }));
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  const [
    { data: p, error: pError },
    { data: images, error: iError },
    { data: variants, error: vError },
  ] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
    supabase.from('product_variants').select('*').eq('product_id', id).order('sort_order'),
  ]);

  // PGRST116 = no such row. Any other failure is transient: throw it rather than
  // report "not found" (which the shared cache would then hand to every visitor).
  if (pError && pError.code !== 'PGRST116') throw pError;
  if (iError) throw iError;
  if (vError) throw vError;
  if (!p) return null;

  return {
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    originalPrice: p.original_price ?? null,
    image: p.image,
    isNew: p.is_new,
    isBestSeller: p.is_best_seller ?? false,
    discountLabel: p.discount_label,
    department: p.department,
    ageMinMonths: p.age_min_months,
    ageMaxMonths: p.age_max_months,
    weightGrams: p.weight_grams,
    stock: (variants || []).reduce((sum: number, v: any) => sum + (v.stock || 0), 0),
    lowStock: p.low_stock ?? DEFAULT_LOW_STOCK,
    isAvailable: p.is_available,
    images: (images || []).map((i: any) => ({
      id: i.id,
      productId: i.product_id,
      url: i.url,
      altText: i.alt_text,
      sortOrder: i.sort_order,
      isPrimary: i.is_primary,
    })),
    variants: (variants || []).map((v: any) => ({
      id: v.id,
      productId: v.product_id,
      size: v.size,
      colorName: v.color_name,
      colorHex: v.color_hex,
      price: v.price,
      weightGrams: v.weight_grams,
      stock: v.stock,
      sku: v.sku,
      ageMinMonths: v.age_min_months,
      ageMaxMonths: v.age_max_months,
      isAvailable: v.is_available,
      sortOrder: v.sort_order,
    })),
  };
};

// What a save had to leave out because the database hasn't been migrated yet.
// Returned rather than thrown: refusing the whole product would throw away
// everything else the admin just typed.
export interface UpsertSkip {
  field: string;
  migration: string;
}

export const upsertProduct = async (
  product: Partial<Product>,
  images?: string[],
  variants?: any[],
): Promise<{ skipped: UpsertSkip[] }> => {
  const skipped: UpsertSkip[] = [];
  // Auto-create category if it doesn't exist to prevent Foreign Key errors
  if (product.category) {
    await supabase.from('categories').upsert({ name: product.category }).select();
  }

  // original_price / low_stock arrive with migration 0005. Probe once so a
  // database that hasn't been migrated still saves products, rather than
  // failing every save with "column does not exist".
  const hasPricingCols = await columnSupported('products', 'original_price');
  const hasBestSeller = await columnSupported('products', 'is_best_seller');
  if (!hasPricingCols && product.originalPrice != null) {
    skipped.push({ field: 'MRP price', migration: '0005' });
  }

  const productRow: Record<string, unknown> = {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    weight_grams: product.weightGrams,
    image: product.image,
    is_new: product.isNew,
    discount_label: product.discountLabel,
    department: product.department,
    is_available: product.isAvailable ?? true,
  };
  if (hasBestSeller && product.isBestSeller !== undefined) {
    productRow.is_best_seller = product.isBestSeller;
  } else if (!hasBestSeller && product.isBestSeller) {
    skipped.push({ field: 'Best Seller', migration: '0007' });
  }
  if (hasPricingCols) {
    productRow.original_price = product.originalPrice ?? null;
    // Only write a threshold the caller actually supplied, so a partial
    // update can't silently reset it to the default.
    if (product.lowStock != null) productRow.low_stock = product.lowStock;
  }

  const { error } = await supabase.from('products').upsert(productRow);
  if (error) throw error;

  if (images && images.length > 0 && product.id) {
    await supabase.from('product_images').delete().eq('product_id', product.id);
    await supabase.from('product_images').insert(
      images.map((url, i) => ({
        product_id: product.id,
        url,
        sort_order: i + 1,
        is_primary: i === 0,
      }))
    );
  }

  if (variants !== undefined && product.id) {
    // The 0002 migration adds age_min_months / age_max_months. Detect once per
    // page load whether the DB has those columns, so we don't try to write
    // them into an unmigrated schema — that used to leave the product with
    // zero variants after the DELETE succeeded and the INSERT failed.
    const hasAgeCols = await ageColumnsSupported();
    if (!hasAgeCols && variants.some(v => v.ageMinMonths != null || v.ageMaxMonths != null)) {
      throw new Error('Age range set on a variant, but the age_groups migration (0002) has not been applied to this database. Run supabase/migrations/0002_age_groups.sql, then retry.');
    }

    // Variants are reconciled BY ID, never wiped and re-created. The old
    // delete-everything-then-insert-everything handed every variant a fresh
    // UUID on each save — which broke any POS/cart line still holding the
    // previous `variantId` — and a failed insert left the product with no
    // variants at all.
    const { data: existingRows, error: existingError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', product.id);
    if (existingError) throw existingError;
    const existingIds = new Set<string>((existingRows || []).map((r: any) => String(r.id)));

    // A product with no sized variants is still stored as a single "Default"
    // row. Reuse that row's id when there is exactly one, so simple products
    // keep stable variant ids across saves as well.
    const soleExistingId = existingIds.size === 1 ? [...existingIds][0] : undefined;
    const effectiveVariants = variants.length > 0 ? variants : [{
      id: soleExistingId,
      size: 'Default',
      colorName: null,
      colorHex: null,
      price: product.price ?? 0,
      weightGrams: product.weightGrams ?? 0,
      stock: product.stock ?? 0,
      isAvailable: product.isAvailable !== false,
    }];

    const rows = effectiveVariants.map((v, i) => {
      const row: Record<string, unknown> = {
        // Carried through so an existing variant keeps its id (and with it any
        // cart line, POS line or order row pointing at it).
        id: typeof v.id === 'string' && v.id ? v.id : undefined,
        product_id: product.id,
        size: v.size || 'Default',
        color_name: v.colorName || null,
        color_hex: v.colorHex || null,
        price: (v.price !== undefined && v.price !== null && !isNaN(Number(v.price)))
          ? Number(v.price)
          : (Number(product.price) || 0),
        weight_grams: (v.weightGrams !== undefined && v.weightGrams !== null && !isNaN(Number(v.weightGrams)))
          ? Number(v.weightGrams)
          : (Number(product.weightGrams) || 0),
        stock: (v.stock !== undefined && v.stock !== null && !isNaN(Number(v.stock)))
          ? Number(v.stock)
          : 0,
        is_available: v.isAvailable !== false,
        sort_order: i,
      };
      if (hasAgeCols) {
        row.age_min_months = v.ageMinMonths ?? null;
        row.age_max_months = v.ageMaxMonths ?? null;
      }
      return row;
    });

    const keeps = rows.filter((r) => typeof r.id === 'string' && existingIds.has(r.id as string));
    const adds = rows
      .filter((r) => !(typeof r.id === 'string' && existingIds.has(r.id as string)))
      .map((r) => {
        const fresh = { ...r };
        delete fresh.id; // let Postgres generate a new UUID
        return fresh;
      });
    const keptIds = new Set(keeps.map((r) => r.id as string));

    // 1. Drop only what the admin actually removed. Done first so a size/colour
    //    freed up in this save can be reused by a new row below without
    //    tripping the UNIQUE(product_id, size, color_name) constraint.
    const removedIds = [...existingIds].filter((id) => !keptIds.has(id));
    if (removedIds.length > 0) {
      const { error: deleteError } = await supabase.from('product_variants').delete().in('id', removedIds);
      if (deleteError) throw deleteError;
    }

    // 2. Update the survivors in place (upsert conflicts on the primary key).
    if (keeps.length > 0) {
      const { error: updateError } = await supabase.from('product_variants').upsert(keeps);
      if (updateError) throw describeVariantWriteError(updateError);
    }

    // 3. Add the genuinely new rows.
    if (adds.length > 0) {
      const { error: insertError } = await supabase.from('product_variants').insert(adds);
      if (insertError) throw describeVariantWriteError(insertError);
    }
  }

  return { skipped };
};

// Which optional product features this database can actually store. Lets the
// admin form warn on the field itself instead of after a failed save.
export const productFeatureSupport = async (): Promise<{ pricing: boolean; bestSeller: boolean }> => ({
  pricing: await columnSupported('products', 'original_price'),
  bestSeller: await columnSupported('products', 'is_best_seller'),
});

// product_variants has UNIQUE(product_id, size, color_name). Swapping a
// size/colour between two rows that both survive the save trips it, and the
// raw Postgres text ("duplicate key value violates unique constraint …") tells
// an admin nothing actionable.
function describeVariantWriteError(error: { code?: string; message?: string }): Error {
  if (error?.code === '23505') {
    return new Error('Two variants would end up with the same size and colour. Save the change in two steps (or rename one row first).');
  }
  return new Error(error?.message || 'Failed to save product variants.');
}

// One-shot lazy probe: does `table.column` exist? Only a DEFINITIVE answer is
// cached for the life of the module — either the column exists, or Postgres
// reports it as genuinely undefined (SQLSTATE 42703). A transient failure
// (network, auth, timeout) must NOT be cached: doing so used to permanently
// wedge age saving on a single blip during first load. On an ambiguous error we
// assume the column exists (the app ships the migration that adds it) and retry
// the probe on the next save — if the schema really is unmigrated, the guarded
// writes still fail loudly before anything is deleted.
const columnSupportedCache = new Map<string, boolean>();
async function columnSupported(table: string, column: string): Promise<boolean> {
  const key = `${table}.${column}`;
  const cached = columnSupportedCache.get(key);
  if (cached !== undefined) return cached;
  try {
    const { error } = await supabase.from(table).select(column).limit(1);
    if (!error) {
      columnSupportedCache.set(key, true);
      return true;
    }
    if (error.code === '42703') { // column truly absent
      columnSupportedCache.set(key, false);
      return false;
    }
    console.warn(`${key} probe failed (transient?), will retry next save:`, error);
    return true; // don't cache — retry next time
  } catch (err) {
    console.warn(`${key} probe threw (transient?), will retry next save:`, err);
    return true; // don't cache — retry next time
  }
}

const ageColumnsSupported = () => columnSupported('product_variants', 'age_min_months');

// Storage path inside the public 'images' bucket for one of our own URLs, else null.
const imagePathOf = (url: string | null | undefined): string | null => {
  if (!url) return null;
  // Only our own project's public 'images' bucket; never an external URL that
  // merely contains "/images/".
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/`;
  if (!url.startsWith(prefix)) return null;
  return decodeURIComponent(url.slice(prefix.length).split('?')[0]);
};

// Tell the server to drop its cached catalogue after an admin change, so the
// storefront reflects it right away. Fire-and-forget: the cache expires on its own anyway.
export const revalidateCatalogue = () => {
  fetch('/api/catalogue/revalidate', { method: 'POST' }).catch(() => {});
};

// Storefront catalogue via the cached /api/catalogue route, so shoppers share one
// Supabase read instead of each pulling every product row. Falls back to a direct
// query if the route is unavailable.
export const fetchCatalogue = async (): Promise<Product[]> => {
  try {
    const res = await fetch('/api/catalogue');
    if (res.ok) return (await res.json()) as Product[];
  } catch {
    // fall through to the direct query
  }
  return fetchProducts();
};

export const deleteProduct = async (id: string) => {
  // Collect this product's photos before the rows go away.
  const [{ data: imgRows }, { data: prodRow }] = await Promise.all([
    supabase.from('product_images').select('url').eq('product_id', id),
    supabase.from('products').select('image').eq('id', id).maybeSingle(),
  ]);
  const urls = new Set<string>([...(imgRows || []).map((r: any) => r.url), prodRow?.image].filter(Boolean));

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;

  // Best-effort, like deleteReel: the row is the source of truth. Skip any photo
  // still used elsewhere (another product, or a review the admin attached it to).
  try {
    const ours = [...urls].filter((u) => imagePathOf(u));
    if (ours.length > 0) {
      const [a, b, c] = await Promise.all([
        supabase.from('product_images').select('url').in('url', ours),
        supabase.from('products').select('image').in('image', ours),
        supabase.from('reviews').select('image_url').in('image_url', ours),
      ]);
      // If a check errored we can't tell what's unused, so keep every file.
      if (!a.error && !b.error && !c.error) {
        const stillUsed = new Set<string>([
          ...(a.data || []).map((r: any) => r.url),
          ...(b.data || []).map((r: any) => r.image),
          ...(c.data || []).map((r: any) => r.image_url),
        ]);
        const paths = ours.filter((u) => !stillUsed.has(u)).map((u) => imagePathOf(u)!);
        if (paths.length > 0) await supabase.storage.from('images').remove(paths);
      }
    }
  } catch (err) {
    console.warn('Could not remove product photos from storage:', err);
  }
};

// ============================
// PRODUCT SUGGESTIONS ("Complete the Look")
// ============================

// Ids only — used to seed the admin picker without loading full product rows.
export const fetchSuggestionIds = async (productId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('product_suggestions')
    .select('suggested_id')
    .eq('product_id', productId)
    .order('sort_order');
  if (error) {
    console.error('fetchSuggestionIds error:', error);
    return [];
  }
  return (data || []).map((r: any) => r.suggested_id);
};

// Full product rows, in curated order — used on the product detail page.
export const fetchSuggestions = async (productId: string): Promise<Product[]> => {
  const ids = await fetchSuggestionIds(productId);
  if (ids.length === 0) return [];

  const all = await fetchProducts(ids);
  const byId = new Map(all.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is Product => !!p);
};

// Replaces the full suggestion list for a product, in the given order (max enforced by caller).
export const updateSuggestions = async (productId: string, suggestedIds: string[]) => {
  const { error: delError } = await supabase.from('product_suggestions').delete().eq('product_id', productId);
  if (delError) throw delError;

  const ids = suggestedIds.filter((id) => id !== productId);
  if (ids.length === 0) return;

  const { error: insError } = await supabase.from('product_suggestions').insert(
    ids.map((suggested_id, i) => ({
      product_id: productId,
      suggested_id,
      sort_order: i,
    }))
  );
  if (insError) throw insError;
};

// Atomic stock change on one variant. Negative delta = sale, positive =
// restock; the result is clamped at 0 server-side. Returns the new stock.
//
// This goes through the adjust_variant_stock() RPC (migration 0005) so the
// whole change is ONE statement: two concurrent orders serialise on the row
// instead of both reading the same stock and double-consuming it. On a
// database where the RPC isn't there yet we fall back to the old
// read-then-write, which is racy but better than refusing the sale.
export const adjustVariantStock = async (variantId: string, delta: number): Promise<number> => {
  if (!Number.isFinite(delta) || delta === 0) {
    const { data } = await supabase.from('product_variants').select('stock').eq('id', variantId).single();
    return data?.stock ?? 0;
  }

  const { data, error } = await supabase.rpc('adjust_variant_stock', {
    p_variant_id: variantId,
    p_delta: Math.trunc(delta),
  });

  if (!error) return Number(data) || 0;

  // PGRST202 = function not found in the schema cache: migration 0005 hasn't
  // been applied. Anything else is a real failure (missing variant, RLS, …).
  if (error.code !== 'PGRST202' && error.code !== '42883') throw error;
  console.warn('adjust_variant_stock RPC unavailable — falling back to a non-atomic update. Run supabase/migrations/0005_pricing_and_stock.sql.');
  return adjustVariantStockNonAtomic(variantId, Math.trunc(delta));
};

// Pre-0004 fallback only. Racy by construction — see adjustVariantStock.
const adjustVariantStockNonAtomic = async (variantId: string, delta: number): Promise<number> => {
  const { data, error: readErr } = await supabase
    .from('product_variants')
    .select('stock')
    .eq('id', variantId)
    .single();
  if (readErr || !data) throw readErr || new Error('Variant not found');
  const next = Math.max(0, (data.stock || 0) + delta);
  const { error: writeErr } = await supabase
    .from('product_variants')
    .update({ stock: next })
    .eq('id', variantId);
  if (writeErr) throw writeErr;
  return next;
};

// Sale path. Kept as its own name because that's what the order flow means.
export const decrementVariantStock = async (variantId: string, qty: number) => {
  if (qty <= 0) return;
  await adjustVariantStock(variantId, -qty);
};

export const updateProductVariant = async (variantId: string, patch: Partial<ProductVariant>) => {
  const payload: any = {};
  if (patch.stock !== undefined) payload.stock = patch.stock;
  if (patch.price !== undefined) payload.price = patch.price;
  if (patch.weightGrams !== undefined) payload.weight_grams = patch.weightGrams;
  if (patch.ageMinMonths !== undefined) payload.age_min_months = patch.ageMinMonths;
  if (patch.ageMaxMonths !== undefined) payload.age_max_months = patch.ageMaxMonths;
  if (patch.isAvailable !== undefined) payload.is_available = patch.isAvailable;

  const { error } = await supabase.from('product_variants').update(payload).eq('id', variantId);
  if (error) throw error;
};

// ============================
// COUPONS
// ============================
export const fetchCoupons = async (): Promise<Coupon[]> => {
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((c: any) => ({
    code: c.code,
    discountPct: c.discount_pct,
    minOrder: c.min_order,
    expiry: c.expiry,
    usageLimit: c.usage_limit,
    used: c.used,
    isActive: c.is_active,
  }));
};

export const upsertCoupon = async (c: Coupon) => {
  const { error } = await supabase.from('coupons').upsert({
    code: c.code,
    discount_pct: c.discountPct,
    min_order: c.minOrder,
    expiry: c.expiry || null,
    usage_limit: c.usageLimit,
    used: c.used,
    is_active: c.isActive,
  });
  if (error) throw error;
};

export const deleteCoupon = async (code: string) => {
  const { error } = await supabase.from('coupons').delete().eq('code', code);
  if (error) throw error;
};

export const validateCoupon = async (code: string, subtotal: number): Promise<{ ok: boolean; discount: number; reason?: string; coupon?: Coupon }> => {
  const { data: c, error } = await supabase.from('coupons').select('*').eq('code', code.trim().toUpperCase()).single();
  
  if (error || !c) return { ok: false, discount: 0, reason: 'Invalid coupon code' };
  if (!c.is_active) return { ok: false, discount: 0, reason: 'Coupon is inactive' };
  if (c.expiry && new Date(c.expiry) < new Date(new Date().toDateString())) return { ok: false, discount: 0, reason: 'Coupon expired' };
  if (c.used >= c.usage_limit) return { ok: false, discount: 0, reason: 'Usage limit reached' };
  if (subtotal < c.min_order) return { ok: false, discount: 0, reason: `Minimum order ₹${c.min_order.toLocaleString('en-IN')}` };
  
  return { 
    ok: true, 
    discount: Math.round((subtotal * c.discount_pct) / 100),
    coupon: {
      code: c.code,
      discountPct: c.discount_pct,
      minOrder: c.min_order,
      expiry: c.expiry,
      usageLimit: c.usage_limit,
      used: c.used,
      isActive: c.is_active
    }
  };
};

// ============================
// ORDERS
// ============================
export const fetchOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((o: any) => ({
    id: o.id,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerEmail: o.customer_email,
    customerAddress: o.customer_address,
    source: o.source,
    subtotal: o.subtotal,
    discount: o.discount,
    couponCode: o.coupon_code,
    delivery: o.delivery,
    total: o.total,
    amountReceived: o.amount_received,
    status: o.status,
    paymentMethod: o.payment_method,
    dob: o.dob,
    fulfillmentStatus: o.fulfillment_status,
    razorpayOrderId: o.razorpay_order_id,
    razorpayPaymentId: o.razorpay_payment_id,
    createdAt: o.created_at,
    items: (o.order_items || []).map((i: any) => ({
      id: i.id,
      productId: i.product_id,
      variantId: i.variant_id ?? null,
      name: i.name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      price: i.price,
    })),
  }));
};

export const fetchOrderById = async (id: string): Promise<Order | null> => {
  const { data: o, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('id', id)
    .single();

  if (error || !o) return null;

  return {
    id: o.id,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerEmail: o.customer_email,
    customerAddress: o.customer_address,
    source: o.source as 'online' | 'offline',
    subtotal: o.subtotal,
    discount: o.discount,
    couponCode: o.coupon_code,
    delivery: o.delivery,
    total: o.total,
    amountReceived: o.amount_received,
    status: o.status as any,
    paymentMethod: o.payment_method,
    dob: o.dob,
    fulfillmentStatus: o.fulfillment_status,
    razorpayOrderId: o.razorpay_order_id,
    razorpayPaymentId: o.razorpay_payment_id,
    createdAt: o.created_at,
    items: (o.order_items || []).map((i: any) => ({
      id: i.id,
      productId: i.product_id,
      variantId: i.variant_id ?? null,
      name: i.name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      price: i.price,
    })),
  };
};

export const insertOrder = async (order: Order) => {
  const { error: oError } = await supabase.from('orders').insert({
    id: order.id,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail,
    customer_address: order.customerAddress,
    source: order.source,
    subtotal: order.subtotal,
    discount: order.discount,
    coupon_code: order.couponCode,
    delivery: order.delivery,
    total: order.total,
    amount_received: order.amountReceived,
    status: order.status,
    payment_method: order.paymentMethod ?? null,
    dob: order.dob ?? null,
    fulfillment_status: order.fulfillmentStatus ?? null,
    razorpay_order_id: order.razorpayOrderId,
    razorpay_payment_id: order.razorpayPaymentId,
  });
  if (oError) throw oError;

  if (order.items && order.items.length > 0) {
    const items = order.items.map(i => ({
      order_id: order.id,
      product_id: i.productId,
      name: i.name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      price: i.price,
    }));

    // Record WHICH variant each line sold (migration 0006). Without it a bill
    // can be read back but never tied to the size/colour it consumed, so a
    // deleted or refunded order can't restock anything. Guarded so billing
    // still works against a database that hasn't had 0005 applied.
    const hasVariantLink = await columnSupported('order_items', 'variant_id');
    const rows = hasVariantLink
      ? items.map((row, idx) => ({ ...row, variant_id: order.items[idx].variantId ?? null }))
      : items;

    const { error: iError } = await supabase.from('order_items').insert(rows);
    if (iError) throw iError;
  }
};

export const updateOrderStatus = async (id: string, status: string) => {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
};

// Advance an online order's packing workflow: 'pending' | 'packed' | 'shipped'.
export const updateOrderFulfillment = async (id: string, fulfillmentStatus: string) => {
  const { error } = await supabase.from('orders').update({ fulfillment_status: fulfillmentStatus }).eq('id', id);
  if (error) throw error;
};

export const deleteOrder = async (id: string) => {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
};

export const generateInvoiceId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `INV-${currentYear}-${randomPart}`;
};

// ============================
// DELIVERY REGIONS & TIERS
// ============================
export const fetchDeliveryRegions = async (onlyActive = false): Promise<DeliveryRegion[]> => {
  let query = supabase.from('delivery_regions').select('*');
  if (onlyActive) {
    query = query.eq('is_active', true);
  }
  const { data: regions, error: rError } = await query.order('name');
  if (rError) throw rError;

  const { data: tiers, error: tError } = await supabase
    .from('delivery_tiers')
    .select('*')
    .order('min_weight_grams');
  if (tError) throw tError;

  return (regions || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    isActive: r.is_active,
    tiers: (tiers || [])
      .filter((t: any) => t.region_id === r.id)
      .map((t: any) => ({
        id: t.id,
        regionId: t.region_id,
        minWeightGrams: t.min_weight_grams,
        maxWeightGrams: t.max_weight_grams,
        charge: t.charge,
      })),
  }));
};

export const calculateDeliveryFee = (
  totalWeightGrams: number,
  region: DeliveryRegion | null
): number => {
  if (!region || !region.tiers || region.tiers.length === 0) return 0;

  const sortedTiers = [...region.tiers].sort((a, b) => a.minWeightGrams - b.minWeightGrams);

  for (const tier of sortedTiers) {
    const minMatch = totalWeightGrams >= tier.minWeightGrams;
    const maxMatch = tier.maxWeightGrams === null || totalWeightGrams < tier.maxWeightGrams;

    if (minMatch && maxMatch) {
      return tier.charge;
    }
  }

  return sortedTiers[sortedTiers.length - 1].charge;
};

// ============================
// REVIEWS (customer-submitted, admin-moderated)
// ============================
export interface Review {
  id: string;
  name: string;
  note: string;
  rating: number;
  product?: string | null;
  imageUrl?: string | null;
  isApproved: boolean;
  createdAt: string;
}

const mapReview = (r: any): Review => ({
  id: r.id,
  name: r.name,
  note: r.note,
  rating: r.rating,
  product: r.product,
  imageUrl: r.image_url,
  isApproved: r.is_approved,
  createdAt: r.created_at,
});

// Public storefront: only approved reviews (RLS also enforces this).
export const fetchApprovedReviews = async (): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('fetchApprovedReviews error:', error);
    return [];
  }
  return (data || []).map(mapReview);
};

// Admin: every review, pending first so new submissions are easy to spot.
export const fetchAllReviews = async (): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('is_approved', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapReview);
};

// Customer submission — always lands unapproved (pending admin review).
export const submitReview = async (r: { name: string; note: string; rating: number; product?: string }) => {
  const { error } = await supabase.from('reviews').insert({
    name: r.name,
    note: r.note,
    rating: r.rating,
    product: r.product || null,
    is_approved: false,
  });
  if (error) throw error;
};

export const updateReview = async (
  id: string,
  patch: Partial<{ note: string; isApproved: boolean; imageUrl: string | null }>,
) => {
  const payload: Record<string, unknown> = {};
  if (patch.note !== undefined) payload.note = patch.note;
  if (patch.isApproved !== undefined) payload.is_approved = patch.isApproved;
  if (patch.imageUrl !== undefined) payload.image_url = patch.imageUrl;
  const { error } = await supabase.from('reviews').update(payload).eq('id', id);
  if (error) throw error;
};

export const deleteReview = async (id: string) => {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
};

// ============================
// INSTAGRAM REELS (admin-managed home-page reels)
// ============================
export interface Reel {
  id: string;
  videoUrl: string;
  href?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

const mapReel = (r: any): Reel => ({
  id: r.id,
  videoUrl: r.video_url,
  href: r.href,
  sortOrder: r.sort_order,
  isActive: r.is_active,
  createdAt: r.created_at,
});

export const fetchActiveReels = async (): Promise<Reel[]> => {
  const { data, error } = await supabase
    .from('instagram_reels')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) {
    console.error('fetchActiveReels error:', error);
    return [];
  }
  return (data || []).map(mapReel);
};

export const fetchAllReels = async (): Promise<Reel[]> => {
  const { data, error } = await supabase.from('instagram_reels').select('*').order('sort_order');
  if (error) throw error;
  return (data || []).map(mapReel);
};

// Reels autoplay for every visitor, so size is direct Storage egress.
export const MAX_REEL_BYTES = 3 * 1024 * 1024; // 3 MB

// Uploads a video file to the 'reels' storage bucket and records it. When
// `sortOrder` is given (e.g. replacing a reel), the new row takes that exact
// slot position instead of being appended at the end.
export const addReel = async (file: File, href?: string, sortOrder?: number) => {
  if (file.size > MAX_REEL_BYTES) {
    throw new Error(`Video is larger than ${MAX_REEL_BYTES / (1024 * 1024)} MB. Please compress it (720p) and upload a smaller file.`);
  }
  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const path = `reel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage.from('reels').upload(path, file, {
    cacheControl: '31536000', // unique filename per upload, so safe to cache for a year
    contentType: file.type || 'video/mp4',
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from('reels').getPublicUrl(path);

  let order = sortOrder;
  if (order === undefined) {
    // Append after the current highest sort_order.
    const { data: existing } = await supabase
      .from('instagram_reels')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);
    order = (existing?.[0]?.sort_order ?? -1) + 1;
  }

  const { error: insErr } = await supabase.from('instagram_reels').insert({
    video_url: pub.publicUrl,
    href: href || null,
    sort_order: order,
    is_active: true,
  });
  if (insErr) throw insErr;
};

export const deleteReel = async (reel: Reel) => {
  // Remove the stored file too (best-effort — the row is the source of truth).
  try {
    const marker = '/reels/';
    const idx = reel.videoUrl.indexOf(marker);
    if (idx !== -1) {
      const path = reel.videoUrl.slice(idx + marker.length).split('?')[0];
      await supabase.storage.from('reels').remove([path]);
    }
  } catch (err) {
    console.warn('Could not remove reel file from storage:', err);
  }
  const { error } = await supabase.from('instagram_reels').delete().eq('id', reel.id);
  if (error) throw error;
};

// ============================
// WHOLESALE (separate simple inventory + billing)
// ============================
export interface WholesaleItem {
  id: string;
  code?: string | null;
  company?: string | null;
  color?: string | null;
  createdAt?: string;
}

export interface WholesaleOrderItem {
  name: string;      // pre-rendered code/name/both label
  itemId?: string | null;
  size?: string | null;
  quantity: number;
  price: number;     // per unit
  amount: number;    // line total
}

export interface WholesaleOrder {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  amountReceived?: number;
  paymentMethod?: string | null;
  createdAt: string;
  items: WholesaleOrderItem[];
}

export const fetchWholesaleItems = async (): Promise<WholesaleItem[]> => {
  const { data, error } = await supabase.from('wholesale_items').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    code: r.code,
    company: r.company,
    color: r.color,
    createdAt: r.created_at,
  }));
};

export const upsertWholesaleItem = async (item: Partial<WholesaleItem>) => {
  const { error } = await supabase.from('wholesale_items').upsert({
    id: item.id,
    code: item.code || null,
    company: item.company || null,
    color: item.color || null,
  });
  if (error) throw error;
};

export const deleteWholesaleItem = async (id: string) => {
  const { error } = await supabase.from('wholesale_items').delete().eq('id', id);
  if (error) throw error;
};

export const insertWholesaleOrder = async (order: WholesaleOrder) => {
  const { error: oErr } = await supabase.from('wholesale_orders').insert({
    id: order.id,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_gstin: order.customerGstin ?? null,
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    amount_received: order.amountReceived,
    payment_method: order.paymentMethod ?? null,
  });
  if (oErr) throw oErr;

  if (order.items.length > 0) {
    const { error: iErr } = await supabase.from('wholesale_order_items').insert(
      order.items.map((it, i) => ({
        order_id: order.id,
        item_id: it.itemId || null,
        name: it.name,
        size: it.size || null,
        quantity: it.quantity,
        price: it.price,
        amount: it.amount,
        sort_order: i,
      })),
    );
    if (iErr) throw iErr;
  }
};

export const fetchWholesaleOrders = async (): Promise<WholesaleOrder[]> => {
  const { data, error } = await supabase
    .from('wholesale_orders')
    .select('*, wholesale_order_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((o: any) => ({
    id: o.id,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerGstin: o.customer_gstin,
    subtotal: o.subtotal,
    discount: o.discount,
    total: o.total,
    amountReceived: o.amount_received,
    paymentMethod: o.payment_method,
    createdAt: o.created_at,
    items: (o.wholesale_order_items || [])
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((i: any) => ({
        name: i.name,
        itemId: i.item_id,
        size: i.size,
        quantity: i.quantity,
        price: i.price,
        amount: i.amount,
      })),
  }));
};

export const deleteWholesaleOrder = async (id: string) => {
  // wholesale_order_items rows go with it (ON DELETE CASCADE).
  const { error } = await supabase.from('wholesale_orders').delete().eq('id', id);
  if (error) throw error;
};

export const generateWholesaleInvoiceId = (): string => {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  return `WS-${year}-${suffix}`;
};

// ============================
// SITE SETTINGS — admin-editable storefront copy (served by /api/settings/delivery)
// ============================
// Delivery estimate + instructions shown on the landing page and on every
// product page. Falls back to these defaults until the admin saves their own
// (or if the site_settings table hasn't been created yet).
export interface DeliveryInfo {
  landingText: string;     // landing-page "Fast Delivery" blurb, e.g. the delivery date/estimate
  productLines: string[];  // bullet lines under "Delivery & Returns" on every product page
}

export const DEFAULT_DELIVERY_INFO: DeliveryInfo = {
  landingText: 'Quick and reliable shipping across India. Get your order within 3–5 days.',
  productLines: [
    'Express Delivery: 1-2 business days (₹500)',
    'Standard Delivery: 3-5 business days (Free over ₹20,000)',
    'International Delivery: 7-10 business days',
  ],
};

// `fresh` is for the admin editor: it must never see a cached copy, or a second
// save could write old values back over the first.
export const fetchDeliveryInfo = async (opts?: { fresh?: boolean }): Promise<DeliveryInfo> => {
  try {
    const res = await fetch(opts?.fresh ? '/api/settings/delivery?fresh=1' : '/api/settings/delivery', opts?.fresh ? { cache: 'no-store' } : undefined);
    const v = (await res.json()) as Partial<DeliveryInfo> | null;
    if (!res.ok || !v) return DEFAULT_DELIVERY_INFO;
    return {
      landingText: v.landingText?.trim() || DEFAULT_DELIVERY_INFO.landingText,
      productLines: Array.isArray(v.productLines) && v.productLines.length > 0 ? v.productLines : DEFAULT_DELIVERY_INFO.productLines,
    };
  } catch {
    return DEFAULT_DELIVERY_INFO;
  }
};

export const saveDeliveryInfo = async (info: DeliveryInfo) => {
  const res = await fetch('/api/settings/delivery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(info),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `Save failed (${res.status})`);
  }
};

// ============================
// GST SETTINGS — admin-editable, display-only (served by /api/settings/gst)
// ============================
// Controls whether the business GSTIN is printed on invoices, and what that
// number is. Stored as a small JSON file in the 'images' bucket (same approach
// as delivery info — no extra table). Disabled with a blank number until the
// admin turns it on, so existing invoices are untouched. This is GSTIN display
// only; it does not change any amount. A future tax rate could be added here.
export interface GstInfo {
  retailEnabled: boolean;      // print GSTIN on retail (POS / online) invoices
  wholesaleEnabled: boolean;   // print GSTIN on wholesale invoices
  gstin: string;               // the business GST number
}

export const DEFAULT_GST_INFO: GstInfo = {
  retailEnabled: false,
  wholesaleEnabled: false,
  gstin: '',
};

export const fetchGstInfo = async (opts?: { fresh?: boolean }): Promise<GstInfo> => {
  try {
    const res = await fetch(opts?.fresh ? '/api/settings/gst?fresh=1' : '/api/settings/gst', opts?.fresh ? { cache: 'no-store' } : undefined);
    const v = (await res.json()) as Partial<GstInfo> | null;
    if (!res.ok || !v) return DEFAULT_GST_INFO;
    return {
      retailEnabled: !!v.retailEnabled,
      wholesaleEnabled: !!v.wholesaleEnabled,
      gstin: typeof v.gstin === 'string' ? v.gstin.trim() : '',
    };
  } catch {
    return DEFAULT_GST_INFO;
  }
};

export const saveGstInfo = async (info: GstInfo) => {
  const res = await fetch('/api/settings/gst', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(info),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `Save failed (${res.status})`);
  }
};
