import { useState, useEffect } from 'react';
import { User, Star, Tag, Plus, Calendar, Percent, X, Package, LogOut, Trophy, TrendingUp, Briefcase, MapPin, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ProfileClassifiedAdCard } from '../components/classifieds/ProfileClassifiedAdCard';
import { FavoriteClassifiedAdCard } from '../components/classifieds/FavoriteClassifiedAdCard';
import { ClassifiedAdForm } from '../components/classifieds/ClassifiedAdForm';
import { AvatarUpload } from '../components/profile/AvatarUpload';
import { EditProfileForm } from '../components/profile/EditProfileForm';
import { JobRequestForm } from '../components/profile/JobRequestForm';
import { EditFamilyMembersForm } from '../components/profile/EditFamilyMembersForm';
import { AddUnclaimedBusinessForm } from '../components/profile/AddUnclaimedBusinessForm';
import { CreateBusinessForm } from '../components/business/CreateBusinessForm';
import { EditBusinessForm } from '../components/business/EditBusinessForm';
import { BusinessJobPostingForm } from '../components/business/BusinessJobPostingForm';
import { EditBusinessLocationsForm } from '../components/business/EditBusinessLocationsForm';
import { SubscriptionManagement } from '../components/subscription/SubscriptionManagement';
import { DeleteAccountButton } from '../components/profile/DeleteAccountButton';
import { PinSetup } from '../components/profile/PinSetup';
import { ReviewForm } from '../components/reviews/ReviewForm';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  nickname: string;
  date_of_birth: string;
  tax_code: string;
  phone: string;
  billing_address: string;
  avatar_url: string | null;
  resume_url: string | null;
  user_type: 'customer' | 'business';
  subscription_type: string | null;
  subscription_status: string;
  subscription_expires_at: string | null;
  pin_enabled?: boolean;
}

interface Review {
  id: string;
  rating: number;
  price_rating?: number | null;
  service_rating?: number | null;
  quality_rating?: number | null;
  overall_rating?: number;
  title: string;
  content: string;
  created_at: string;
  business_id?: string | null;
  imported_business_id?: string | null;
  user_added_business_id?: string | null;
  family_member_id?: string;
  business_location_id?: string | null;
  review_status: 'pending' | 'approved' | 'rejected';
  proof_image_url?: string | null;
  points_awarded?: number;
  business?: {
    name: string;
  };
  customer?: {
    full_name: string;
  };
  family_member?: {
    nickname: string;
  };
  business_location?: {
    id: string;
    name: string | null;
    address: string;
    city: string;
  } | null;
  location_info?: {
    name?: string;
    city: string;
  } | null;
}

interface Discount {
  id: string;
  title: string;
  description: string;
  discount_percentage: number;
  code: string;
  valid_from: string;
  valid_until: string;
  active: boolean;
  business_location_id?: string | null;
  business?: {
    name: string;
  };
}

interface Business {
  id: string;
  name: string;
  vat_number: string;
  unique_code: string;
  ateco_code: string;
  pec_email: string;
  phone: string;
  billing_address: string;
  office_address: string;
  website_url: string;
}

interface BusinessLocation {
  id: string;
  name: string | null;
  internal_name: string | null;
  address: string;
  city: string;
  province: string;
  description?: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
  business?: {
    name: string;
  };
  rating?: number;
  reviews_count?: number;
}

interface ClassifiedAd {
  id: string;
  ad_type: 'sell' | 'buy' | 'gift';
  title: string;
  description: string;
  price: number | null;
  location: string;
  city: string;
  province: string;
  images: string[] | null;
  views_count: number;
  created_at: string;
  expires_at: string | null;
  status: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  classified_categories: {
    name: string;
    icon: string;
  };
}

interface JobPosting {
  id: string;
  title: string;
  description: string;
  position_type: string;
  location: string;
  experience_level: string;
  education_level: string;
  status: string;
  created_at: string;
  business_location_id?: string | null;
}

interface UserRank {
  rank: number;
  total_points: number;
  reviews_count: number;
}

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  avatar_url: string | null;
  pin_enabled?: boolean;
  reviews_count: number;
  total_points: number;
  rank: number;
}

