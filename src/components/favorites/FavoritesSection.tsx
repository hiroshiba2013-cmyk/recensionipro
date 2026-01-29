import { useState, useEffect } from 'react';
import { Heart, Building2, ShoppingBag, Briefcase, User, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from '../Router';

interface FavoriteItem {
  id: string;
  created_at: string;
  family_member_id: string | null;
  item: any;
}

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
}

export function FavoritesSection() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'businesses' | 'ads' | 'jobs'>('businesses');
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<FavoriteItem[]>([]);
  const [favoriteAds, setFavoriteAds] = useState<FavoriteItem[]>([]);
  const [favoriteJobs, setFavoriteJobs] = useState<FavoriteItem[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      loadFavorites();
      loadFamilyMembers();
    }
  }, [user, profile, activeTab]);

  const loadFamilyMembers = async () => {
    if (!profile) return;

    try {
      const { data } = await supabase
        .from('customer_family_members')
        .select('id, first_name, last_name, nickname')
        .eq('customer_id', profile.id);

      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (activeTab === 'businesses') {
        const { data } = await supabase
          .from('favorite_businesses')
          .select(`
            id,
            created_at,
            family_member_id,
            item:business_locations(
              id,
              business_id,
              address,
              city,
              phone,
              businesses(name)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setFavoriteBusinesses(data || []);
      } else if (activeTab === 'ads') {
        const { data } = await supabase
          .from('favorite_classified_ads')
          .select(`
            id,
            created_at,
            family_member_id,
            item:classified_ads(
              id,
              title,
              price,
              ad_type,
              city,
              images
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setFavoriteAds(data || []);
      } else if (activeTab === 'jobs') {
        const { data } = await supabase
          .from('favorite_job_postings')
          .select(`
            id,
            created_at,
            family_member_id,
            item:job_postings(
              id,
              title,
              location,
              position_type,
              gross_annual_salary,
              salary_currency,
              businesses(name)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setFavoriteJobs(data || []);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string, type: string) => {
    if (!confirm('Rimuovere dai preferiti?')) return;

    try {
      const tableName = type === 'businesses'
        ? 'favorite_businesses'
        : type === 'ads'
        ? 'favorite_classified_ads'
        : 'favorite_job_postings';

      await supabase
        .from(tableName)
        .delete()
        .eq('id', favoriteId);

      loadFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Errore durante la rimozione');
    }
  };

  const getFamilyMemberName = (familyMemberId: string | null) => {
    if (!familyMemberId) return profile?.full_name || 'Tu';
    const member = familyMembers.find(m => m.id === familyMemberId);
    if (!member) return 'Membro famiglia';
    return member.nickname || `${member.first_name} ${member.last_name}`;
  };

  const groupedBusinesses = favoriteBusinesses.reduce((acc, fav) => {
    const owner = fav.family_member_id || 'main';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(fav);
    return acc;
  }, {} as Record<string, FavoriteItem[]>);

  const groupedAds = favoriteAds.reduce((acc, fav) => {
    const owner = fav.family_member_id || 'main';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(fav);
    return acc;
  }, {} as Record<string, FavoriteItem[]>);

  const groupedJobs = favoriteJobs.reduce((acc, fav) => {
    const owner = fav.family_member_id || 'main';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(fav);
    return acc;
  }, {} as Record<string, FavoriteItem[]>);

  const renderBusinessCard = (fav: FavoriteItem) => {
    if (!fav.item) return null;
    const business = fav.item;

    return (
      <div key={fav.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              {business.businesses?.name || 'Attività'}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              {business.address}, {business.city}
            </p>
            {business.phone && (
              <p className="text-sm text-gray-500">{business.phone}</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/business/${business.business_id}`);
              }}
              className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Visualizza dettagli →
            </button>
          </div>
          <button
            onClick={() => removeFavorite(fav.id, 'businesses')}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Rimuovi dai preferiti"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderAdCard = (fav: FavoriteItem) => {
    if (!fav.item) return null;
    const ad = fav.item;

    return (
      <div key={fav.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                ad.ad_type === 'sell' ? 'bg-blue-100 text-blue-700' :
                ad.ad_type === 'buy' ? 'bg-green-100 text-green-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {ad.ad_type === 'sell' ? 'Vendo' : ad.ad_type === 'buy' ? 'Cerco' : 'Regalo'}
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">{ad.title}</h4>
            {ad.price && (
              <p className="text-lg font-bold text-blue-600 mb-1">€{ad.price}</p>
            )}
            <p className="text-sm text-gray-600">{ad.city}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/classified-ads/${ad.id}`);
              }}
              className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Visualizza annuncio →
            </button>
          </div>
          <button
            onClick={() => removeFavorite(fav.id, 'ads')}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Rimuovi dai preferiti"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderJobCard = (fav: FavoriteItem) => {
    if (!fav.item) return null;
    const job = fav.item;

    return (
      <div key={fav.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{job.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{job.businesses?.name || 'Azienda'}</p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span>{job.location}</span>
              <span className="text-green-600 font-medium">{job.position_type}</span>
              {job.gross_annual_salary && (
                <span>€{job.gross_annual_salary.toLocaleString()}/anno</span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/jobs');
              }}
              className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Visualizza offerta →
            </button>
          </div>
          <button
            onClick={() => removeFavorite(fav.id, 'jobs')}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Rimuovi dai preferiti"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Heart className="w-6 h-6 text-red-500 fill-current" />
        I Miei Preferiti
      </h2>

      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('businesses')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'businesses'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building2 className="w-5 h-5" />
          Attività
        </button>
        <button
          onClick={() => setActiveTab('ads')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'ads'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          Annunci
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'jobs'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          Offerte di Lavoro
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {activeTab === 'businesses' && (
            <>
              {Object.keys(groupedBusinesses).length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessuna attività nei preferiti</p>
              ) : (
                <>
                  {groupedBusinesses['main'] && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {profile?.full_name}
                      </h3>
                      <div className="grid gap-4">
                        {groupedBusinesses['main'].map(renderBusinessCard)}
                      </div>
                    </div>
                  )}
                  {Object.keys(groupedBusinesses)
                    .filter(key => key !== 'main')
                    .map(familyMemberId => (
                      <div key={familyMemberId}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          {getFamilyMemberName(familyMemberId)}
                        </h3>
                        <div className="grid gap-4">
                          {groupedBusinesses[familyMemberId].map(renderBusinessCard)}
                        </div>
                      </div>
                    ))}
                </>
              )}
            </>
          )}

          {activeTab === 'ads' && (
            <>
              {Object.keys(groupedAds).length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessun annuncio nei preferiti</p>
              ) : (
                <>
                  {groupedAds['main'] && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {profile?.full_name}
                      </h3>
                      <div className="grid gap-4">
                        {groupedAds['main'].map(renderAdCard)}
                      </div>
                    </div>
                  )}
                  {Object.keys(groupedAds)
                    .filter(key => key !== 'main')
                    .map(familyMemberId => (
                      <div key={familyMemberId}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          {getFamilyMemberName(familyMemberId)}
                        </h3>
                        <div className="grid gap-4">
                          {groupedAds[familyMemberId].map(renderAdCard)}
                        </div>
                      </div>
                    ))}
                </>
              )}
            </>
          )}

          {activeTab === 'jobs' && (
            <>
              {Object.keys(groupedJobs).length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessuna offerta di lavoro nei preferiti</p>
              ) : (
                <>
                  {groupedJobs['main'] && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {profile?.full_name}
                      </h3>
                      <div className="grid gap-4">
                        {groupedJobs['main'].map(renderJobCard)}
                      </div>
                    </div>
                  )}
                  {Object.keys(groupedJobs)
                    .filter(key => key !== 'main')
                    .map(familyMemberId => (
                      <div key={familyMemberId}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          {getFamilyMemberName(familyMemberId)}
                        </h3>
                        <div className="grid gap-4">
                          {groupedJobs[familyMemberId].map(renderJobCard)}
                        </div>
                      </div>
                    ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
