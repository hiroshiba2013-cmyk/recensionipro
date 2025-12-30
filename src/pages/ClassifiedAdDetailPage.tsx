import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  MapPin,
  Calendar,
  Eye,
  Phone,
  Mail,
  MessageCircle,
  Edit,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ClassifiedAdForm } from '../components/classifieds/ClassifiedAdForm';
import ReportButton from '../components/moderation/ReportButton';
import { FavoriteButton } from '../components/favorites/FavoriteButton';

interface ClassifiedAd {
  id: string;
  user_id: string;
  ad_type: 'sell' | 'buy' | 'gift';
  title: string;
  description: string;
  price: number | null;
  location: string;
  city: string;
  province: string;
  region: string;
  images: string[] | null;
  contact_phone: string | null;
  contact_email: string | null;
  views_count: number;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  classified_categories: {
    name: string;
    icon: string;
  };
}

export function ClassifiedAdDetailPage() {
  const { user } = useAuth();
  const [ad, setAd] = useState<ClassifiedAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const adId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (adId) {
      loadAd();
      trackView();
    }
  }, [adId]);

  const loadAd = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('classified_ads')
        .select(`
          *,
          profiles:user_id(full_name, avatar_url),
          classified_categories:category_id(name, icon)
        `)
        .eq('id', adId)
        .single();

      if (error) throw error;
      setAd(data);
    } catch (error) {
      console.error('Error loading ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      await supabase.from('classified_ad_views').insert([
        {
          ad_id: adId,
          user_id: user?.id || null,
        },
      ]);

      await supabase.rpc('increment_ad_views', { ad_uuid: adId });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo annuncio?')) return;

    try {
      const { error } = await supabase
        .from('classified_ads')
        .update({ status: 'deleted' })
        .eq('id', adId);

      if (error) throw error;
      window.location.href = '/classified';
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Errore nell\'eliminazione dell\'annuncio');
    }
  };

  const startConversation = async () => {
    if (!user) {
      window.location.href = '/';
      return;
    }

    if (!ad) return;

    try {
      // Check if conversation already exists
      const { data: existingConv, error: convError } = await supabase
        .from('ad_conversations')
        .select('id')
        .eq('ad_id', ad.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', ad.user_id)
        .maybeSingle();

      if (convError) throw convError;

      if (existingConv) {
        window.location.href = `/messages?conversation=${existingConv.id}`;
        return;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('ad_conversations')
        .insert([
          {
            ad_id: ad.id,
            buyer_id: user.id,
            seller_id: ad.user_id,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      window.location.href = `/messages?conversation=${newConv.id}`;
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Errore nell\'avvio della conversazione');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const nextImage = () => {
    if (ad?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % ad.images!.length);
    }
  };

  const prevImage = () => {
    if (ad?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + ad.images!.length) % ad.images!.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Annuncio non trovato</h2>
          <a
            href="/classified"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Torna agli annunci
          </a>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === ad.user_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <a
          href="/classified"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Torna agli annunci
        </a>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {ad.images && ad.images.length > 0 ? (
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="relative aspect-video bg-gray-200">
                  <img
                    src={ad.images[currentImageIndex]}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                  {ad.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {ad.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex
                                ? 'bg-white'
                                : 'bg-white bg-opacity-50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {ad.images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {ad.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex
                            ? 'border-blue-600'
                            : 'border-transparent'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${ad.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg aspect-video flex items-center justify-center text-gray-400 shadow-sm">
                <span className="text-6xl">{ad.classified_categories.icon}</span>
              </div>
            )}

            {/* Ad Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex gap-2 mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                      ad.ad_type === 'sell'
                        ? 'bg-blue-600 text-white'
                        : ad.ad_type === 'buy'
                        ? 'bg-green-600 text-white'
                        : 'bg-orange-600 text-white'
                    }`}>
                      {ad.ad_type === 'sell' ? '💰 Vendo' : ad.ad_type === 'buy' ? '🔍 Cerco' : '🎁 Regalo'}
                    </span>
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                      {ad.classified_categories.name}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {ad.title}
                  </h1>
                  {ad.price && (
                    <div className="text-3xl font-bold text-blue-600">
                      €{ad.price.toLocaleString('it-IT')}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => setShowEditForm(true)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifica"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : user ? (
                    <>
                      <FavoriteButton type="ad" itemId={ad.id} />
                      <ReportButton entityType="classified_ad" entityId={ad.id} />
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-6 text-gray-600 text-sm mb-6 pb-6 border-b">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {ad.city}, {ad.province}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(ad.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{ad.views_count} visualizzazioni</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Descrizione
                </h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {ad.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Venditore</h3>
              <div className="flex items-center gap-3 mb-4">
                {ad.profiles.avatar_url ? (
                  <img
                    src={ad.profiles.avatar_url}
                    alt={ad.profiles.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {ad.profiles.full_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {ad.profiles.full_name}
                  </div>
                </div>
              </div>

              {!isOwner && (
                <button
                  onClick={startConversation}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mb-3"
                >
                  <MessageCircle className="w-5 h-5" />
                  Invia Messaggio
                </button>
              )}

              {ad.contact_phone && (
                <a
                  href={`tel:${ad.contact_phone}`}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors mb-2"
                >
                  <Phone className="w-5 h-5" />
                  Chiama
                </a>
              )}

              {ad.contact_email && (
                <a
                  href={`mailto:${ad.contact_email}`}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Email
                </a>
              )}
            </div>

            {/* Location */}
            {ad.location && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Posizione</h3>
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div>{ad.location}</div>
                    <div>
                      {ad.city}, {ad.province}
                    </div>
                    <div className="text-sm text-gray-500">{ad.region}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ClassifiedAdForm
              adId={ad.id}
              onSuccess={() => {
                setShowEditForm(false);
                loadAd();
              }}
              onCancel={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