export function ProfilePage() {
  const { user, signOut, activeProfile, selectedBusinessLocationId, setActiveProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessLocations, setBusinessLocations] = useState<BusinessLocation[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [classifiedAds, setClassifiedAds] = useState<ClassifiedAd[]>([]);
  const [favoriteAds, setFavoriteAds] = useState<ClassifiedAd[]>([]);
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<BusinessLocation[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    title: '',
    description: '',
    discount_percentage: 10,
    code: '',
    valid_until: '',
    business_location_id: '',
  });
  const [reviewFilters, setReviewFilters] = useState({
    nickname: '',
    rating: '',
    businessName: '',
    locationId: '',
  });
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showEditAdForm, setShowEditAdForm] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user, activeProfile]);

  const loadProfileData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);

        if (profileData.user_type === 'customer') {
          if (activeProfile?.isOwner === false && activeProfile?.id) {
            await loadFamilyMemberData(activeProfile.id);
          } else {
            await loadCustomerData();
          }
        } else {
          await loadBusinessData();
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerData = async () => {
    // Query per ottenere SOLO le recensioni del titolare principale (non dei family members)
    const reviewsQuery = supabase
      .from('reviews')
      .select(`
        *,
        family_member:customer_family_members(nickname)
      `)
      .eq('customer_id', user?.id)
      .is('family_member_id', null)
      .order('created_at', { ascending: false });

    const { data: reviewsData } = await reviewsQuery;

    if (reviewsData) {
      const reviewsWithBusinessNames = await Promise.all(
        reviewsData.map(async (review) => {
          let businessName = 'Attività';
          let locationInfo = null;

          if (review.business_id) {
            const { data: business } = await supabase
              .from('businesses')
              .select('name, city')
              .eq('id', review.business_id)
              .maybeSingle();
            if (business) {
              businessName = business.name;
              if (business.city) {
                locationInfo = { city: business.city };
              }
            }
          } else if (review.imported_business_id) {
            const { data: business } = await supabase
              .from('imported_businesses')
              .select('name, city')
              .eq('id', review.imported_business_id)
              .maybeSingle();
            if (business) {
              businessName = business.name;
              if (business.city) {
                locationInfo = { city: business.city };
              }
            }
          } else if (review.user_added_business_id) {
            const { data: business } = await supabase
              .from('user_added_businesses')
              .select('name, city')
              .eq('id', review.user_added_business_id)
              .maybeSingle();
            if (business) {
              businessName = business.name;
              if (business.city) {
                locationInfo = { city: business.city };
              }
            }
          }

          if (review.business_location_id) {
            const { data: location } = await supabase
              .from('business_locations')
              .select('internal_name, name, city')
              .eq('id', review.business_location_id)
              .maybeSingle();
            if (location) {
              locationInfo = {
                name: location.internal_name || location.name,
                city: location.city
              };
            }
          }

          return {
            ...review,
            business: { name: businessName },
            location_info: locationInfo
          };
        })
      );
      setReviews(reviewsWithBusinessNames);
    }

    const { data: discountsData } = await supabase
      .from('discounts')
      .select(`
        *,
        business:businesses(name)
      `)
      .eq('active', true)
      .gte('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false});

    if (discountsData) {
      setDiscounts(discountsData);
    }

    await loadClassifiedAds();
    await loadFavoriteAds();
    await loadFavoriteBusinesses();
    await loadLeaderboardData();
    await loadFamilyMembersData();
  };

  const loadFamilyMemberData = async (familyMemberId: string) => {
    const { data: memberData } = await supabase
      .from('customer_family_members')
      .select('*')
      .eq('id', familyMemberId)
      .maybeSingle();

    if (memberData) {
      setSelectedFamilyMember(memberData);
    }

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .eq('family_member_id', familyMemberId)
      .order('created_at', { ascending: false });

    if (reviewsData) {
      const reviewsWithBusinessNames = await Promise.all(
        reviewsData.map(async (review) => {
          let businessName = 'Attività';
          let locationInfo = null;

          if (review.business_id) {
            const { data: business } = await supabase
              .from('businesses')
              .select('name, city')
              .eq('id', review.business_id)
              .maybeSingle();
            if (business) {
              businessName = business.name;
              if (business.city) {
                locationInfo = { city: business.city };
              }
            }
          } else if (review.imported_business_id) {
            const { data: business } = await supabase
              .from('imported_businesses')
              .select('name, city')
              .eq('id', review.imported_business_id)
              .maybeSingle();
            if (business) {
              businessName = business.name;
              if (business.city) {
                locationInfo = { city: business.city };
              }
            }
          } else if (review.user_added_business_id) {
            const { data: business } = await supabase
              .from('user_added_businesses')
              .select('name, city')
              .eq('id', review.user_added_business_id)
              .maybeSingle();
            if (business) {
              businessName = business.name;
              if (business.city) {
                locationInfo = { city: business.city };
              }
            }
          }

          if (review.business_location_id) {
            const { data: location } = await supabase
              .from('business_locations')
              .select('internal_name, name, city')
              .eq('id', review.business_location_id)
              .maybeSingle();
            if (location) {
              locationInfo = {
                name: location.internal_name || location.name,
                city: location.city
              };
            }
          }

          return {
            ...review,
            business: { name: businessName },
            location_info: locationInfo
          };
        })
      );
      setReviews(reviewsWithBusinessNames);
    }

    const { data: discountsData } = await supabase
      .from('discounts')
      .select(`
        *,
        business:businesses(name)
      `)
      .eq('active', true)
      .gte('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (discountsData) {
      setDiscounts(discountsData);
    }

    const { data: adsData, error: adsError } = await supabase
      .from('classified_ads')
      .select(`
        *,
        classified_categories(name, icon)
      `)
      .eq('user_id', user?.id)
      .eq('family_member_id', familyMemberId)
      .order('created_at', { ascending: false });

    if (adsError) {
      console.error('Error loading family member ads:', adsError);
      return;
    }

    if (adsData) {
      let profileInfo;
      if (familyMemberId) {
        const { data: fmData } = await supabase
          .from('customer_family_members')
          .select('nickname, avatar_url')
          .eq('id', familyMemberId)
          .single();

        profileInfo = fmData
          ? { full_name: fmData.nickname, avatar_url: fmData.avatar_url }
          : { full_name: 'Utente', avatar_url: null };
      } else {
        const { data: profData } = await supabase
          .from('profiles')
          .select('full_name, nickname, avatar_url')
          .eq('id', user?.id)
          .single();

        profileInfo = profData
          ? { full_name: profData.nickname || profData.full_name, avatar_url: profData.avatar_url }
          : { full_name: 'Utente', avatar_url: null };
      }

      const formattedAds = adsData.map(ad => ({
        ...ad,
        price: ad.price ? parseFloat(ad.price) : null,
        profiles: profileInfo
      }));
      setClassifiedAds(formattedAds);
    }

    const { data: memberReviewsData } = await supabase
      .from('reviews')
      .select('id, proof_image_url, review_status')
      .eq('family_member_id', familyMemberId)
      .eq('review_status', 'approved');

    const reviews_count = memberReviewsData?.length || 0;
    const total_points = (memberReviewsData || []).reduce((sum, review) => {
      return sum + (review.proof_image_url ? 50 : 25);
    }, 0);

    const { count: betterUsersCount } = await supabase
      .from('user_activity')
      .select('user_id', { count: 'exact', head: true })
      .gt('total_points', total_points);

    const rank = (betterUsersCount || 0) + 1;

    setUserRank({
      rank,
      total_points,
      reviews_count,
    });

    await loadFavoriteAds();
    await loadFavoriteBusinesses();
  };

  const loadLeaderboardData = async () => {
    if (!user) return;

    const { data: userActivity } = await supabase
      .from('user_activity')
      .select('total_points, reviews_count')
      .eq('user_id', user.id)
      .maybeSingle();

    if (userActivity) {
      const { count } = await supabase
        .from('user_activity')
        .select('user_id', { count: 'exact', head: true })
        .gt('total_points', userActivity.total_points || 0);

      setUserRank({
        rank: (count || 0) + 1,
        total_points: userActivity.total_points || 0,
        reviews_count: userActivity.reviews_count || 0,
      });
    }
  };

  const loadFamilyMembersData = async () => {
    if (!user) return;

    const { data: membersData } = await supabase
      .from('customer_family_members')
      .select('id, first_name, last_name, nickname, avatar_url')
      .eq('customer_id', user.id);

    if (membersData) {
      const membersWithStats = await Promise.all(
        membersData.map(async (member) => {
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('id, proof_image_url')
            .eq('family_member_id', member.id);

          const reviews_count = reviewsData?.length || 0;
          const total_points = (reviewsData || []).reduce((sum, review) => {
            return sum + (review.proof_image_url ? 50 : 15);
          }, 0);

          const { count: betterUsersCount } = await supabase
            .from('user_activity')
            .select('user_id', { count: 'exact', head: true })
            .gt('total_points', total_points);

          const rank = (betterUsersCount || 0) + 1;

          return {
            ...member,
            reviews_count,
            total_points,
            rank,
          };
        })
      );

      setFamilyMembers(membersWithStats);
    }
  };

  const loadClassifiedAds = async () => {
    const { data: adsData, error } = await supabase
      .from('classified_ads')
      .select(`
        *,
        classified_categories(name, icon)
      `)
      .eq('user_id', user?.id)
      .is('family_member_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading classified ads:', error);
      return;
    }

    if (adsData) {
      const { data: profData } = await supabase
        .from('profiles')
        .select('full_name, nickname, avatar_url')
        .eq('id', user?.id)
        .single();

      const profileInfo = profData
        ? { full_name: profData.nickname || profData.full_name, avatar_url: profData.avatar_url }
        : { full_name: 'Utente', avatar_url: null };

      const formattedAds = adsData.map(ad => ({
        ...ad,
        price: ad.price ? parseFloat(ad.price) : null,
        profiles: profileInfo
      }));
      setClassifiedAds(formattedAds);
    }
  };

  const loadFavoriteAds = async () => {
    if (!user) return;

    const familyMemberId = activeProfile?.isOwner === false ? activeProfile?.id : null;

    let favoritesQuery = supabase
      .from('favorite_classified_ads')
      .select(`
        ad_id,
        classified_ads(
          *,
          classified_categories(name, icon)
        )
      `)
      .eq('user_id', user.id);

    if (familyMemberId) {
      favoritesQuery = favoritesQuery.eq('family_member_id', familyMemberId);
    } else {
      favoritesQuery = favoritesQuery.is('family_member_id', null);
    }

    const { data: favoritesData, error } = await favoritesQuery;

    if (error) {
      console.error('Error loading favorite ads:', error);
      return;
    }

    if (favoritesData) {
      const ads = favoritesData
        .filter(fav => fav.classified_ads)
        .map(fav => fav.classified_ads as any);

      if (ads.length > 0) {
        const userIds = [...new Set(ads.map((ad: any) => ad.user_id))];
        const familyMemberIds = [...new Set(ads.map((ad: any) => ad.family_member_id).filter(Boolean))];

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, nickname, avatar_url')
          .in('id', userIds);

        let familyMembersData: any[] = [];
        if (familyMemberIds.length > 0) {
          const { data: fmData } = await supabase
            .from('customer_family_members')
            .select('id, nickname, avatar_url')
            .in('id', familyMemberIds);

          familyMembersData = fmData || [];
        }

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const familyMembersMap = new Map(familyMembersData.map(fm => [fm.id, fm]));

        const formattedAds = ads.map((ad: any) => {
          let profileInfo;
          if (ad.family_member_id) {
            const familyMember = familyMembersMap.get(ad.family_member_id);
            profileInfo = familyMember
              ? { full_name: familyMember.nickname, avatar_url: familyMember.avatar_url }
              : { full_name: 'Utente', avatar_url: null };
          } else {
            const profile = profilesMap.get(ad.user_id);
            profileInfo = profile
              ? { full_name: profile.nickname || profile.full_name, avatar_url: profile.avatar_url }
              : { full_name: 'Utente', avatar_url: null };
          }

          return {
            ...ad,
            price: ad.price ? parseFloat(ad.price) : null,
            profiles: profileInfo
          };
        });

        setFavoriteAds(formattedAds);
      } else {
        setFavoriteAds([]);
      }
    }
  };

  const loadFavoriteBusinesses = async () => {
    if (!user) return;

    const familyMemberId = activeProfile?.isOwner === false ? activeProfile?.id : null;

    console.log('🔍 LOADING FAVORITE BUSINESSES');
    console.log('👤 User ID:', user.id);
    console.log('👨‍👩‍👧 Family Member ID:', familyMemberId);

    try {
      // Query base per i preferiti
      let baseQuery = supabase
        .from('favorite_businesses')
        .select('business_id, business_location_id, unclaimed_business_location_id')
        .eq('user_id', user.id);

      if (familyMemberId) {
        baseQuery = baseQuery.eq('family_member_id', familyMemberId);
      } else {
        baseQuery = baseQuery.is('family_member_id', null);
      }

      const { data: favoritesData, error: favError } = await baseQuery;

      if (favError) {
        console.error('Error loading favorites:', favError);
        return;
      }

      console.log('📊 Favorites found:', favoritesData?.length);

      const allLocations = [];

      // Carica business locations per i business registrati (vecchio metodo con business_id)
      const claimedBusinessIds = favoritesData
        ?.filter(f => f.business_id && !f.business_location_id)
        .map(f => f.business_id) || [];

      if (claimedBusinessIds.length > 0) {
        const { data: claimedLocations } = await supabase
          .from('business_locations')
          .select(`
            id,
            name,
            internal_name,
            address,
            city,
            province,
            description,
            avatar_url,
            phone,
            email,
            business_id,
            business:businesses(name)
          `)
          .in('business_id', claimedBusinessIds);

        if (claimedLocations) {
          allLocations.push(...claimedLocations);
        }
      }

      // Carica business locations specifiche (nuovo metodo con business_location_id)
      const claimedLocationIds = favoritesData
        ?.filter(f => f.business_location_id)
        .map(f => f.business_location_id) || [];

      if (claimedLocationIds.length > 0) {
        const { data: specificLocations } = await supabase
          .from('business_locations')
          .select(`
            id,
            name,
            internal_name,
            address,
            city,
            province,
            description,
            avatar_url,
            phone,
            email,
            business_id,
            business:businesses(name)
          `)
          .in('id', claimedLocationIds);

        if (specificLocations) {
          allLocations.push(...specificLocations);
        }
      }

      // Carica unclaimed business locations
      const unclaimedIds = favoritesData
        ?.filter(f => f.unclaimed_business_location_id)
        .map(f => f.unclaimed_business_location_id) || [];

      if (unclaimedIds.length > 0) {
        const { data: unclaimedLocations } = await supabase
          .from('unclaimed_business_locations')
          .select(`
            id,
            name,
            street,
            city,
            province,
            description,
            phone,
            email
          `)
          .in('id', unclaimedIds);

        if (unclaimedLocations) {
          allLocations.push(...unclaimedLocations.map(loc => ({
            ...loc,
            address: loc.street,
            avatar_url: null,
            internal_name: null,
            business_id: null,
            businesses: null
          })));
        }
      }

      console.log('🏢 All locations loaded:', allLocations.length);

      // Ottieni i rating per tutte le locations in una sola chiamata
      const locationIds = allLocations.map(loc => loc.id);
      console.log('📍 Location IDs to fetch ratings for:', locationIds);

      const { data: ratingsData, error: ratingsError } = await supabase
        .rpc('get_location_ratings', { location_ids: locationIds });

      if (ratingsError) {
        console.error('❌ Error fetching ratings:', ratingsError);
      }
      console.log('📊 Ratings data:', ratingsData);

      // Mappa i rating alle locations
      const locationsWithRatings = allLocations.map(location => {
        const rating = ratingsData?.find(r => r.id === location.id);
        return {
          ...location,
          rating: rating?.avg_rating || 0,
          reviews_count: rating?.review_count || 0
        };
      });

      console.log('⭐ Locations with ratings:', locationsWithRatings);
      console.log('🔍 First business details:', locationsWithRatings[0]);
      setFavoriteBusinesses(locationsWithRatings);
    } catch (error) {
      console.error('Error in loadFavoriteBusinesses:', error);
      setFavoriteBusinesses([]);
    }
  };

  const loadBusinessData = async () => {
    const { data: businessData } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user?.id)
      .maybeSingle();

    if (businessData) {
      setBusiness(businessData);

      const { data: locationsData } = await supabase
        .from('business_locations')
        .select('id, name, internal_name, address, city, province')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: true });

      if (locationsData) {
        setBusinessLocations(locationsData);
      }

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          customer:profiles!customer_id(full_name),
          family_member:customer_family_members(nickname),
          business_location:business_locations(id, name, address, city)
        `)
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false });

      if (reviewsData) {
        setReviews(reviewsData);
      }

      const { data: discountsData } = await supabase
        .from('discounts')
        .select('*')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false });

      if (discountsData) {
        setDiscounts(discountsData);
      }

      const { data: jobPostingsData } = await supabase
        .from('job_postings')
        .select('id, title, description, position_type, location, experience_level, education_level, status, created_at, business_location_id')
        .eq('business_id', businessData.id)
        .order('created_at', { ascending: false });

      if (jobPostingsData) {
        setJobPostings(jobPostingsData);
      }
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!business) return;

    try {
      const discountData = {
        business_id: business.id,
        title: newDiscount.title,
        description: newDiscount.description,
        discount_percentage: newDiscount.discount_percentage,
        code: newDiscount.code,
        valid_until: newDiscount.valid_until,
        business_location_id: newDiscount.business_location_id || null,
      };

      const { error } = await supabase.from('discounts').insert(discountData);

      if (error) throw error;

      setShowDiscountForm(false);
      setNewDiscount({
        title: '',
        description: '',
        discount_percentage: 10,
        code: '',
        valid_until: '',
        business_location_id: '',
      });

      loadBusinessData();
    } catch (error) {
      console.error('Error creating discount:', error);
      alert('Errore nella creazione dello sconto');
    }
  };

  const handleDeleteDiscount = async (discountId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo sconto?')) return;

    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', discountId);

      if (error) throw error;

      loadBusinessData();
    } catch (error) {
      console.error('Error deleting discount:', error);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
  };

  const handleReviewUpdateSuccess = () => {
    setEditingReview(null);
    loadProfileData();
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa recensione? Questa azione non può essere annullata.')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      alert('Recensione eliminata con successo!');
      loadProfileData();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Errore durante l\'eliminazione della recensione');
    }
  };

  const handleEditAd = (ad: ClassifiedAd) => {
    setEditingAdId(ad.id);
    setShowEditAdForm(true);
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      const { error } = await supabase
        .from('classified_ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      alert('Annuncio eliminato con successo!');
      loadClassifiedAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Errore durante l\'eliminazione dell\'annuncio');
    }
  };

  const handleAdFormSuccess = () => {
    setShowEditAdForm(false);
    setEditingAdId(null);
    loadClassifiedAds();
  };

  const filteredReviews = reviews.filter((review) => {
    const nicknameMatch = !reviewFilters.nickname ||
      review.family_member?.nickname?.toLowerCase().includes(reviewFilters.nickname.toLowerCase());

    const ratingMatch = !reviewFilters.rating ||
      review.rating === Number(reviewFilters.rating);

    const businessNameMatch = !reviewFilters.businessName ||
      review.business?.name?.toLowerCase().includes(reviewFilters.businessName.toLowerCase()) ||
      review.customer?.full_name?.toLowerCase().includes(reviewFilters.businessName.toLowerCase());

    const locationMatch = !reviewFilters.locationId ||
      (reviewFilters.locationId === 'general' && !review.business_location_id) ||
      review.business_location_id === reviewFilters.locationId;

    const businessLocationMatch = !selectedBusinessLocationId ||
      review.business_location_id === selectedBusinessLocationId;

    return nicknameMatch && ratingMatch && businessNameMatch && locationMatch && businessLocationMatch;
  });

  const filteredDiscounts = discounts.filter((discount) => {
    if (!selectedBusinessLocationId) return true;
    return discount.business_location_id === selectedBusinessLocationId;
  });

  const filteredJobPostings = jobPostings.filter((job) => {
    if (!selectedBusinessLocationId) return true;
    return job.business_location_id === selectedBusinessLocationId;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Profilo non trovato</p>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAccountDeleted = async () => {
    await signOut();
    window.location.href = '/';
  };

  const isOwner = activeProfile?.isOwner ?? true;
  const isFamilyMember = !isOwner && profile?.user_type === 'customer';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {isFamilyMember && selectedFamilyMember ? (
                <>
                  {selectedFamilyMember.avatar_url ? (
                    <img
                      src={selectedFamilyMember.avatar_url}
                      alt={selectedFamilyMember.nickname || `${selectedFamilyMember.first_name} ${selectedFamilyMember.last_name}`}
                      className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold border-4 border-blue-200">
                      {selectedFamilyMember.first_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {selectedFamilyMember.nickname || `${selectedFamilyMember.first_name} ${selectedFamilyMember.last_name}`}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {selectedFamilyMember.first_name} {selectedFamilyMember.last_name}
                    </p>
                    <span className="inline-block mt-2 px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      Membro della Famiglia
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <AvatarUpload
                    userId={profile.id}
                    currentAvatarUrl={profile.avatar_url}
                    onAvatarUpdate={() => loadProfileData()}
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
                    <p className="text-gray-600 mt-1">{profile.email}</p>
                    <span className="inline-block mt-2 px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {profile.user_type === 'customer' ? 'Cliente' : 'Azienda'}
                    </span>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md"
              title="Esci"
            >
              <LogOut className="w-5 h-5" />
              Esci
            </button>
          </div>
        </div>

        {isOwner && (
          <SubscriptionManagement
            userId={profile.id}
            userType={profile.user_type}
            currentSubscriptionStatus={profile.subscription_status}
            onUpdate={loadProfileData}
          />
        )}

        {profile.user_type === 'customer' && isOwner && userRank && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 mb-8 border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-7 h-7 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">La Tua Posizione in Classifica</h2>
            </div>

            <div className="bg-white rounded-lg p-6 mb-4">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">#{userRank.rank}</div>
                  <p className="text-gray-600 font-medium">Posizione</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{userRank.total_points}</div>
                  <p className="text-gray-600 font-medium">Punti Totali</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">{userRank.reviews_count}</div>
                  <p className="text-gray-600 font-medium">Recensioni</p>
                </div>
              </div>
            </div>


            <div className="mt-4 text-center">
              <a
                href="/leaderboard"
                className="inline-flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-md"
              >
                <Trophy className="w-5 h-5" />
                Vedi Classifica Completa
              </a>
            </div>
          </div>
        )}

        {profile.user_type === 'customer' ? (
          <>
            {isOwner ? (
              <>
                <div className="border-t-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-blue-600" />
                    Dati Personali Account Principale
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Informazioni del titolare dell'account</p>
                </div>

                <EditProfileForm
                  profile={profile}
                  onUpdate={loadProfileData}
                />

                <div className="border-t-4 border-green-500 bg-gradient-to-r from-green-50 to-white rounded-lg p-4 mb-6 mt-8">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-green-600" />
                    Membri della Famiglia
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Gestisci i membri collegati al tuo account</p>
                </div>

                <EditFamilyMembersForm
                  customerId={profile.id}
                  onUpdate={loadProfileData}
                />

                <div className="mt-8">
                  <PinSetup
                    profileId={profile.id}
                    profileName={profile.full_name}
                    isOwner={true}
                    userType={profile.user_type}
                    currentPinEnabled={profile.pin_enabled || false}
                    onSuccess={loadProfileData}
                  />
                </div>
              </>
            ) : isFamilyMember && selectedFamilyMember && (
              <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                <div className="border-t-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-blue-600" />
                    Protezione Profilo
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Gestisci la sicurezza del tuo profilo</p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {selectedFamilyMember.nickname || `${selectedFamilyMember.first_name} ${selectedFamilyMember.last_name}`}
                      </h3>
                      <p className="text-sm text-gray-600">Membro della Famiglia</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    I tuoi dati personali sono gestiti dal profilo principale.
                    Solo tu puoi vedere le tue attività (recensioni, annunci, sconti).
                  </p>
                </div>

                <PinSetup
                  profileId={selectedFamilyMember.id}
                  profileName={`${selectedFamilyMember.first_name} ${selectedFamilyMember.last_name}`}
                  isOwner={false}
                  userType="customer"
                  currentPinEnabled={selectedFamilyMember.pin_enabled || false}
                  onSuccess={loadProfileData}
                />
              </div>
            )}

            {isFamilyMember && userRank && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 mb-8 border-2 border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="w-7 h-7 text-yellow-600" />
                  <h2 className="text-2xl font-bold text-gray-900">La Tua Posizione in Classifica</h2>
                </div>

                <div className="bg-white rounded-lg p-6 mb-4">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-600 mb-2">#{userRank.rank}</div>
                      <p className="text-gray-600 font-medium">Posizione</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">{userRank.total_points}</div>
                      <p className="text-gray-600 font-medium">Punti Totali</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">{userRank.reviews_count}</div>
                      <p className="text-gray-600 font-medium">Recensioni</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <a
                    href="/leaderboard"
                    className="inline-flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-md"
                  >
                    <Trophy className="w-5 h-5" />
                    Vedi Classifica Completa
                  </a>
                </div>
              </div>
            )}

            <AddUnclaimedBusinessForm
              customerId={profile.id}
              activeFamilyMemberId={isFamilyMember ? selectedFamilyMember?.id : undefined}
              onSuccess={loadProfileData}
            />

            <JobRequestForm customerId={profile.id} familyMemberId={isFamilyMember ? selectedFamilyMember?.id : undefined} />

            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isFamilyMember ? 'Recensioni di ' + (selectedFamilyMember?.nickname || `${selectedFamilyMember?.first_name}`) : 'Le Tue Recensioni'}
                  </h2>
                </div>
                <a
                  href="/"
                  className="flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-md"
                >
                  <Star className="w-5 h-5" />
                  Scrivi Recensioni
                </a>
              </div>

              {isOwner && (
                <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                    <p className="text-gray-800 font-semibold text-lg">Guadagna Punti Scrivendo Recensioni!</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-yellow-300">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-600" />
                        <span className="text-gray-700 font-medium">Recensione Base:</span>
                        <span className="text-yellow-600 font-bold text-lg">25 punti</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-orange-300">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-orange-600 fill-orange-600" />
                        <span className="text-gray-700 font-medium">Recensione Completa:</span>
                        <span className="text-orange-600 font-bold text-lg">50 punti</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {reviews.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtra Recensioni</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Valutazione</label>
                      <select
                        value={reviewFilters.rating}
                        onChange={(e) => setReviewFilters({ ...reviewFilters, rating: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Tutte le valutazioni</option>
                        <option value="5">5 stelle</option>
                        <option value="4">4 stelle</option>
                        <option value="3">3 stelle</option>
                        <option value="2">2 stelle</option>
                        <option value="1">1 stella</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nome Azienda</label>
                      <input
                        type="text"
                        value={reviewFilters.businessName}
                        onChange={(e) => setReviewFilters({ ...reviewFilters, businessName: e.target.value })}
                        placeholder="Cerca per azienda"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  {(reviewFilters.rating || reviewFilters.businessName) && (
                    <button
                      onClick={() => setReviewFilters({ nickname: '', rating: '', businessName: '', locationId: '' })}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Resetta Filtri
                    </button>
                  )}
                </div>
              )}

              {editingReview && (
                <ReviewForm
                  businessId={editingReview.business_id || editingReview.imported_business_id || editingReview.user_added_business_id || ''}
                  businessName={editingReview.business?.name}
                  businessLocationId={editingReview.business_location_id || undefined}
                  reviewToEdit={{
                    id: editingReview.id,
                    rating: editingReview.rating,
                    price_rating: editingReview.price_rating,
                    service_rating: editingReview.service_rating,
                    quality_rating: editingReview.quality_rating,
                    overall_rating: editingReview.overall_rating,
                    title: editingReview.title,
                    content: editingReview.content,
                    business_location_id: editingReview.business_location_id,
                    proof_image_url: editingReview.proof_image_url,
                  }}
                  onClose={() => setEditingReview(null)}
                  onSuccess={handleReviewUpdateSuccess}
                />
              )}

              {reviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  {isFamilyMember ? 'Nessuna recensione scritta da questo membro' : 'Non hai ancora scritto recensioni'}
                </p>
              ) : filteredReviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessuna recensione trovata con questi filtri</p>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className={`border rounded-lg p-6 transition-colors ${
                      review.review_status === 'pending'
                        ? 'border-yellow-300 bg-yellow-50'
                        : review.review_status === 'rejected'
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">{review.title}</h3>
                            {review.review_status === 'pending' && (
                              <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded-full">
                                In attesa di approvazione
                              </span>
                            )}
                            {review.review_status === 'rejected' && (
                              <span className="px-3 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded-full">
                                Rifiutata
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {review.business?.name}
                            {review.location_info && (
                              <span className="text-gray-500">
                                {review.location_info.name && ` - ${review.location_info.name}`} ({review.location_info.city})
                              </span>
                            )}
                          </p>
                          {review.review_status === 'pending' && (
                            <p className="text-xs text-yellow-700 mt-2 font-medium">
                              La tua recensione sarà visibile dopo la verifica dello staff.
                              {review.proof_image_url ? ' Riceverai 50 punti' : ' Riceverai 25 punti'} dopo l'approvazione.
                            </p>
                          )}
                          {review.review_status === 'approved' && review.points_awarded && (
                            <p className="text-xs text-green-700 mt-2 font-medium">
                              Recensione approvata - Hai guadagnato {review.points_awarded} punti!
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          {review.review_status !== 'rejected' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditReview(review)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifica recensione"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Elimina recensione"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{review.content}</p>
                      <p className="text-sm text-gray-500 mt-3">
                        {new Date(review.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isFamilyMember ? 'Annunci di ' + (selectedFamilyMember?.nickname || `${selectedFamilyMember?.first_name}`) : 'I Tuoi Annunci'}
                  </h2>
                </div>
                <a
                  href="/classified"
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Crea Annuncio
                </a>
              </div>

              {isOwner && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <p className="text-gray-800 font-semibold">
                      Guadagna <span className="text-green-600 font-bold">5 punti</span> in classifica per ogni annuncio pubblicato!
                    </p>
                  </div>
                </div>
              )}

              {classifiedAds.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {isFamilyMember ? 'Nessun annuncio pubblicato da questo membro' : 'Non hai ancora pubblicato annunci'}
                  </p>
                  <a
                    href="/classified"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Pubblica il tuo primo annuncio
                  </a>
                </div>
              ) : (
                <>
                  {showEditAdForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                      <div className="bg-white rounded-xl p-8 max-w-4xl w-full my-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Modifica Annuncio</h2>
                        <ClassifiedAdForm
                          adId={editingAdId || undefined}
                          onSuccess={handleAdFormSuccess}
                          onCancel={() => {
                            setShowEditAdForm(false);
                            setEditingAdId(null);
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classifiedAds.map((ad) => (
                      <ProfileClassifiedAdCard
                        key={ad.id}
                        ad={ad}
                        onEdit={handleEditAd}
                        onDelete={handleDeleteAd}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-yellow-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isFamilyMember ? 'Annunci Preferiti di ' + (selectedFamilyMember?.nickname || `${selectedFamilyMember?.first_name}`) : 'Annunci Preferiti'}
                  </h2>
                </div>
              </div>

              {favoriteAds.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {isFamilyMember ? 'Nessun annuncio salvato da questo membro' : 'Non hai ancora salvato annunci'}
                  </p>
                  <a
                    href="/classified"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Esplora gli annunci
                  </a>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteAds.map((ad) => (
                    <FavoriteClassifiedAdCard
                      key={ad.id}
                      ad={ad}
                      familyMemberId={activeProfile?.isOwner === false ? activeProfile?.id : null}
                      onRemove={loadFavoriteAds}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-blue-600 fill-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isFamilyMember ? 'Attività Preferite di ' + (selectedFamilyMember?.nickname || `${selectedFamilyMember?.first_name}`) : 'Attività Preferite'}
                  </h2>
                </div>
              </div>

              {favoriteBusinesses.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {isFamilyMember ? 'Nessuna attività salvata da questo membro' : 'Non hai ancora salvato attività'}
                  </p>
                  <a
                    href="/"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Cerca attività
                  </a>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteBusinesses.map((business) => (
                    <div key={business.id} className="bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            {business.avatar_url ? (
                              <img
                                src={business.avatar_url}
                                alt={business.internal_name || business.name || 'Attività'}
                                className="w-16 h-16 rounded-lg object-cover mb-3"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3">
                                <Briefcase className="w-8 h-8 text-white" />
                              </div>
                            )}
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {business.internal_name || business.name || business.business?.name || 'Attività'}
                            </h3>
                            {business.business?.name && business.internal_name && (
                              <p className="text-sm text-gray-600 mb-2">{business.business.name}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>{business.city}, {business.province}</span>
                            </div>
                            {business.rating > 0 && (
                              <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < Math.round(business.rating)
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {business.rating.toFixed(1)} ({business.reviews_count} recensioni)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {business.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {business.description}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <a
                            href={business.business_id
                              ? `/business/${business.business_id}?locationId=${business.id}`
                              : `/business/${business.id}`}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-semibold"
                          >
                            Visualizza
                          </a>
                          <button
                            onClick={async () => {
                              const familyMemberId = activeProfile?.isOwner === false ? activeProfile?.id : null;

                              // Costruisci la query in base al tipo di attività
                              let deleteQuery = supabase
                                .from('favorite_businesses')
                                .delete()
                                .eq('user_id', user?.id);

                              if (business.business_id) {
                                // Business claimed - usa business_location_id
                                deleteQuery = deleteQuery.eq('business_location_id', business.id);
                              } else {
                                // Unclaimed business
                                deleteQuery = deleteQuery.eq('unclaimed_business_location_id', business.id);
                              }

                              if (familyMemberId) {
                                deleteQuery = deleteQuery.eq('family_member_id', familyMemberId);
                              } else {
                                deleteQuery = deleteQuery.is('family_member_id', null);
                              }

                              await deleteQuery;
                              await loadFavoriteBusinesses();
                            }}
                            className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {!business && user && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-8 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Completa la Registrazione Aziendale</h3>
                <p className="text-gray-700 mb-6">
                  Per accedere a tutte le funzionalità business (gestione sedi, annunci di lavoro, sconti, ecc.)
                  devi prima completare i dati della tua azienda.
                </p>
                <div className="border-t-4 border-green-500 bg-gradient-to-r from-green-50 to-white rounded-lg p-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-green-600" />
                    Crea la Tua Azienda
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Inserisci i dati della tua azienda per iniziare</p>
                </div>
                <CreateBusinessForm
                  ownerId={user.id}
                  onSuccess={loadBusinessData}
                  onCancel={() => {}}
                />
              </div>
            )}

            {business && (
              <>
                {businessLocations.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl shadow-lg p-6 mb-8 border-2 border-blue-300">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="w-6 h-6 text-blue-600" />
                      <h2 className="text-xl font-bold text-gray-900">Seleziona Sede da Gestire</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Seleziona una sede specifica per visualizzare e gestire solo i dati di quella sede
                      (recensioni, sconti, annunci di lavoro). Lascia "Tutte le Sedi" per vedere tutto.
                    </p>
                    <select
                      value={selectedBusinessLocationId || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setActiveProfile(e.target.value, false);
                        } else {
                          setActiveProfile(user!.id, true);
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-medium bg-white"
                    >
                      <option value="">Tutte le Sedi (Sede Principale)</option>
                      {businessLocations.map((location, index) => (
                        <option key={location.id} value={location.id}>
                          {location.internal_name || `Sede ${index + 1}`} - {location.name || location.city}
                        </option>
                      ))}
                    </select>
                    {selectedBusinessLocationId && (
                      <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">
                          Stai visualizzando solo i dati della sede selezionata
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t-4 border-green-500 bg-gradient-to-r from-green-50 to-white rounded-lg p-4 mb-6 mt-8">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-green-600" />
                    Dati Aziendali
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Informazioni generali dell'azienda</p>
                </div>

                <EditBusinessForm
                  businessId={business.id}
                  onUpdate={loadBusinessData}
                />

                <div className="border-t-4 border-orange-500 bg-gradient-to-r from-orange-50 to-white rounded-lg p-4 mb-6 mt-8">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-orange-600" />
                    Punti Vendita
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Gestisci i punti vendita dell'azienda</p>
                </div>

                <EditBusinessLocationsForm
                  businessId={business.id}
                  onUpdate={loadBusinessData}
                />

                <div className="border-t-4 border-slate-500 bg-gradient-to-r from-slate-50 to-white rounded-lg p-4 mb-6 mt-8">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-slate-600" />
                    Annunci di Lavoro
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Pubblica e gestisci i tuoi annunci di ricerca personale</p>
                </div>

                <BusinessJobPostingForm
                  businessId={business.id}
                  selectedLocationId={selectedBusinessLocationId || ''}
                />
              </>
            )}

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 mb-8 border-2 border-yellow-200">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-7 h-7 text-yellow-600" />
                <h2 className="text-2xl font-bold text-gray-900">Premi e Riconoscimenti</h2>
              </div>
              <div className="bg-white rounded-lg p-6">
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Ricevi recensioni positive e scala la classifica per vincere premi
                </p>
                <a
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-md"
                >
                  <Trophy className="w-5 h-5" />
                  Vedi Classifica
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Recensioni Ricevute</h2>
              </div>

              {reviews.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtra Recensioni</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nickname</label>
                      <input
                        type="text"
                        value={reviewFilters.nickname}
                        onChange={(e) => setReviewFilters({ ...reviewFilters, nickname: e.target.value })}
                        placeholder="Cerca per nickname"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Valutazione</label>
                      <select
                        value={reviewFilters.rating}
                        onChange={(e) => setReviewFilters({ ...reviewFilters, rating: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Tutte le valutazioni</option>
                        <option value="5">5 stelle</option>
                        <option value="4">4 stelle</option>
                        <option value="3">3 stelle</option>
                        <option value="2">2 stelle</option>
                        <option value="1">1 stella</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nome Cliente</label>
                      <input
                        type="text"
                        value={reviewFilters.businessName}
                        onChange={(e) => setReviewFilters({ ...reviewFilters, businessName: e.target.value })}
                        placeholder="Cerca per cliente"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Sede</label>
                      <select
                        value={reviewFilters.locationId}
                        onChange={(e) => setReviewFilters({ ...reviewFilters, locationId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Tutte le sedi</option>
                        <option value="general">Recensioni generali</option>
                        {businessLocations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name || `${location.address}, ${location.city}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {(reviewFilters.nickname || reviewFilters.rating || reviewFilters.businessName || reviewFilters.locationId) && (
                    <button
                      onClick={() => setReviewFilters({ nickname: '', rating: '', businessName: '', locationId: '' })}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Resetta Filtri
                    </button>
                  )}
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessuna recensione ricevuta</p>
              ) : filteredReviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessuna recensione trovata con questi filtri</p>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{review.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Da: {review.customer?.full_name}
                          </p>
                          {review.family_member?.nickname && (
                            <p className="text-xs text-blue-600 mt-1">
                              Scritta da: {review.family_member.nickname}
                            </p>
                          )}
                          {review.business_location ? (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Sede: {review.business_location.name || `${review.business_location.address}, ${review.business_location.city}`}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">
                              Recensione generale
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{review.content}</p>
                      <p className="text-sm text-gray-500 mt-3">
                        {new Date(review.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Tag className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Gestisci Sconti</h2>
                </div>
                {profile.subscription_status === 'active' && (
                  <button
                    onClick={() => setShowDiscountForm(true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                    Crea Sconto
                  </button>
                )}
              </div>

              {profile.subscription_status !== 'active' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800">
                    Attiva un abbonamento per creare e gestire sconti
                  </p>
                </div>
              )}

              {showDiscountForm && (
                <form onSubmit={handleCreateDiscount} className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Nuovo Sconto</h3>
                    <button
                      type="button"
                      onClick={() => setShowDiscountForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Titolo
                      </label>
                      <input
                        type="text"
                        value={newDiscount.title}
                        onChange={(e) => setNewDiscount({ ...newDiscount, title: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Codice Sconto
                      </label>
                      <input
                        type="text"
                        value={newDiscount.code}
                        onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Descrizione
                    </label>
                    <textarea
                      value={newDiscount.description}
                      onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                      required
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Percentuale Sconto
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={newDiscount.discount_percentage}
                          onChange={(e) => setNewDiscount({ ...newDiscount, discount_percentage: Number(e.target.value) })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <Percent className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Valido Fino a
                      </label>
                      <input
                        type="date"
                        value={newDiscount.valid_until}
                        onChange={(e) => setNewDiscount({ ...newDiscount, valid_until: e.target.value })}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {businessLocations.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Sede (Opzionale)
                      </label>
                      <select
                        value={newDiscount.business_location_id}
                        onChange={(e) => setNewDiscount({ ...newDiscount, business_location_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Tutte le sedi</option>
                        {businessLocations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name || `${location.address}, ${location.city}`}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-600 mt-1">
                        Lascia vuoto per applicare lo sconto a tutte le sedi
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      Crea Sconto
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDiscountForm(false)}
                      className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                      Annulla
                    </button>
                  </div>
                </form>
              )}

              {filteredDiscounts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  {selectedBusinessLocationId ? 'Nessuno sconto per questa sede' : 'Nessuno sconto creato'}
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredDiscounts.map((discount) => (
                    <div key={discount.id} className={`border-2 rounded-lg p-6 ${
                      discount.active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg text-gray-900">{discount.title}</h3>
                        <span className={`px-4 py-2 rounded-full font-bold text-lg ${
                          discount.active ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                        }`}>
                          -{discount.discount_percentage}%
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">{discount.description}</p>
                      <div className="bg-white rounded-lg p-3 border border-gray-300 mb-4">
                        <p className="text-xs text-gray-600 mb-1">Codice Sconto</p>
                        <p className="font-mono font-bold text-lg text-gray-900">{discount.code}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Fino al {new Date(discount.valid_until).toLocaleDateString('it-IT')}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteDiscount(discount.id)}
                          className="text-red-600 hover:text-red-700 font-semibold"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {isOwner && <DeleteAccountButton onAccountDeleted={handleAccountDeleted} />}
      </div>
    </div>
  );
}
