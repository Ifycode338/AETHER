# Order Tracking & Email Notifications Documentation

## Overview

This document outlines the real-time order tracking and email notification system implemented in the BennyCare/AETHER application.

---

## 1. Real-Time Order Status Updates ✅

**Location:** `src/pages/OrderTracking.jsx`

### Features:
- **Supabase Realtime Subscription** - Listens for order status changes
- **Automatic UI Updates** - Updates tracking page without refresh
- **Toast Notifications** - Shows notification when status changes
- **Status Timeline** - Visual progress indicator with icons
- **Live Status Badges** - Shows current status prominently

### Implementation:
```jsx
// Realtime subscription for order updates
const channel = supabase
  .channel(`order_tracking_${id}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${id}`
  }, (payload) => {
    if (payload.new) {
      setOrder(payload.new);
      // Show notification when status changes
      toast.success(`Order status updated to: ${statusLabels[newStatus]}`);
    }
  })
  .subscribe();
```

### Status Flow:
1. User opens order tracking page
2. Supabase establishes realtime connection
3. Admin updates order status
4. Database triggers notification
5. UI updates automatically
6. Toast notification appears
7. Timeline updates without refresh

### Supported Statuses:
- **Pending** - Order placed
- **Processing** - Being prepared
- **Shipped** - On the way
- **Delivered** - Arrived
- **Cancelled** - Order cancelled

### Benefits:
- No page refresh needed
- Instant status updates
- Better user experience
- Reduced server load
- Real-time engagement

---

## 2. Email Notifications - Order Confirmations ✅

**Location:** `src/lib/emailService.js`, `src/pages/Checkout.jsx`

### Features:
- **Automatic Order Confirmation** - Email sent immediately after successful payment
- **Professional HTML Templates** - Branded email design
- **Order Details Included** - Order ID, items, total, shipping address
- **Track Order Button** - Direct link to order tracking page
- **Non-Blocking** - Order completes even if email fails

### Email Template Contents:
- **Header** - "Order Confirmed! 🎉" with BennyCare branding
- **Customer Greeting** - Personalized with customer name
- **Order Details** - Order ID, date, total amount
- **Order Items** - List of all items with quantities and prices
- **Shipping Address** - Customer's delivery address
- **Call-to-Action** - "Track Your Order" button
- **Footer** - Contact information and copyright

### Implementation:
```jsx
// In Checkout.jsx
await sendOrderConfirmationEmail({
  ...order,
  customer_name: form.customer_name,
  customer_email: form.customer_email,
  customer_address: form.customer_address,
});
```

