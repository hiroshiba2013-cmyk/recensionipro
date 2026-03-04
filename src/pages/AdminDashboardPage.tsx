import { useState, useEffect } from 'react';
import { Shield, Users, FileText, ShoppingBag, Activity, CheckCircle, XCircle, Clock, Eye, Trash2, LogOut, Building2, AlertTriangle, Briefcase, Package, MapPin, UserCheck, Heart, Award, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AdminStats } from '../components/admin/AdminStats';
import { ReportsSection } from '../components/admin/ReportsSection';
import { BusinessesSection } from '../components/admin/BusinessesSection';
import { JobPostingsSection } from '../components/admin/JobPostingsSection';
import { ProductsSection } from '../components/admin/ProductsSection';
import { ReviewsSection } from '../components/admin/ReviewsSection';
import { ClassifiedAdsSection } from '../components/admin/ClassifiedAdsSection';
import { AdminProfileDashboard } from '../components/admin/AdminProfileDashboard';
import { UsersManagementSection } from '../components/admin/UsersManagementSection';
import { SolidaritySection } from '../components/admin/SolidaritySection';
import { LeaderboardSection } from '../components/admin/LeaderboardSection';
import { BusinessTrackingSection } from '../components/admin/BusinessTrackingSection';

interface DashboardStats {
  totalUsers: number;
  totalReviews: number;
  pendingReviews: number;
  totalAds: number;
  activeSubscriptions: number;
  totalBusinesses: number;
  totalProducts: number;
  totalReports: number;
  pendingReports: number;
  totalJobPostings: number;
  registeredBusinesses: number;
  importedBusinesses: number;
  userAddedBusinesses: number;
  totalLocations: number;
  totalFamilyMembers: number;
}

interface PendingReview {
  id: string;
  title: string;
  content: string;
  rating: number;
  overall_rating: number;
  price_rating: number | null;
  service_rating: number | null;
  quality_rating: number | null;
  proof_image_url: string | null;
  review_status: string;
  created_at: string;
  customer: {
    full_name: string;
    nickname: string | null;
    email: string;
  };
  family_member?: {
    nickname: string | null;
    full_name: string;
  } | null;
  business_id: string | null;
  business_location_id: string | null;
  unclaimed_business_location_id: string | null;
  business_location?: {
    name: string;
    internal_name: string | null;
    city: string;
    address: string;
  } | null;
  unclaimed_business_location?: {
    name: string;
    city: string;
    street: string;
  } | null;
  businesses?: {
    name: string;
  } | null;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  subscription_status: string;
  created_at: string;
  is_admin: boolean;
}

interface Subscription {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  customer_id: string;
  customer: {
    full_name: string;
    email: string;
    user_type: string;
    nickname?: string;
  };
  plan: {
    name: string;
    price: number;
  };
}

interface FamilyMember {
  id: string;
  nickname: string | null;
  full_name: string;
  relationship: string;
}

interface BusinessLocation {
  id: string;
  name: string;
  internal_name: string | null;
  city: string;
  province: string;
  address: string;
  phone: string | null;
  email: string | null;
}

interface ClassifiedAd {
  id: string;
  title: string;
  description: string;
  price: number | null;
  status: string;
  created_at: string;
  user: {
    full_name: string;
    email: string;
  };
}

interface Report {
  id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  reported_entity_type: string;
  reported_entity_id: string;
  reporter: {
    full_name: string;
    nickname: string | null;
    email: string;
  };
}

interface JobPosting {
  id: string;
  title: string;
  description: string;
  salary_range: string | null;
  location: string;
  status: string;
  created_at: string;
  business_location: {
    name: string;
  } | null;
}

interface RegisteredBusiness {
  id: string;
  name: string;
  vat_number: string | null;
  verified: boolean;
  is_verified?: boolean;
  created_at: string;
  owner: {
    full_name: string;
    email: string;
  };
  category: {
    name: string;
  } | null;
  locations_count: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  created_at: string;
  business_location: {
    name: string;
  } | null;
}

