// The "Shop By Category" cards on the landing page. Each card's photo can be
// replaced from the admin (Category Photos). Until a photo is uploaded the built-in
// default below is used, so the page never has an empty card.
//
// There is no infants slot: the store does not sell infant wear. Each slot names
// the department it belongs to, which supplies the card's age range at runtime
// and the filter the card opens.
//
// Safe to import from both server and client code (no server-only imports here).

export type CategorySlotKey = 'toddlers' | 'kids' | 'teens';

export interface CategorySlot {
  key: CategorySlotKey;
  /** Department this card represents — supplies its age range and its filter. */
  department: string;
  /** Shown until the department's own range loads. */
  title: string;
  desc: string;
  bgColor: string;
  defaultImage: string;
  position: string; // object-position class used for the default photo
}

export const CATEGORY_SLOTS: CategorySlot[] = [
  { key: 'toddlers', department: 'Toddlers', title: 'Toddlers (1–5)', desc: 'Playful sets & combos', bgColor: 'bg-[#FCD3E1]', defaultImage: '/looks/toddler_girl_grass.jpg', position: 'object-top' },
  { key: 'kids', department: 'Kids', title: 'Kids (6–12)', desc: 'Cool & comfy everyday', bgColor: 'bg-[#D3EAFC]', defaultImage: '/looks/look_6.jpg', position: 'object-top' },
  { key: 'teens', department: 'Teens', title: 'Teens (13–16)', desc: 'Trendy fits, their style', bgColor: 'bg-[#FCEFD3]', defaultImage: '/looks/look_cargo.jpg', position: 'object-[center_15%]' },
];

// slot -> public URL of the admin-uploaded photo. A missing key means "use the default".
export type CategoryImageMap = Partial<Record<CategorySlotKey, string>>;

export const isCategorySlotKey = (v: unknown): v is CategorySlotKey =>
  typeof v === 'string' && CATEGORY_SLOTS.some((s) => s.key === v);

// Card shape on the storefront is aspect-[3/4] (portrait). Uploads are cropped to
// exactly this ratio so what the admin previews is what the shopper sees.
export const CATEGORY_IMAGE_SPEC = {
  ratioW: 3,
  ratioH: 4,
  recommendedW: 1200,
  recommendedH: 1600,
  minW: 600,
  minH: 800,
  maxInputBytes: 10 * 1024 * 1024, // picked file, before the browser shrinks it
  maxUploadBytes: 4 * 1024 * 1024, // what the API accepts (after shrinking)
} as const;

export const CATEGORY_IMAGES_ENDPOINT = '/api/settings/category-images';

export const fetchCategoryImages = async (): Promise<CategoryImageMap> => {
  try {
    const res = await fetch(CATEGORY_IMAGES_ENDPOINT, { cache: 'no-store' });
    const v = await res.json();
    return res.ok && v && typeof v === 'object' ? (v as CategoryImageMap) : {};
  } catch {
    return {};
  }
};
