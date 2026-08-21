import crypto from 'crypto';
import { adminSupabase } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!sig || !secret) {
      return new Response('Missing signature or secret', { status: 400 });
    }

    const hmac = crypto.createHmac('sha256', secret)
                       .update(body).digest('hex');

    if (hmac !== sig) {
      return new Response('Forbidden', { status: 403 });
    }

    const payloadObj = JSON.parse(body);
    const { event, payload } = payloadObj;

    if (event === 'payment.captured') {
      const p = payload.payment.entity;

      const { data: order } = await adminSupabase
        .from('orders')
        .update({ status: 'completed', razorpay_payment_id: p.id, amount_received: p.amount / 100 })
        .eq('razorpay_order_id', p.order_id)
        .select('id, customer_email')
        .single();

      if (order?.customer_email) {
        await sendOrderConfirmationEmail(order.id, order.customer_email);
      }
    }

    return Response.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(`Webhook error: ${error.message}`, { status: 500 });
  }
}
