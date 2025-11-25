import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserType = 'customer' | 'business';
export type SubscriptionType = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  user_type: UserType;
  subscription_type: SubscriptionType | null;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  created_at: string;
}

export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  category_id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  verified: boolean;
  created_at: string;
  category?: BusinessCategory;
}

export interface Review {
  id: string;
  business_id: string;
  customer_id: string;
  rating: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  customer?: Profile;
  responses?: ReviewResponse[];
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  business_id: string;
  content: string;
  created_at: string;
}

export interface Discount {
  id: string;
  business_id: string;
  title: string;
  description: string;
  discount_percentage: number;
  code: string;
  valid_from: string;
  valid_until: string;
  active: boolean;
  created_at: string;
}
