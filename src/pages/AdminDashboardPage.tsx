import { useState, useEffect } from 'react';
import { Shield, Users, FileText, ShoppingBag, Activity, CheckCircle, XCircle, Clock, Eye, Trash2, LogOut, Building2, AlertTriangle, Briefcase, Package, MapPin, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AdminStats } from '../components/admin/AdminStats';
import { ReportsSection } from '../components/admin/ReportsSection';
import { BusinessesSection } from '../components/admin/BusinessesSection';
import { JobPostingsSection } from '../components/admin/JobPostingsSection';
import { ProductsSection } from '../components/admin/ProductsSection';

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
  created_at: string;
  customer: {
    full_name: string;
    email: string;
  };
  business_id: string | null;
  unclaimed_business_id: string | null;
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
  customer: {
    full_name: string;
    email: string;
  };
  plan: {
    name: string;
    price: number;
  };
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
  reporter: {
    full_name: string;
    email: string;
  };
  content_type: string;
}

interface JobPosting {
  id: string;
  title: string;
  description: string;
  salary_range: string | null;
  location: string;
  status: string;
  created_at: string;
  business: {
    name: string;
  } | null;
}

interface RegisteredBusiness {
  id: string;
  name: string;
  vat_number: string | null;
  verified: boolean;
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
  business: {
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

  useEffect(() => {
    if (!user) {
      window.location.href = '/admin-login';
      return;
    }

    if (profile?.is_admin) {
      loadData();
    }
  }, [profile, activeTab, user]);

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
      registeredCount,
      importedCount,
      userAddedCount,
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
      supabase.from('registered_businesses').select('id', { count: 'exact', head: true }),
      supabase.from('imported_businesses').select('id', { count: 'exact', head: true }),
      supabase.from('user_added_businesses').select('id', { count: 'exact', head: true }),
      supabase.from('registered_business_locations').select('id', { count: 'exact', head: true }),
      supabase.from('customer_family_members').select('id', { count: 'exact', head: true })
    ]);

    setStats({
      totalUsers: usersCount.count || 0,
      totalReviews: reviewsCount.count || 0,
      pendingReviews: pendingCount.count || 0,
      totalAds: adsCount.count || 0,
      activeSubscriptions: subsCount.count || 0,
      totalBusinesses: (registeredCount.count || 0) + (importedCount.count || 0) + (userAddedCount.count || 0),
      totalProducts: productsCount.count || 0,
      totalReports: reportsCount.count || 0,
      pendingReports: pendingReportsCount.count || 0,
      totalJobPostings: jobsCount.count || 0,
      registeredBusinesses: registeredCount.count || 0,
      importedBusinesses: importedCount.count || 0,
      userAddedBusinesses: userAddedCount.count || 0,
      totalLocations: locationsCount.count || 0,
      totalFamilyMembers: familyCount.count || 0,
    });
  };

  const loadPendingReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        customer:profiles!reviews_customer_id_fkey(full_name, email)
      `)
      .eq('review_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading reviews:', error);
      return;
    }

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
        customer:profiles!subscriptions_customer_id_fkey(full_name, email),
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
        created_at,
        user:profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

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
        content_type,
        reporter:profiles!reports_reporter_id_fkey(full_name, email)
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
        location,
        status,
        created_at,
        business:registered_businesses(name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading job postings:', error);
      return;
    }

    setJobPostings(data || []);
  };

  const loadBusinesses = async () => {
    const { data, error } = await supabase
      .from('registered_businesses')
      .select(`
        id,
        name,
        vat_number,
        verified,
        created_at,
        owner:profiles!registered_businesses_owner_id_fkey(full_name, email),
        category:business_categories(name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading businesses:', error);
      return;
    }

    const businessesWithLocations = await Promise.all(
      (data || []).map(async (business) => {
        const { count } = await supabase
          .from('registered_business_locations')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', business.id);

        return {
          ...business,
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
        business:registered_businesses(name)
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
      await supabase.auth.signOut();
      window.location.href = '/admin-login';
    }
  };

  if (!profile?.is_admin) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Pannello di Amministrazione</h1>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Esci
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Recensioni ({stats.pendingReviews})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Utenti
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'subscriptions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Abbonamenti
              </button>
              <button
                onClick={() => setActiveTab('ads')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'ads'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4 inline mr-2" />
                Annunci
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Segnalazioni ({stats.pendingReports})
              </button>
              <button
                onClick={() => setActiveTab('businesses')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'businesses'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Building2 className="w-4 h-4 inline mr-2" />
                Attività
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'jobs'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Briefcase className="w-4 h-4 inline mr-2" />
                Lavoro
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Prodotti
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
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Recensioni in Attesa di Approvazione
                </h2>

                {pendingReviews.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nessuna recensione in attesa</p>
                  </div>
                ) : (
                  pendingReviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{review.title}</h3>
                          <p className="text-sm text-gray-600">
                            di {review.customer.full_name} ({review.customer.email})
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`${
                                  star <= review.overall_rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{review.content}</p>

                      {(review.price_rating || review.service_rating || review.quality_rating) && (
                        <div className="flex gap-4 mb-4 text-sm">
                          {review.price_rating && (
                            <div>
                              <span className="text-gray-600">Prezzo:</span>{' '}
                              <span className="font-semibold">{review.price_rating}/5</span>
                            </div>
                          )}
                          {review.service_rating && (
                            <div>
                              <span className="text-gray-600">Servizio:</span>{' '}
                              <span className="font-semibold">{review.service_rating}/5</span>
                            </div>
                          )}
                          {review.quality_rating && (
                            <div>
                              <span className="text-gray-600">Qualità:</span>{' '}
                              <span className="font-semibold">{review.quality_rating}/5</span>
                            </div>
                          )}
                        </div>
                      )}

                      {review.proof_image_url && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Prova di acquisto:</p>
                          <button
                            onClick={() => setSelectedReview(review)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                            Visualizza immagine
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => approveReview(review.id)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Approva {review.proof_image_url ? '(50 punti)' : '(25 punti)'}
                        </button>
                        <button
                          onClick={() => rejectReview(review.id)}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Rifiuta
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Gestione Utenti</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Abbonamento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Iscritto il
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Admin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Azioni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                user.user_type === 'business'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {user.user_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                user.subscription_status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : user.subscription_status === 'trial'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.subscription_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString('it-IT')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleAdmin(user.id, user.is_admin)}
                              className={`px-3 py-1 text-xs rounded-full ${
                                user.is_admin
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                              } hover:opacity-80`}
                            >
                              {user.is_admin ? 'Admin' : 'Utente'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.id !== profile?.id && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Elimina utente"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Gestione Abbonamenti</h2>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
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
              </div>
            )}

            {activeTab === 'ads' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Gestione Annunci</h2>
                </div>
                <div className="space-y-4 p-6">
                  {classifiedAds.map((ad) => (
                    <div key={ad.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{ad.title}</h3>
                          <p className="text-sm text-gray-600">
                            di {ad.user.full_name} ({ad.user.email})
                          </p>
                        </div>
                        <div className="text-right">
                          {ad.price && (
                            <p className="font-bold text-lg text-gray-900">€{ad.price}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            {new Date(ad.created_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">{ad.description}</p>

                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 text-xs rounded-full ${
                            ad.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : ad.status === 'sold'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ad.status}
                        </span>

                        <select
                          value={ad.status}
                          onChange={(e) => updateAdStatus(ad.id, e.target.value)}
                          className="border rounded px-3 py-1 text-sm"
                        >
                          <option value="active">Attivo</option>
                          <option value="sold">Venduto</option>
                          <option value="expired">Scaduto</option>
                          <option value="deleted">Eliminato</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reports' && <ReportsSection reports={reports} onReload={loadReports} />}

            {activeTab === 'businesses' && <BusinessesSection businesses={businesses} onReload={loadBusinesses} />}

            {activeTab === 'jobs' && <JobPostingsSection jobPostings={jobPostings} onReload={loadJobPostings} />}

            {activeTab === 'products' && <ProductsSection products={products} onReload={loadProducts} />}
          </>
        )}
      </div>

      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Prova di Acquisto</h3>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <img
                src={selectedReview.proof_image_url || ''}
                alt="Proof"
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
