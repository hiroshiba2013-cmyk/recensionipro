import { useState, useEffect, useRef } from 'react';
import { User, Calendar, Mail, Shield, Clock, Activity, CheckCircle, MessageSquare, Star, Tag, Briefcase, MapPin, Camera, Upload } from 'lucide-react';
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

interface AdminData {
  user_id: string;
  avatar_url: string | null;
  nickname: string | null;
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
  const [adminData, setAdminData] = useState<AdminData | null>(null);
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
  const [uploading, setUploading] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAdminData();
  }, [adminId]);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      const [profileResult, adminResult, logsResult, activityResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', adminId)
          .single(),

        supabase
          .from('admins')
          .select('*')
          .eq('user_id', adminId)
          .maybeSingle(),

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

      if (adminResult.data) {
        setAdminData(adminResult.data);
        setNewNickname(adminResult.data.nickname || '');
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Seleziona un file immagine valido');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Il file deve essere inferiore a 5MB');
        return;
      }

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${adminId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('admins')
        .update({ avatar_url: publicUrl })
        .eq('user_id', adminId);

      if (updateError) throw updateError;

      setAdminData(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      alert('Avatar aggiornato con successo!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Errore durante il caricamento dell\'avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleNicknameUpdate = async () => {
    if (!newNickname.trim()) {
      alert('Inserisci un nickname valido');
      return;
    }

    try {
      const { error } = await supabase
        .from('admins')
        .update({ nickname: newNickname.trim() })
        .eq('user_id', adminId);

      if (error) throw error;

      setAdminData(prev => prev ? { ...prev, nickname: newNickname.trim() } : null);
      setEditingNickname(false);
      alert('Nickname aggiornato con successo!');
    } catch (error) {
      console.error('Error updating nickname:', error);
      alert('Errore durante l\'aggiornamento del nickname');
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
          <div className="mb-8 flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                {adminData?.avatar_url ? (
                  <img
                    src={adminData.avatar_url}
                    alt="Avatar Admin"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                title="Cambia Avatar"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{profileData.full_name}</h3>
              {editingNickname ? (
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="Inserisci nickname"
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleNicknameUpdate}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => {
                      setEditingNickname(false);
                      setNewNickname(adminData?.nickname || '');
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-3">
                  {adminData?.nickname ? (
                    <span className="text-lg text-gray-700 font-medium">@{adminData.nickname}</span>
                  ) : (
                    <span className="text-gray-500 italic">Nessun nickname</span>
                  )}
                  <button
                    onClick={() => setEditingNickname(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm underline"
                  >
                    Modifica
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-red-600" />
                <span>Amministratore</span>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
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
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
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
