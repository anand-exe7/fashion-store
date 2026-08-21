import Razorpay from 'razorpay';
import { adminSupabase } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const rp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });

    const { orderId, amountInPaise, customerEmail, customerName } = await req.json();

    if (!orderId || !amountInPaise) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const rpOrder = await rp.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderId,
      notes: { orderId, customerEmail, customerName },
    });

    // Attach razorpay_order_id to our order record
    await adminSupabase.from('orders')
      .update({ razorpay_order_id: rpOrder.id })
      .eq('id', orderId);

    return Response.json({ rpOrderId: rpOrder.id, key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID });
  } catch (error: any) {
    console.error('Razorpay Order Creation Failed:', error);
    return Response.json({ error: error.message || 'Payment initiation failed' }, { status: 500 });
  }
}
