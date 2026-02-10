import { supabase } from './supabase';

export interface UnifiedBusinessResult {
  id: string;
  name: string;
  category_id: string | null;
  description: string;
  address: string | null;
  city: string;
  province: string | null;
  region: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  business_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  location_type: 'unclaimed' | 'claimed' | 'user_added';
  is_claimed: boolean;
  is_verified: boolean;
  business_id: string | null;
  owner_id: string | null;
  created_at: string;
}

export interface SearchFilters {
  query?: string;
  city?: string;
  province?: string;
  region?: string;
  category_id?: string;
  limit?: number;
}

export async function searchAllBusinesses(filters: SearchFilters = {}): Promise<UnifiedBusinessResult[]> {
  const { data, error } = await supabase.rpc('search_all_businesses', {
    search_query: filters.query || '',
    search_city: filters.city || null,
    search_province: filters.province || null,
    search_region: filters.region || null,
    search_category_id: filters.category_id || null,
    limit_count: filters.limit || 50
  });

  if (error) {
    console.error('Error searching businesses:', error);
    throw error;
  }

  return data || [];
}

export async function getBusinessDetails(businessId: string, businessType: 'imported' | 'user_added' | 'registered') {
  const { data, error } = await supabase.rpc('get_business_details', {
    p_business_id: businessId,
    p_business_type: businessType
  });

  if (error) {
    console.error('Error getting business details:', error);
    throw error;
  }

  return data;
}

export async function getBusinessReviews(businessId: string, businessType: 'imported' | 'user_added' | 'registered') {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      customer:profiles!customer_id(full_name),
      family_member:customer_family_members(first_name, last_name, nickname)
    `)
    .eq('review_status', 'approved')
    .order('created_at', { ascending: false });

  if (businessType === 'imported') {
    query = query.eq('imported_business_id', businessId);
  } else if (businessType === 'user_added') {
    query = query.eq('user_added_business_id', businessId);
  } else if (businessType === 'registered') {
    query = query.eq('business_id', businessId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting reviews:', error);
    throw error;
  }

  return data || [];
}

export async function claimImportedBusiness(businessId: string, userId: string) {
  const { data: importedBusiness, error: fetchError } = await supabase
    .from('imported_businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (fetchError) throw fetchError;

  const { data: newBusiness, error: insertError } = await supabase
    .from('registered_businesses')
    .insert({
      owner_id: userId,
      name: importedBusiness.name,
      category_id: importedBusiness.category_id,
      description: importedBusiness.description,
      source_type: 'claimed_imported',
      source_id: businessId,
      verification_badge: 'claimed'
    })
    .select()
    .single();

  if (insertError) throw insertError;

  const { error: locationError } = await supabase
    .from('registered_business_locations')
    .insert({
      business_id: newBusiness.id,
      street: importedBusiness.street,
      street_number: importedBusiness.street_number,
      city: importedBusiness.city,
      province: importedBusiness.province,
      region: importedBusiness.region,
      postal_code: importedBusiness.postal_code,
      phone: importedBusiness.phone,
      email: importedBusiness.email,
      website: importedBusiness.website,
      business_hours: importedBusiness.business_hours,
      latitude: importedBusiness.latitude,
      longitude: importedBusiness.longitude,
      is_primary: true
    });

  if (locationError) throw locationError;

  // Sposta le recensioni
  await supabase
    .from('reviews')
    .update({
      business_type: 'registered',
      business_id: newBusiness.id,
      imported_business_id: null
    })
    .eq('imported_business_id', businessId);

  // Elimina il business importato
  await supabase
    .from('imported_businesses')
    .delete()
    .eq('id', businessId);

  return newBusiness;
}

export async function claimUserAddedBusiness(businessId: string, userId: string) {
  const { data: userAddedBusiness, error: fetchError } = await supabase
    .from('user_added_businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (fetchError) throw fetchError;

  const { data: newBusiness, error: insertError } = await supabase
    .from('registered_businesses')
    .insert({
      owner_id: userId,
      name: userAddedBusiness.name,
      category_id: userAddedBusiness.category_id,
      description: userAddedBusiness.description,
      source_type: 'claimed_user_added',
      source_id: businessId,
      verification_badge: 'claimed'
    })
    .select()
    .single();

  if (insertError) throw insertError;

  const { error: locationError } = await supabase
    .from('registered_business_locations')
    .insert({
      business_id: newBusiness.id,
      street: userAddedBusiness.street,
      street_number: userAddedBusiness.street_number,
      city: userAddedBusiness.city,
      province: userAddedBusiness.province,
      region: userAddedBusiness.region,
      postal_code: userAddedBusiness.postal_code,
      phone: userAddedBusiness.phone,
      email: userAddedBusiness.email,
      website: userAddedBusiness.website,
      latitude: userAddedBusiness.latitude,
      longitude: userAddedBusiness.longitude,
      is_primary: true
    });

  if (locationError) throw locationError;

  // Sposta le recensioni
  await supabase
    .from('reviews')
    .update({
      business_type: 'registered',
      business_id: newBusiness.id,
      user_added_business_id: null
    })
    .eq('user_added_business_id', businessId);

  // Elimina il business aggiunto dall'utente
  await supabase
    .from('user_added_businesses')
    .delete()
    .eq('id', businessId);

  return newBusiness;
}
