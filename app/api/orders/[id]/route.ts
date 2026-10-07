import { adminSupabase } from '@/lib/supabase/admin';

// Returns a single order by its exact (unguessable) invoice ID.
// Replaces direct anon-key reads of the orders table, so the table is
// no longer enumerable while shareable invoice links keep working.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  // Wholesale bills use a 'WS-' prefix and live in their own tables. Serve them
  // in the same Order shape so the shared invoice page renders them unchanged.
  if (id.startsWith('WS-')) {
    const { data: w, error: wErr } = await adminSupabase
      .from('wholesale_orders')
      .select('*, wholesale_order_items(*)')
      .eq('id', id)
      .single();
    if (wErr || !w) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    const items = (w.wholesale_order_items || [])
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((i: any) => ({
        id: i.id,
        name: i.name,
        size: i.size,
        color: null,
        quantity: i.quantity,
        price: i.price,
      }));
    return Response.json({
      id: w.id,
      customerName: w.customer_name,
      customerPhone: w.customer_phone,
      customerEmail: null,
      customerAddress: null,
      customerGstin: w.customer_gstin ?? null,
      source: 'wholesale',
      subtotal: w.subtotal,
      discount: w.discount,
      couponCode: null,
      delivery: 0,
      total: w.total,
      amountReceived: w.amount_received,
      paymentMethod: w.payment_method,
      status: 'completed',
      createdAt: w.created_at,
      items,
    });
  }

  const { data: o, error } = await adminSupabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single();

  if (error || !o) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({
    id: o.id,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerEmail: o.customer_email,
    customerAddress: o.customer_address,
    customerGstin: null,
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
  });
}
