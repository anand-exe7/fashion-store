import { Resend } from 'resend';
import { adminSupabase } from './supabase/admin';

// Initialize Resend with the API key from environment variables (fallback for build time)
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

export async function sendOrderConfirmationEmail(orderId: string, toEmail: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Skipping email send.');
    return;
  }

  const { data: order } = await adminSupabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();

  if (!order) return;

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

  await resend.emails.send({
    from: 'Shalistone <orders@shalistone.com>', // Replace with your verified sender domain if you have one, or a sandbox address
    to: toEmail,
    subject: `Your Order ${order.id} is Confirmed!`,
    html: htmlContent,
  });
}
