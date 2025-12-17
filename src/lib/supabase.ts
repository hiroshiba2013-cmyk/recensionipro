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
  owner_id: string | null;
  category_id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  website_url: string;
  logo_url: string;
  verified: boolean;
  is_claimed: boolean;
  ateco_code: string;
  created_at: string;
  category?: BusinessCategory;
}

export interface FamilyMember {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  date_of_birth: string;
  tax_code: string;
  relationship: string;
  avatar_url: string | null;
  resume_url: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  customer_id: string;
  family_member_id: string | null;
  rating: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  customer?: Profile;
  family_member?: FamilyMember;
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

export interface JobPosting {
  id: string;
  business_id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_range: string;
  employment_type: string;
  active: boolean;
  created_at: string;
  expires_at: string;
}

export interface BusinessLocation {
  id: string;
  business_id: string;
  location_name: string;
  street: string;
  street_number: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  business_hours: string | null;
  vat_number: string | null;
  created_at: string;
}
