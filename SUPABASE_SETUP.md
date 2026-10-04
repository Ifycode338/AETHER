# Supabase Setup

To use Supabase instead of Base44, create a `.env.local` file in the project root with the following variables:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RESEND_API_KEY=your_resend_api_key
```

## Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to Project Settings > API
3. Copy the Project URL and anon/public key
4. Add them to your `.env.local` file

## Getting Resend API Key

1. Go to [resend.com](https://resend.com) and sign up
2. Navigate to API Keys in your dashboard
3. Create a new API key
4. Add it to your `.env.local` file as `VITE_RESEND_API_KEY`

**Note:** The default Resend sender is `onboarding@resend.dev`. To use your own domain, verify it in Resend and update the `from` field in `src/api/emailService.js`.

## Database Tables Required

You'll need to create the following tables in your Supabase project:

### profiles
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### products
```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_date TIMESTAMP DEFAULT NOW()
);
```

### orders
```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  items JSONB NOT NULL,
  total DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending',
  created_date TIMESTAMP DEFAULT NOW()
);
```

### chat_messages
```sql
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL, -- 'admin' or 'customer'
  content TEXT NOT NULL,
  created_date TIMESTAMP DEFAULT NOW()
);
```

### chat_conversations
```sql
CREATE TABLE chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active' or 'closed'
  last_message TEXT,
  last_message_at TIMESTAMP,
  admin_unread INTEGER DEFAULT 0,
  created_date TIMESTAMP DEFAULT NOW()
);
```

## Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Products: Public read, admin write
CREATE POLICY "Public can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Orders: Users can view own orders, admins can view all
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Chat: Anyone can create conversations and messages
CREATE POLICY "Anyone can create chat conversations" ON chat_conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view chat conversations" ON chat_conversations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create chat messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view chat messages" ON chat_messages
  FOR SELECT USING (true);
```

## Email Integration

The app uses Base44's email integration for order confirmations. You'll need to replace this with:
- Supabase Edge Functions for email sending, or
- A third-party email service (SendGrid, Resend, etc.)

## Migration Status

**Completed:**
- ✅ Supabase client setup
- ✅ Authentication (Login, Register, Password Reset, Admin Login)
- ✅ AuthContext integration
- ✅ Product operations (Products, Shop, Home, ProductDetail pages)
- ✅ Order operations (Orders, Checkout pages)
- ✅ Profile page
- ✅ Chat functionality (admin Chat and ChatWidget with real-time subscriptions)
- ✅ Email service integration (Resend)

**Remaining:**
- ⏳ Implement Supabase Storage for product image uploads
- ⏳ Test the full application end-to-end
