// utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Customer {
  id: string;
  email: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  status: string;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  items_count: number;
  bundle_free_count: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_type: string;
  title: string;
  unit_price_cents: number;
  is_free: boolean;
}

export interface PurchasedEbook {
  product_id: string;
  title: string;
  purchase_date: string;
}