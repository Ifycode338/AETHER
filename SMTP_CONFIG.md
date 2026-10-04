# SMTP Configuration for Email Confirmation

## Best SMTP Configuration for Production

### Recommended SMTP Providers

**1. Resend (Best for developers)**
- Free tier: 3,000 emails/month
- Easy setup, excellent deliverability
- SMTP: `smtp.resend.com:587`
- Get API key at resend.com

**2. SendGrid (Industry standard)**
- Free tier: 100 emails/day
- Reliable, good analytics
- SMTP: `smtp.sendgrid.net:587`

**3. Mailgun (Good for scaling)**
- Free trial: 5,000 emails
- Powerful API and analytics
- SMTP: `smtp.mailgun.org:587`

**4. Gmail (Free, but limited)**
- Free for personal use
- 500 emails/day limit
- Requires App Password (not regular password)
- SMTP: `smtp.gmail.com:587`

### Recommended Settings for BennyCare

**Sender Details:**
- **Sender Email**: `noreply@bennycare.com` (or your domain)
- **Sender Name**: `BennyCare`

**SMTP Settings (using Gmail as example):**
- **Host**: `smtp.gmail.com`
- **Port**: `587` (TLS) or `465` (SSL)
- **Username**: Your full Gmail address (e.g., `kellyrhodesyey517@gmail.com`)
- **Password**: Gmail App Password (not regular password)
- **Minimum interval**: `60` seconds

### How to Get Gmail App Password

1. Go to Google Account: https://myaccount.google.com
2. Security > 2-Step Verification (must be enabled)
3. App passwords > Generate
4. Select "Mail" and your device
5. Copy the 16-character password
6. Use this as your SMTP password

### Configure in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Email Templates**
3. Click on **SMTP Settings**
4. Enter the recommended settings above
5. Save and test

### Customizing Email Templates

Go to **Authentication** > **Email Templates** to customize:

**Confirm Signup Template:**
```html
<h2>Welcome to BennyCare!</h2>
<p>Thank you for registering. Please confirm your email address:</p>
<a href="{{ .ConfirmationURL }}">Confirm Email</a>
<p>This link expires in 24 hours.</p>
```

### Testing

1. Register a new account
2. Check inbox (and spam folder)
3. Click confirmation link
4. Verify login works

### Troubleshooting

**Emails not sending:**
- Verify SMTP credentials are correct
- Check if 2FA is enabled (use App Password)
- Try port 465 instead of 587

**Emails going to spam:**
- Use a custom domain (not @gmail.com)
- Set up SPF, DKIM, DMARC records
- Keep email content professional