export function AdminDashboardPage() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalReviews: 0,
    pendingReviews: 0,
    totalAds: 0,
    activeSubscriptions: 0,
    totalBusinesses: 0,
    totalProducts: 0,
    totalReports: 0,
    pendingReports: 0,
    totalJobPostings: 0,
    registeredBusinesses: 0,
    importedBusinesses: 0,
    userAddedBusinesses: 0,
    totalLocations: 0,
    totalFamilyMembers: 0,
  });
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [classifiedAds, setClassifiedAds] = useState<ClassifiedAd[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [businesses, setBusinesses] = useState<RegisteredBusiness[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [businessLocations, setBusinessLocations] = useState<BusinessLocation[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        console.log('No user found, redirecting to admin login');
        window.location.href = '/admin-login';
        return;
      }

      console.log('Checking admin status for user:', user.id, user.email);

      const { data: adminCheck, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Admin check result:', { adminCheck, adminError });

      if (!adminCheck) {
        console.log('User is not an admin, redirecting to admin login');
        // Sign out the user first
        await supabase.auth.signOut();
        alert('Non hai i permessi di amministratore. Effettua il logout e accedi con un account admin.');
        window.location.href = '/admin-login';
        return;
      }

      console.log('User is admin, loading dashboard');
      setIsAdmin(true);
      setCheckingAdmin(false);
    };

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (!checkingAdmin && isAdmin) {
      loadData();
    }
  }, [checkingAdmin, isAdmin, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        await loadStats();
      } else if (activeTab === 'reviews') {
        await loadPendingReviews();
      } else if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'subscriptions') {
        await loadSubscriptions();
      } else if (activeTab === 'ads') {
        await loadClassifiedAds();
      } else if (activeTab === 'reports') {
        await loadReports();
      } else if (activeTab === 'jobs') {
        await loadJobPostings();
      } else if (activeTab === 'businesses') {
        await loadBusinesses();
      } else if (activeTab === 'products') {
        await loadProducts();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const [
      usersCount,
      reviewsCount,
      pendingCount,
      adsCount,
      subsCount,
      productsCount,
      reportsCount,
      pendingReportsCount,
      jobsCount,
      claimedBusinessesCount,
      unclaimedLocationsCount,
      locationsCount,
      familyCount
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('review_status', 'pending'),
      supabase.from('classified_ads').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('job_postings').select('id', { count: 'exact', head: true }),
      supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('is_claimed', true),
      supabase.from('unclaimed_business_locations').select('id', { count: 'exact', head: true }),
      supabase.from('business_locations').select('id', { count: 'exact', head: true }),
      supabase.from('customer_family_members').select('id', { count: 'exact', head: true })
    ]);

    setStats({
      totalUsers: usersCount.count || 0,
      totalReviews: reviewsCount.count || 0,
      pendingReviews: pendingCount.count || 0,
      totalAds: adsCount.count || 0,
      activeSubscriptions: subsCount.count || 0,
      totalBusinesses: (claimedBusinessesCount.count || 0) + (unclaimedLocationsCount.count || 0),
      totalProducts: productsCount.count || 0,
      totalReports: reportsCount.count || 0,
      pendingReports: pendingReportsCount.count || 0,
      totalJobPostings: jobsCount.count || 0,
      registeredBusinesses: claimedBusinessesCount.count || 0,
      importedBusinesses: unclaimedLocationsCount.count || 0,
      userAddedBusinesses: 0,
      totalLocations: locationsCount.count || 0,
      totalFamilyMembers: familyCount.count || 0,
    });
  };

  const loadPendingReviews = async () => {
    console.log('Loading reviews...');
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        customer:customer_id(full_name, nickname, email),
        family_member:family_member_id(full_name, nickname),
        business_location:business_location_id(name, internal_name, city, address),
        unclaimed_business_location:unclaimed_business_location_id(name, city, street),
        businesses:business_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error loading reviews:', error);
      return;
    }

    console.log('Reviews loaded:', data?.length || 0, 'reviews');
    console.log('Reviews data:', data);
    setPendingReviews(data || []);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, user_type, subscription_status, created_at, is_admin')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading users:', error);
      return;
    }

    setUsers(data || []);
  };

  const loadSubscriptions = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        start_date,
        end_date,
        customer_id,
        customer:profiles!subscriptions_customer_id_fkey(full_name, email, user_type, nickname),
        plan:subscription_plans(name, price)
      `)
      .order('start_date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading subscriptions:', error);
      return;
    }

    setSubscriptions(data || []);
  };

  const loadClassifiedAds = async () => {
    const { data, error } = await supabase
      .from('classified_ads')
      .select(`
        id,
        title,
        description,
        price,
        status,
        ad_type,
        category,
        city,
        province,
        images,
        created_at,
        expires_at,
        user:profiles(full_name, email, nickname)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error loading ads:', error);
      return;
    }

    setClassifiedAds(data || []);
  };

  const loadReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        reason,
        description,
        status,
        created_at,
        reported_entity_type,
        reported_entity_id,
        reporter:profiles!reports_reporter_id_fkey(full_name, email, nickname)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading reports:', error);
      return;
    }

    setReports(data || []);
  };

  const loadJobPostings = async () => {
    const { data, error } = await supabase
      .from('job_postings')
      .select(`
        id,
        title,
        description,
        salary_range,
        gross_annual_salary,
        location,
        status,
        position_type,
        experience_level,
        created_at,
        expires_at,
        published_at,
        business_location:business_locations(name)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error loading job postings:', error);
      return;
    }

    setJobPostings(data || []);
  };

  const loadBusinesses = async () => {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        vat_number,
        is_verified,
        created_at,
        owner:profiles!businesses_owner_id_fkey(full_name, email),
        category:business_categories(name)
      `)
      .eq('is_claimed', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading businesses:', error);
      return;
    }

    const businessesWithLocations = await Promise.all(
      (data || []).map(async (business) => {
        const { count } = await supabase
          .from('business_locations')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', business.id);

        return {
          ...business,
          verified: business.is_verified,
          locations_count: count || 0,
        };
      })
    );

    setBusinesses(businessesWithLocations);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        stock,
        created_at,
        business_location:business_locations(name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading products:', error);
      return;
    }

    setProducts(data || []);
  };

  const approveReview = async (reviewId: string) => {
    try {
      const { error } = await supabase.rpc('approve_review', {
        review_id_param: reviewId,
        staff_id_param: profile!.id,
      });

      if (error) throw error;

      alert('Recensione approvata con successo!');
      await loadPendingReviews();
      setSelectedReview(null);
    } catch (error: any) {
      console.error('Error approving review:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const rejectReview = async (reviewId: string) => {
    try {
      const { error } = await supabase.rpc('reject_review', {
        review_id_param: reviewId,
        staff_id_param: profile!.id,
      });

      if (error) throw error;

      alert('Recensione rifiutata');
      await loadPendingReviews();
      setSelectedReview(null);
    } catch (error: any) {
      console.error('Error rejecting review:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    const confirmMessage = currentStatus
      ? 'Sei sicuro di voler rimuovere i privilegi di amministratore a questo utente?'
      : 'Sei sicuro di voler concedere i privilegi di amministratore a questo utente?';

    if (!confirm(confirmMessage)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      alert(`Stato admin ${!currentStatus ? 'abilitato' : 'disabilitato'} con successo`);
      await loadUsers();
    } catch (error: any) {
      console.error('Error updating admin status:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente? Questa azione è irreversibile.')) {
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_user_account', {
        user_id_to_delete: userId,
      });

      if (error) throw error;

      alert('Utente eliminato con successo');
      await loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const updateSubscriptionStatus = async (subscriptionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', subscriptionId);

      if (error) throw error;

      alert('Stato abbonamento aggiornato con successo');
      await loadSubscriptions();
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const viewSubscriptionDetails = async (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setLoadingDetails(true);
    setFamilyMembers([]);
    setBusinessLocations([]);

    try {
      if (subscription.customer.user_type === 'customer') {
        // Carica membri famiglia per utenti privati
        const { data: familyData, error: familyError } = await supabase
          .from('family_members')
          .select('id, nickname, full_name, relationship')
          .eq('customer_id', subscription.customer_id)
          .order('relationship');

        if (familyError) throw familyError;
        setFamilyMembers(familyData || []);
      } else if (subscription.customer.user_type === 'business') {
        // Carica sedi per aziende
        const { data: locationsData, error: locationsError } = await supabase
          .from('business_locations')
          .select('id, name, internal_name, city, province, address, phone, email')
          .eq('business_id', subscription.customer_id)
          .order('name');

        if (locationsError) throw locationsError;
        setBusinessLocations(locationsData || []);
      }
    } catch (error: any) {
      console.error('Error loading subscription details:', error);
      alert(`Errore nel caricamento dei dettagli: ${error.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeSubscriptionDetails = () => {
    setSelectedSubscription(null);
    setFamilyMembers([]);
    setBusinessLocations([]);
  };

  const updateAdStatus = async (adId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('classified_ads')
        .update({ status: newStatus })
        .eq('id', adId);

      if (error) throw error;

      alert('Stato annuncio aggiornato con successo');
      await loadClassifiedAds();
    } catch (error: any) {
      console.error('Error updating ad:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    if (confirm('Sei sicuro di voler uscire?')) {
      try {
        // Log the logout time
        await supabase.rpc('log_admin_logout');

        await supabase.auth.signOut();
        localStorage.clear();
        window.location.href = '/';
      } catch (error) {
        console.error('Error during logout:', error);
        window.location.href = '/';
      }
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifica permessi amministratore...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-24 h-24 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Accesso Negato</h1>
          <p className="text-gray-600 mb-4">Non hai i permessi per accedere a questa pagina.</p>
          <button
            onClick={() => window.location.href = '/admin-login'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Vai al Login Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pannello Amministratore</h1>
                  <p className="text-sm text-gray-600">Benvenuto, {profile?.full_name} - Numero Utente: 123456</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                <LogOut className="w-4 h-4" />
                Esci
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'reviews'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                Recensioni
                {stats.pendingReviews > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                    {stats.pendingReviews}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Utenti
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'subscriptions'
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                Abbonamenti
              </button>
              <button
                onClick={() => setActiveTab('ads')}
                className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'ads'
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Annunci
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'reports'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Segnalazioni
                {stats.pendingReports > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                    {stats.pendingReports}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('businesses')}
                className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'businesses'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Attività
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'jobs'
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Lavoro
              </button>
              <button
                onClick={() => setActiveTab('solidarity')}
                className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'solidarity'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Heart className="w-4 h-4" />
                Solidarietà
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'leaderboard'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Award className="w-4 h-4" />
                Classifica
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'tracking'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Tracking
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <AdminStats stats={stats} />}

            {activeTab === 'reviews' && (
              <ReviewsSection reviews={pendingReviews} onReload={loadPendingReviews} adminId={profile!.id} />
            )}

            {activeTab === 'users' && (
              <UsersManagementSection onReload={loadData} />
            )}

            {activeTab === 'subscriptions' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-teal-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-500 rounded-lg">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Gestione Abbonamenti</h2>
                        <p className="text-sm text-gray-600">{subscriptions.length} abbonamenti totali</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Utente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Piano
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Prezzo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Inizio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Scadenza
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Azioni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subscriptions.map((sub) => (
                        <tr key={sub.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {sub.customer.full_name}
                            </div>
                            <div className="text-sm text-gray-500">{sub.customer.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sub.plan.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            €{sub.plan.price}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                sub.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : sub.status === 'trial'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sub.start_date).toLocaleDateString('it-IT')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sub.end_date).toLocaleDateString('it-IT')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                            <button
                              onClick={() => viewSubscriptionDetails(sub)}
                              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                              title="Visualizza dettagli"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <select
                              value={sub.status}
                              onChange={(e) => updateSubscriptionStatus(sub.id, e.target.value)}
                              className="border rounded px-2 py-1 text-sm"
                            >
                              <option value="trial">Trial</option>
                              <option value="active">Attivo</option>
                              <option value="expired">Scaduto</option>
                              <option value="cancelled">Cancellato</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Modal Dettagli Abbonamento */}
                {selectedSubscription && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">Dettagli Abbonamento</h3>
                        <button
                          onClick={closeSubscriptionDetails}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <XCircle className="w-5 h-5 text-white" />
                        </button>
                      </div>

                      <div className="p-6 space-y-6">
                        {/* Informazioni Utente */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Users className="w-5 h-5 text-teal-600" />
                            Informazioni Utente
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Nome:</span>
                              <p className="font-medium">{selectedSubscription.customer.nickname || selectedSubscription.customer.full_name}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <p className="font-medium">{selectedSubscription.customer.email}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Tipo:</span>
                              <p className="font-medium">
                                {selectedSubscription.customer.user_type === 'customer' ? 'Privato' : 'Azienda'}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Piano:</span>
                              <p className="font-medium">{selectedSubscription.plan.name}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Prezzo:</span>
                              <p className="font-medium text-green-600">€{selectedSubscription.plan.price}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Stato:</span>
                              <span
                                className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                                  selectedSubscription.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : selectedSubscription.status === 'trial'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {selectedSubscription.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Loading State */}
                        {loadingDetails && (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                          </div>
                        )}

                        {/* Membri Famiglia (per utenti privati) */}
                        {!loadingDetails && selectedSubscription.customer.user_type === 'customer' && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Users className="w-5 h-5 text-teal-600" />
                              Membri Famiglia ({familyMembers.length})
                            </h4>
                            {familyMembers.length === 0 ? (
                              <div className="bg-gray-50 rounded-lg p-6 text-center">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600">Nessun membro famiglia registrato</p>
                              </div>
                            ) : (
                              <div className="grid md:grid-cols-2 gap-4">
                                {familyMembers.map((member) => (
                                  <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Users className="w-5 h-5 text-teal-600" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-semibold text-gray-900">
                                          {member.nickname || member.full_name}
                                        </p>
                                        {member.nickname && (
                                          <p className="text-sm text-gray-600">{member.full_name}</p>
                                        )}
                                        <p className="text-sm text-gray-500 mt-1">
                                          <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                                            {member.relationship}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Sedi Business (per aziende) */}
                        {!loadingDetails && selectedSubscription.customer.user_type === 'business' && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-teal-600" />
                              Sedi Aziendali ({businessLocations.length})
                            </h4>
                            {businessLocations.length === 0 ? (
                              <div className="bg-gray-50 rounded-lg p-6 text-center">
                                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600">Nessuna sede registrata</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {businessLocations.map((location) => (
                                  <div key={location.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-teal-600" />
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-gray-900">
                                          {location.internal_name || location.name}
                                        </h5>
                                        {location.internal_name && (
                                          <p className="text-sm text-gray-600">{location.name}</p>
                                        )}
                                        <div className="mt-2 space-y-1 text-sm">
                                          <p className="text-gray-700">
                                            <span className="font-medium">Indirizzo:</span> {location.address}
                                          </p>
                                          <p className="text-gray-700">
                                            <span className="font-medium">Città:</span> {location.city}, {location.province}
                                          </p>
                                          {location.phone && (
                                            <p className="text-gray-700">
                                              <span className="font-medium">Telefono:</span> {location.phone}
                                            </p>
                                          )}
                                          {location.email && (
                                            <p className="text-gray-700">
                                              <span className="font-medium">Email:</span> {location.email}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
                        <button
                          onClick={closeSubscriptionDetails}
                          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                        >
                          Chiudi
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ads' && (
              <ClassifiedAdsSection ads={classifiedAds} onReload={loadClassifiedAds} />
            )}

            {activeTab === 'reports' && <ReportsSection reports={reports} onReload={loadReports} />}

            {activeTab === 'businesses' && <BusinessesSection onReload={loadBusinesses} />}

            {activeTab === 'jobs' && <JobPostingsSection jobPostings={jobPostings} onReload={loadJobPostings} />}

            {activeTab === 'solidarity' && <SolidaritySection onReload={loadData} />}

            {activeTab === 'leaderboard' && <LeaderboardSection />}

            {activeTab === 'tracking' && <BusinessTrackingSection onReload={loadData} />}
          </>
        )}
      </div>

    </div>
  );
}
