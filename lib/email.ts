import { Resend } from 'resend';
import { adminSupabase } from './supabase/admin';

// Initialize Resend with the API key from environment variables (fallback for build time)
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

// The "from" address must belong to a domain verified in Resend. Configurable via
// RESEND_FROM_EMAIL so it can be changed (e.g. to onboarding@resend.dev for testing,
// or a different verified domain) without a code change.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'orders@mail.shalistone.com';

export async function sendOrderConfirmationEmail(orderId: string, toEmail: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] RESEND_API_KEY is not set. Skipping email send.');
    return { success: false, error: 'RESEND_API_KEY is not set' };
  }

  try {
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[Resend] Order not found for email confirmation:', orderId, orderError);
      return { success: false, error: orderError || 'Order not found' };
    }

    const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="text-align: center; text-transform: uppercase; letter-spacing: 2px;">Order Confirmed</h2>
      <p>Hi ${order.customer_name || 'there'},</p>
      <p>Thank you for your order! Your order <strong>${order.id}</strong> has been confirmed and is now being processed.</p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 10px; border-bottom: 1px solid #eee;">Item</th>
            <th style="text-align: center; padding-bottom: 10px; border-bottom: 1px solid #eee;">Qty</th>
            <th style="text-align: right; padding-bottom: 10px; border-bottom: 1px solid #eee;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${order.order_items.map((item: any) => `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                ${item.name}<br/>
                <span style="font-size: 12px; color: #888;">${item.color ? `Color: ${item.color} | ` : ''}Size: ${item.size || 'N/A'}</span>
              </td>
              <td style="text-align: center; padding: 10px 0; border-bottom: 1px solid #eee;">${item.quantity}</td>
              <td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #eee;">₹${item.price.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="text-align: right; margin-top: 20px;">
        <p>Subtotal: ₹${order.subtotal.toLocaleString()}</p>
        ${order.discount > 0 ? `<p style="color: green;">Discount: -₹${order.discount.toLocaleString()}</p>` : ''}
        <p>Delivery: ₹${order.delivery.toLocaleString()}</p>
        <h3 style="margin-top: 10px;">Total: ₹${order.total.toLocaleString()}</h3>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      
      <p style="text-align: center; font-size: 12px; color: #888;">
        Shalistone Fashion Store<br/>
        Thank you for shopping with us!
      </p>
    </div>
  `;

    console.log(`[Resend] Sending confirmation email for order ${order.id} to ${toEmail} from ${FROM_EMAIL}...`);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Your Order ${order.id} is Confirmed!`,
      html: htmlContent,
    });

    if (error) {
      console.error('[Resend Error] Failed to send email:', JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    console.log('[Resend Success] Email sent successfully:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('[Resend Exception] Unexpected error sending email:', err);
    return { success: false, error: err };
  }
}

