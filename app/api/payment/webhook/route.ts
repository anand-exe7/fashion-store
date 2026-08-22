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

    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

    // Constant-time comparison to avoid signature timing attacks.
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return new Response('Forbidden', { status: 403 });
    }

    const payloadObj = JSON.parse(body);
    const { event, payload } = payloadObj;

    if (event === 'payment.captured') {
      const p = payload.payment.entity;

      // Load the order this payment claims to belong to.
      const { data: order } = await adminSupabase
        .from('orders')
        .select('id, customer_email, total, status, coupon_code')
        .eq('razorpay_order_id', p.order_id)
        .single();

      if (!order) {
        console.error('Webhook: no order found for razorpay_order_id', p.order_id);
        return Response.json({ ok: true });
      }

      // Idempotency — webhooks are retried; do nothing if already settled.
      if (order.status === 'completed') {
        return Response.json({ ok: true });
      }

      // Verify the captured amount equals the authoritative order total.
      const expectedPaise = Number(order.total) * 100;
      if (Number(p.amount) !== expectedPaise) {
        console.error(
          `Webhook: amount mismatch for ${order.id}. expected ${expectedPaise} paise, got ${p.amount}`,
        );
        // Record the payment but flag it for manual review — do NOT complete.
        await adminSupabase
          .from('orders')
          .update({
            status: 'processing',
            razorpay_payment_id: p.id,
            amount_received: Number(p.amount) / 100,
          })
          .eq('id', order.id)
          .eq('status', 'pending');
        return Response.json({ ok: true });
      }

      // Complete only if still pending (atomic guard against concurrent retries).
      const { data: updated } = await adminSupabase
        .from('orders')
        .update({
          status: 'completed',
          razorpay_payment_id: p.id,
          amount_received: Number(p.amount) / 100,
        })
        .eq('id', order.id)
        .eq('status', 'pending')
        .select('id, customer_email')
        .single();

      // `updated` is only set when this call is the one that flipped the row,
      // guaranteeing the coupon is consumed and the email sent exactly once.
      if (updated) {
        if (order.coupon_code) {
          const { data: c } = await adminSupabase
            .from('coupons')
            .select('used')
            .eq('code', order.coupon_code)
            .single();
          if (c) {
            await adminSupabase
              .from('coupons')
              .update({ used: (c.used || 0) + 1 })
              .eq('code', order.coupon_code);
          }
        }
        if (updated.customer_email) {
          await sendOrderConfirmationEmail(updated.id, updated.customer_email);
        }
      }
    }

    return Response.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 500 });
  }
}
