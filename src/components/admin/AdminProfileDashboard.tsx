import { useState, useEffect } from 'react';
import { User, Calendar, Mail, Shield, Clock, Activity, CheckCircle, MessageSquare, Star, Tag, Briefcase, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminProfileData {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  created_at: string;
  nickname: string | null;
  fiscal_code: string | null;
  phone: string | null;
}

interface AdminLoginLog {
  id: string;
  login_time: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface AdminActivity {
  reviews_approved: number;
  reviews_rejected: number;
  businesses_verified: number;
  reports_handled: number;
  ads_moderated: number;
  users_managed: number;
}

interface Props {
  adminId: string;
}

export function AdminProfileDashboard({ adminId }: Props) {
  const [profileData, setProfileData] = useState<AdminProfileData | null>(null);
  const [loginLogs, setLoginLogs] = useState<AdminLoginLog[]>([]);
  const [activity, setActivity] = useState<AdminActivity>({
    reviews_approved: 0,
    reviews_rejected: 0,
    businesses_verified: 0,
    reports_handled: 0,
    ads_moderated: 0,
    users_managed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, [adminId]);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      const [profileResult, logsResult, activityResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', adminId)
          .single(),

        supabase
          .from('admin_login_logs')
          .select('*')
          .eq('admin_id', adminId)
          .order('login_time', { ascending: false })
          .limit(10),

        loadActivityStats(adminId),
      ]);

      if (profileResult.data) {
        setProfileData(profileResult.data);
      }

      if (logsResult.data) {
        setLoginLogs(logsResult.data);
      }

      setActivity(activityResult);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityStats = async (adminId: string): Promise<AdminActivity> => {
    const [
      reviewsApproved,
      reviewsRejected,
      businessesVerified,
      reportsHandled,
      adsModerated,
      usersManaged,
    ] = await Promise.all([
      supabase
        .from('activity_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', adminId)
        .eq('activity_type', 'review_approved'),

      supabase
        .from('activity_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', adminId)
        .eq('activity_type', 'review_rejected'),

      supabase
        .from('registered_businesses')
        .select('id', { count: 'exact', head: true })
        .eq('verified', true),

      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .in('status', ['resolved', 'rejected']),

      supabase
        .from('classified_ads')
        .select('id', { count: 'exact', head: true }),

      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
    ]);

    return {
      reviews_approved: reviewsApproved.count || 0,
      reviews_rejected: reviewsRejected.count || 0,
      businesses_verified: businessesVerified.count || 0,
      reports_handled: reportsHandled.count || 0,
      ads_moderated: adsModerated.count || 0,
      users_managed: usersManaged.count || 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Impossibile caricare i dati del profilo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dati di Iscrizione</h2>
              <p className="text-sm text-gray-600">Informazioni del profilo amministratore</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Numero Utente</p>
                  <p className="text-lg font-bold text-gray-900">123456</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nome Completo</p>
                  <p className="text-lg font-semibold text-gray-900">{profileData.full_name}</p>
                </div>
              </div>

              {profileData.nickname && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nickname</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData.nickname}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Mail className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{profileData.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {profileData.fiscal_code && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Codice Fiscale</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData.fiscal_code}</p>
                  </div>
                </div>
              )}

              {profileData.phone && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-teal-50 rounded-lg">
                    <User className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefono</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ruolo</p>
                  <p className="text-lg font-semibold text-gray-900">Amministratore</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data Iscrizione</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(profileData.created_at).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ultimi Accessi</h2>
              <p className="text-sm text-gray-600">Cronologia degli accessi al pannello amministratore</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {loginLogs.length > 0 ? (
            <div className="space-y-3">
              {loginLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {new Date(log.login_time).toLocaleString('it-IT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {log.ip_address && (
                        <p className="text-sm text-gray-600">IP: {log.ip_address}</p>
                      )}
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Nessun accesso registrato</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Attività Svolte</h2>
              <p className="text-sm text-gray-600">Riepilogo delle azioni amministrative</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Recensioni Approvate</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">{activity.reviews_approved}</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border-2 border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Recensioni Rifiutate</h3>
              </div>
              <p className="text-3xl font-bold text-red-600">{activity.reviews_rejected}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Attività Verificate</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">{activity.businesses_verified}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border-2 border-yellow-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Segnalazioni Gestite</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{activity.reports_handled}</p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-5 border-2 border-pink-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-pink-500 rounded-lg">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Annunci Moderati</h3>
              </div>
              <p className="text-3xl font-bold text-pink-600">{activity.ads_moderated}</p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 border-2 border-teal-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-teal-500 rounded-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Utenti Gestiti</h3>
              </div>
              <p className="text-3xl font-bold text-teal-600">{activity.users_managed}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
