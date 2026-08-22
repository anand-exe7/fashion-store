import Razorpay from 'razorpay';
import { adminSupabase } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { priceCheckout, persistPendingOrder } from '@/lib/server/checkout';

export async function POST(req: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      // Fail loudly instead of silently constructing a broken client.
      console.error('Razorpay keys are not configured');
      return Response.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    // Checkout is gated behind login (see middleware) — require a session.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const checkoutInput = {
      items: body.items,
      couponCode: body.couponCode,
      regionId: body.regionId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      // Anchor the email to the authenticated user when not supplied.
      customerEmail: (body.customerEmail || user.email || '').trim(),
      customerAddress: body.customerAddress,
    };

    // Authoritative pricing — client-supplied amounts are ignored entirely.
    const priced = await priceCheckout(checkoutInput);
    if (priced.total <= 0) {
      return Response.json({ error: 'Invalid order total' }, { status: 400 });
    }

    await persistPendingOrder(priced, checkoutInput);

    const rp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const rpOrder = await rp.orders.create({
      amount: priced.total * 100,
      currency: 'INR',
      receipt: priced.invoiceId,
      notes: { orderId: priced.invoiceId },
    });

    await adminSupabase
      .from('orders')
      .update({ razorpay_order_id: rpOrder.id })
      .eq('id', priced.invoiceId);

    return Response.json({
      rpOrderId: rpOrder.id,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      invoiceId: priced.invoiceId,
      amount: priced.total * 100,
    });
  } catch (error: any) {
    // Log details server-side; return a generic message to the client.
    console.error('Razorpay Order Creation Failed:', error);
    const clientMessage =
      typeof error?.message === 'string' &&
      /cart|product|available|order total/i.test(error.message)
        ? error.message
        : 'Payment initiation failed';
    return Response.json({ error: clientMessage }, { status: 400 });
  }
}
