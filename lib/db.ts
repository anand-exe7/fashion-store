import { createClient } from './supabase/client';

const supabase = createClient();

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
  weightGrams?: number;
  image?: string; // Legacy
  isNew?: boolean;
  discountLabel?: string;
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
  source: 'online' | 'offline';
  subtotal: number;
  discount: number;
  couponCode?: string;
  delivery: number;
  total: number;
  amountReceived?: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
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
// PRODUCTS
// ============================
export const fetchProducts = async (): Promise<Product[]> => {
  const [
    { data: products, error: pError },
    { data: images, error: iError },
    { data: variants, error: vError },
  ] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('product_images').select('*').order('sort_order'),
    supabase.from('product_variants').select('*').order('sort_order'),
  ]);

  if (pError) throw pError;

  return (products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    image: p.image,
    isNew: p.is_new,
    discountLabel: p.discount_label,
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
        isAvailable: v.is_available,
        sortOrder: v.sort_order,
      })),
  }));
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  const [
    { data: p, error: pError },
    { data: images },
    { data: variants },
  ] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
    supabase.from('product_variants').select('*').eq('product_id', id).order('sort_order'),
  ]);

  if (pError || !p) return null;

  return {
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    image: p.image,
    isNew: p.is_new,
    discountLabel: p.discount_label,
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
      isAvailable: v.is_available,
      sortOrder: v.sort_order,
    })),
  };
};

export const upsertProduct = async (product: Partial<Product>, images?: string[], variants?: any[]) => {
  // Auto-create category if it doesn't exist to prevent Foreign Key errors
  if (product.category) {
    await supabase.from('categories').upsert({ name: product.category }).select();
  }

  const { error } = await supabase.from('products').upsert({
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    weight_grams: product.weightGrams,
    image: product.image,
    is_new: product.isNew,
    discount_label: product.discountLabel,
    is_available: product.isAvailable ?? true,
  });
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

  if (variants && variants.length > 0 && product.id) {
    await supabase.from('product_variants').delete().eq('product_id', product.id);
    await supabase.from('product_variants').insert(
      variants.map((v, i) => ({
        product_id: product.id,
        size: v.size || 'Default',
        color_name: v.colorName || null,
        price: v.price || null,
        weight_grams: v.weightGrams || product.weightGrams || 0,
        stock: v.stock || 0,
        is_available: v.isAvailable !== false,
        sort_order: i
      }))
    );
  }
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
};

export const updateProductVariant = async (variantId: string, patch: Partial<ProductVariant>) => {
  const payload: any = {};
  if (patch.stock !== undefined) payload.stock = patch.stock;
  if (patch.price !== undefined) payload.price = patch.price;
  if (patch.weightGrams !== undefined) payload.weight_grams = patch.weightGrams;
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
    razorpayOrderId: o.razorpay_order_id,
    razorpayPaymentId: o.razorpay_payment_id,
    createdAt: o.created_at,
    items: (o.order_items || []).map((i: any) => ({
      id: i.id,
      productId: i.product_id,
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
    razorpayOrderId: o.razorpay_order_id,
    razorpayPaymentId: o.razorpay_payment_id,
    createdAt: o.created_at,
    items: (o.order_items || []).map((i: any) => ({
      id: i.id,
      productId: i.product_id,
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
    const { error: iError } = await supabase.from('order_items').insert(items);
    if (iError) throw iError;
  }
};

export const updateOrderStatus = async (id: string, status: string) => {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
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
