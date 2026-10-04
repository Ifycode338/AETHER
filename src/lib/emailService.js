import { Resend } from 'resend';

// Initialize Resend with API key from .env.local
const resend = new Resend('re_GChnpzpi_LKjUh9Drf6zpqRRTKmK8S33D');

// Email templates
const ORDER_CONFIRMATION_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #22C55E 0%, #16a34a 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .total { font-weight: bold; font-size: 18px; color: #22C55E; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    .button { display: inline-block; background: #22C55E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed! 🎉</h1>
      <p>Thank you for shopping with BennyCare</p>
    </div>
    <div class="content">
      <p>Hi {{customer_name}},</p>
      <p>Your order has been successfully placed and is being processed.</p>
      
      <div class="order-details">
        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> {{order_id}}</p>
        <p><strong>Order Date:</strong> {{order_date}}</p>
        <p><strong>Total:</strong> ₦{{total}}</p>
      </div>
      
      <div class="order-details">
        <h2>Order Items</h2>
        {{items_html}}
      </div>
      
      <div class="order-details">
        <h2>Shipping Address</h2>
        <p>{{shipping_address}}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="{{tracking_url}}" class="button">Track Your Order</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2026 BennyCare. All rights reserved.</p>
      <p>Need help? Contact us at support@bennycare.com</p>
    </div>
  </div>
</body>
</html>
`;

const SHIPPING_UPDATE_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #22C55E 0%, #16a34a 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .status-badge { display: inline-block; background: #22C55E; color: white; padding: 8px 16px; border-radius: 20px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    .button { display: inline-block; background: #22C55E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Status Update 📦</h1>
      <p>Your order is on its way!</p>
    </div>
    <div class="content">
      <p>Hi {{customer_name}},</p>
      <p>Great news! Your order status has been updated.</p>
      
      <div class="status-badge">
        Status: {{status}}
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> {{order_id}}</p>
        <p><strong>Updated At:</strong> {{updated_at}}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="{{tracking_url}}" class="button">Track Your Order</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2026 BennyCare. All rights reserved.</p>
      <p>Need help? Contact us at support@bennycare.com</p>
    </div>
  </div>
</body>
</html>
`;

export async function sendOrderConfirmationEmail(orderData) {
  try {
    const itemsHtml = orderData.items.map(item => `
      <div class="item">
        <p><strong>${item.product_name}</strong></p>
        <p>Quantity: ${item.quantity} × ₦${item.price.toFixed(2)}</p>
      </div>
    `).join('');

    const html = ORDER_CONFIRMATION_TEMPLATE
      .replace('{{customer_name}}', orderData.customer_name)
      .replace('{{order_id}}', orderData.id)
      .replace('{{order_date}}', new Date(orderData.created_date).toLocaleString())
      .replace('{{total}}', orderData.total.toFixed(2))
      .replace('{{items_html}}', itemsHtml)
      .replace('{{shipping_address}}', orderData.customer_address)
      .replace('{{tracking_url}}', `${window.location.origin}/track/${orderData.id}`);

    const data = await resend.emails.send({
      from: 'BennyCare <noreply@bennycare.com>',
      to: orderData.customer_email,
      subject: `Order Confirmation - Order #${orderData.id}`,
      html,
    });

    console.log('Order confirmation email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendShippingUpdateEmail(orderData) {
  try {
    const statusLabels = {
      pending: 'Order Placed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };

    const html = SHIPPING_UPDATE_TEMPLATE
      .replace('{{customer_name}}', orderData.customer_name)
      .replace('{{order_id}}', orderData.id)
      .replace('{{status}}', statusLabels[orderData.status] || orderData.status)
      .replace('{{updated_at}}', new Date().toLocaleString())
      .replace('{{tracking_url}}', `${window.location.origin}/track/${orderData.id}`);

    const data = await resend.emails.send({
      from: 'BennyCare <noreply@bennycare.com>',
      to: orderData.customer_email,
      subject: `Order Status Update - Order #${orderData.id}`,
      html,
    });

    console.log('Shipping update email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending shipping update email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail(email, resetLink) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22C55E 0%, #16a34a 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .button { display: inline-block; background: #22C55E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p style="margin-top: 20px; color: #666;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: 'BennyCare <noreply@bennycare.com>',
      to: email,
      subject: 'Reset Your Password',
      html,
    });

    console.log('Password reset email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}
