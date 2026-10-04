// TypeScript Type Definitions for BennyCare App

// User & Auth Types
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    display_name?: string;
  };
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  is_deleted?: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at?: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url?: string;
  video_url?: string;
  active: boolean;
  featured: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  product_id: string;
  product: Product;
  quantity: number;
}

// Order Types
export interface Order {
  id: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  subtotal: number;
  shipping_rate: number;
  discount_code?: string;
  discount_amount: number;
  total: number;
  status: 'paid' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_reference?: string;
  created_date: string;
  updated_at?: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'order' | 'new_order' | 'low_stock' | 'promotion' | 'system' | 'info';
  data?: Record<string, any>;
  read: boolean;
  link?: string;
  created_at: string;
}

// Wishlist Types
export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  created_at: string;
}

// Discount Code Types
export interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  active: boolean;
  expires_at?: string;
  created_at: string;
}

// 2FA Types
export interface User2FA {
  id: string;
  user_id: string;
  secret: string;
  enabled: boolean;
  backup_codes?: string[];
  last_used_at?: string;
  created_at: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  created_at: string;
}

// Cart Types
export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  created_at: string;
  updated_at?: string;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
}

export interface CheckoutForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
}

export interface ProfileForm {
  full_name?: string;
  phone?: string;
  address?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page?: number;
  pageSize?: number;
}

// Utility Types
export type OrderStatus = Order['status'];
export type NotificationType = Notification['type'];
export type UserRole = Profile['role'];
