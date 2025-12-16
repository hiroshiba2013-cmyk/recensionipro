import { useState, useEffect } from 'react';
import { Plus, Star, Tag, Building, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Business, Review, Discount } from '../lib/supabase';
import { BusinessJobForm } from '../components/jobs/BusinessJobForm';
import { EditBusinessLocationsForm } from '../components/business/EditBusinessLocationsForm';
import { EditBusinessForm } from '../components/business/EditBusinessForm';
import { CreateBusinessForm } from '../components/business/CreateBusinessForm';

export function DashboardPage() {
  const { profile } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCreateBusinessForm, setShowCreateBusinessForm] = useState(false);

  useEffect(() => {
    if (profile) {
      loadDashboardData();
    }
  }, [profile]);

  const loadDashboardData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      if (profile.user_type === 'business') {
        const { data: businessesData } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', profile.id);

        if (businessesData) {
          setBusinesses(businessesData);

          if (businessesData.length > 0) {
            const businessIds = businessesData.map(b => b.id);

            const { data: reviewsData } = await supabase
              .from('reviews')
              .select(`
                *,
                customer:profiles(full_name),
                responses:review_responses(*)
              `)
              .in('business_id', businessIds)
              .order('created_at', { ascending: false });

            if (reviewsData) {
              setReviews(reviewsData);
            }

            const { data: discountsData } = await supabase
              .from('discounts')
              .select('*')
              .in('business_id', businessIds)
              .order('created_at', { ascending: false });

            if (discountsData) {
              setDiscounts(discountsData);
            }
          }
        }
      } else {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select(`
            *,
            business:businesses(name)
          `)
          .eq('customer_id', profile.id)
          .order('created_at', { ascending: false });

        if (reviewsData) {
          setReviews(reviewsData);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Caricamento...</p>
      </div>
    );
  }

  if (profile.subscription_status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Abbonamento Necessario
          </h2>
          <p className="text-gray-600 mb-6">
            Per accedere alla dashboard e utilizzare tutte le funzionalità, attiva un abbonamento.
          </p>
          <a
            href="/subscription"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Vedi Piani
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard {profile.user_type === 'business' ? 'Attività' : 'Cliente'}
          </h1>
          <p className="text-gray-600">
            Benvenuto, {profile.full_name}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {profile.user_type === 'business' ? (
              <>
                {showCreateBusinessForm ? (
                  <CreateBusinessForm
                    ownerId={profile.id}
                    onSuccess={() => {
                      setShowCreateBusinessForm(false);
                      loadDashboardData();
                    }}
                    onCancel={() => setShowCreateBusinessForm(false)}
                  />
                ) : (
                  <>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                          <Building className="w-6 h-6" />
                          Le Mie Attività
                        </h2>
                        <button
                          onClick={() => setShowCreateBusinessForm(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Aggiungi Attività
                        </button>
                      </div>

                      {businesses.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">
                          Non hai ancora registrato nessuna attività
                        </p>
                      ) : (
                        <div className="grid gap-4">
                          {businesses.map((business) => (
                            <div
                              key={business.id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg">{business.name}</h3>
                                  <p className="text-gray-600 text-sm">{business.city}</p>
                                </div>
                                {business.verified ? (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                    Verificato
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                                    In Attesa
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {businesses.length > 0 && (
                      <>
                        <EditBusinessForm businessId={businesses[0].id} onUpdate={loadDashboardData} />
                        <EditBusinessLocationsForm businessId={businesses[0].id} onUpdate={loadDashboardData} />
                      </>
                    )}
                  </>
                )}

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                      <Star className="w-6 h-6" />
                      Recensioni Ricevute
                    </h2>
                  </div>

                  {reviews.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      Non hai ancora ricevuto recensioni
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1">{review.title}</h4>
                          <p className="text-gray-700 text-sm">{review.content}</p>
                          {!review.responses || review.responses.length === 0 ? (
                            <button className="mt-3 text-blue-600 text-sm hover:text-blue-700">
                              Rispondi
                            </button>
                          ) : (
                            <div className="mt-3 pl-4 border-l-2 border-blue-200">
                              <p className="text-sm text-gray-700">{review.responses[0].content}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                      <Briefcase className="w-6 h-6" />
                      Annunci di Lavoro
                    </h2>
                    <button
                      onClick={() => setShowJobForm(!showJobForm)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Pubblica Annuncio
                    </button>
                  </div>

                  {showJobForm && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <BusinessJobForm onSuccess={() => setShowJobForm(false)} />
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                      <Tag className="w-6 h-6" />
                      Sconti Attivi
                    </h2>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Crea Sconto
                    </button>
                  </div>

                  {discounts.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      Non hai ancora creato sconti
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {discounts.map((discount) => (
                        <div key={discount.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{discount.title}</h4>
                              <p className="text-gray-600 text-sm mt-1">{discount.description}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-green-600 font-bold">-{discount.discount_percentage}%</span>
                                <span className="text-sm text-gray-500">Codice: {discount.code}</span>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-sm rounded-full ${
                              discount.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {discount.active ? 'Attivo' : 'Non attivo'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6" />
                  Le Mie Recensioni
                </h2>

                {reviews.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    Non hai ancora scritto recensioni
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-1">{review.title}</h4>
                        <p className="text-gray-700 text-sm">{review.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