### Email Service Configuration:
```javascript
// Using Resend API
const resend = new Resend('re_GChnpzpi_LKjUh9Drf6zpqRRTKmK8S33D');

const data = await resend.emails.send({
  from: 'BennyCare <noreply@bennycare.com>',
  to: orderData.customer_email,
  subject: `Order Confirmation - Order #${orderData.id}`,
  html: emailTemplate,
});
```

### When Emails Are Sent:
- Immediately after successful Paystack payment
- Non-blocking (order completes even if email fails)
- Logs success/failure to console

---

## 3. Email Notifications - Shipping Updates ✅

**Location:** `src/lib/emailService.js`, `src/pages/admin/Orders.jsx`

### Features:
- **Automatic Shipping Updates** - Email sent when admin updates status
- **Status-Specific Notifications** - Email content matches new status
- **Customer Name Personalization** - Addresses customer by name
- **Order Status Badge** - Visual status indicator in email
- **Track Order Button** - Direct link to order tracking page

### Email Template Contents:
- **Header** - "Order Status Update 📦" with BennyCare branding
- **Customer Greeting** - Personalized with customer name
- **Status Badge** - Visual status indicator (Processing, Shipped, Delivered)
- **Order Details** - Order ID, updated timestamp
- **Call-to-Action** - "Track Your Order" button
- **Footer** - Contact information and copyright

### Implementation:
```jsx
// In Orders.jsx (admin panel)
await sendShippingUpdateEmail({
  ...order,
  customer_name: order.customer_name,
  customer_email: order.customer_email,
});
```

### When Emails Are Sent:
- When admin changes order status from Pending → Processing
- When admin changes order status from Processing → Shipped
- When admin changes order status from Shipped → Delivered
- When admin changes order status to Cancelled
- Non-blocking (status update completes even if email fails)

### Status Labels:
- **Pending** → "Order Placed"
- **Processing** → "Processing"
- **Shipped** → "Shipped"
- **Delivered** → "Delivered"
- **Cancelled** → "Cancelled"

---

## 4. Database Trigger for Order Status Changes ✅

**Location:** `create_order_status_trigger.sql`

### Features:
- **Automatic Logging** - Logs all status changes
- **Order Status History** - Complete audit trail
- **Status Change Tracking** - Records old and new status
- **Timestamp** - Records when change occurred

### SQL Implementation:
```sql
CREATE TABLE IF NOT EXISTS order_status_log (
  id SERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER on_order_status_update
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_status_update();
```

### Benefits:
- Complete audit trail
- Debugging support
- Compliance ready
- Status history available

---

## 5. Password Reset Email ✅

**Location:** `src/lib/emailService.js`

### Features:
- **Automatic Password Reset Email** - Sent when user requests reset
- **Secure Reset Link** - Direct link to reset page
- **Professional Template** - Consistent branding
- **Expiration Warning** - Reminds user to use link quickly

### When Sent:
- User clicks "Forgot Password" on login page
- User enters email address
- Email contains secure reset link

---

## Configuration Required

### Resend API Configuration:

1. **API Key Already Configured:**
   - Currently using: `re_GChnpzpi_LKjUh9Drf6zpqRRTKmK8S33D`
   - This is in your `.env.local` file

2. **Verify in Resend Dashboard:**
   - Go to [resend.com](https://resend.com)
   - Check API key is active
   - Verify domain is verified
   - Check email sending limits

3. **Configure Email Domain:**
   - Add your domain to Resend
   - Verify domain ownership
   - Set up SPF/DKIM records
   - This ensures emails don't go to spam

### Supabase Realtime Configuration:

1. **Enable Realtime:**
   - Go to Supabase project dashboard
   - Navigate to Database → Replication
   - Enable Realtime for your tables
   - Add `orders` table to replication

2. **Run SQL Migration:**
   ```sql
   -- File: create_order_status_trigger.sql
   -- Run this in Supabase SQL Editor
   ```

---

## How It Works

### Order Placement Flow:
```
User completes checkout → Paystack payment success → 
Order created in database → 
Order confirmation email sent → 
User redirected to order receipt
```

### Order Status Update Flow:
```
Admin updates order status → 
Database trigger fires → 
Status logged in order_status_log → 
Shipping update email sent → 
Realtime notification sent to tracking page → 
User sees toast notification → 
Tracking page updates automatically
```

### Real-Time Tracking Flow:
```
User opens tracking page → 
Supabase realtime subscription established → 
Admin updates status → 
Database notifies subscribed client → 
UI updates automatically → 
Toast notification appears
```

---

## Testing

### Test Order Confirmation Email:
1. Add items to cart
2. Complete checkout
3. Make payment
4. Check email inbox for confirmation

### Test Shipping Update Email:
1. Go to admin panel
2. Navigate to Orders
3. Change order status (e.g., from Pending to Processing)
4. Check customer's email inbox
5. Verify email content and tracking link

### Test Real-Time Tracking:
1. Place an order
2. Open order tracking page
3. In admin panel, change order status
4. Watch tracking page update automatically
5. Toast notification should appear

---

## Troubleshooting

### Emails Not Sending:
1. Check Resend API key is valid
2. Verify domain is verified in Resend
3. Check email sending limits
4. Check console for error logs
5. Verify recipient email is correct

### Real-Time Updates Not Working:
1. Verify Supabase Realtime is enabled
2. Check orders table is in replication
3. Check browser console for connection errors
4. Verify order ID is correct
5. Check network connectivity

### SQL Trigger Not Firing:
1. Run the SQL migration
2. Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_order_status_update'`
3. Check table name matches
4. Verify function exists

---

## Email Templates Customization

### Customize Order Confirmation:
Edit `ORDER_CONFIRMATION_TEMPLATE` in `src/lib/emailService.js`:
- Change colors and branding
- Add company logo
- Modify content sections
- Add custom footer

### Customize Shipping Update:
Edit `SHIPPING_UPDATE_TEMPLATE` in `src/lib/emailService.js`:
- Update status labels
- Add estimated delivery dates
- Add tracking number field
- Add custom messages per status

---

## Production Considerations

### Email Domain:
- Use your custom domain (e.g., @bennycare.com)
- Verify domain ownership
- Set up SPF, DKIM, DMARC records
- Monitor deliverability

### Resend Configuration:
- Set up DKIM for domain
- Configure bounce handling
- Set up webhook for bounces
- Monitor sending reputation

### Rate Limiting:
- Resend has rate limits
- Consider queue for bulk emails
- Implement retry logic
- Monitor sending stats

---

## Analytics & Monitoring

### Email Metrics:
- Track email open rates
- Track click-through rates
- Monitor bounce rates
- Track delivery times

### Order Status Analytics:
- Track status change frequency
- Monitor email send success rate
- Track notification failures
- Identify common issues

---

## Future Enhancements

### Advanced Email Features:
- **SMS Notifications** - Add SMS for shipping updates
- **Push Notifications** - Browser push for order updates
- **WhatsApp Notifications** - WhatsApp integration
- **Email Templates per Status** - Custom content per status

### Enhanced Tracking:
- **Real-Time Location Tracking** - GPS tracking for shipments
- **ETA Updates** - Estimated delivery time
- **Carrier Integration** - Direct carrier tracking
- **Multiple Channels** - Track across carriers

### Automation:
- **Automated Status Updates** - Based on time or location
- **Reminder Emails** - Payment reminders, abandoned cart
- **Review Requests** - Automatic review requests after delivery
- **Reorder Emails** - Suggest reordering after time

---

## Security Considerations

### Email Security:
- Never send sensitive data in emails
- Use secure links with expiration
- Validate email addresses
- Prevent email enumeration

### API Security:
- Keep Resend API key secret
- Use environment variables
- Rotate API keys regularly
- Monitor API usage

### Rate Limiting:
- Resend has built-in rate limits
- Implement client-side rate limiting
- Queue bulk operations
- Monitor sending patterns

---

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Email Best Practices](https://www.mailchimp.com/resources/email-design-guide/)
- [Transactional Email Design](https://www.sendgrid.com/blog/transactional-email-design/)
