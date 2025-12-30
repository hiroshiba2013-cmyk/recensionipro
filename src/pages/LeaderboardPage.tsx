import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, TrendingUp, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  points: number;
  reviews_count: number;
  rank: number;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  points_required: number;
  icon: string;
  color: string;
}

export function LeaderboardPage() {
  const { profile } = useAuth();
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rewards'>('leaderboard');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'customer' | 'business'>('all');

  useEffect(() => {
    loadLeaderboard();
    loadRewards();
  }, [profile, userTypeFilter]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('user_activity')
        .select(`
          user_id,
          total_points,
          reviews_count,
          profile:profiles(id, full_name, avatar_url, user_type)
        `)
        .order('total_points', { ascending: false })
        .limit(100);

      const { data: activityData, error } = await query;

      if (error) throw error;

      let filteredData = activityData || [];
      if (userTypeFilter !== 'all') {
        filteredData = filteredData.filter((item: any) => item.profile?.user_type === userTypeFilter);
      }
      filteredData = filteredData.slice(0, 20);

      const leaderboard: LeaderboardUser[] = filteredData.map((item: any, index: number) => ({
        id: item.profile.id,
        full_name: item.profile.full_name,
        avatar_url: item.profile.avatar_url,
        points: item.total_points || 0,
        reviews_count: item.reviews_count || 0,
        rank: index + 1,
      }));

      setTopUsers(leaderboard);

      if (profile) {
        const userInTop = leaderboard.find(u => u.id === profile.id);
        if (userInTop) {
          setUserRank(userInTop);
        } else {
          const { data: userData } = await supabase
            .from('user_activity')
            .select('total_points, reviews_count')
            .eq('user_id', profile.id)
            .maybeSingle();

          if (userData) {
            const totalUsers = await supabase
              .from('user_activity')
              .select('user_id', { count: 'exact', head: true })
              .gt('total_points', userData.total_points || 0);

            setUserRank({
              id: profile.id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              points: userData.total_points || 0,
              reviews_count: userData.reviews_count || 0,
              rank: (totalUsers.count || 0) + 1,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('points_required');

      if (error) throw error;

      setRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Medal className="w-8 h-8 text-amber-700" />;
      default:
        return <span className="text-2xl font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300';
      case 2:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300';
      case 3:
        return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Caricamento classifica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-900">
              Classifica Utenti
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scopri gli utenti più attivi della community e i premi disponibili
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Classifica
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'rewards'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Premi
            </button>
          </div>

          {activeTab === 'leaderboard' && (
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setUserTypeFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  userTypeFilter === 'all'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tutti
              </button>
              <button
                onClick={() => setUserTypeFilter('customer')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  userTypeFilter === 'customer'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Utenti Privati
              </button>
              <button
                onClick={() => setUserTypeFilter('business')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  userTypeFilter === 'business'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Professionisti
              </button>
            </div>
          )}
        </div>

        {activeTab === 'leaderboard' ? (
          <>
            {userRank && (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {userRank.avatar_url ? (
                        <img
                          src={userRank.avatar_url}
                          alt={userRank.full_name}
                          className="w-16 h-16 rounded-full border-4 border-white"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-white text-blue-600 flex items-center justify-center text-2xl font-bold border-4 border-white">
                          {userRank.full_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm opacity-90">La tua posizione</p>
                        <p className="text-2xl font-bold">{userRank.full_name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm">#{userRank.rank}</span>
                          <span className="text-sm">{userRank.points} punti</span>
                          <span className="text-sm">{userRank.reviews_count} recensioni</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">Top 20 Utenti</h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {topUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-6 ${getRankBgColor(user.rank)} border-l-4 transition-all hover:shadow-md`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-shrink-0 w-12 flex items-center justify-center">
                            {getRankIcon(user.rank)}
                          </div>

                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                              {user.full_name.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {user.full_name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                {user.points} punti
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                {user.reviews_count} recensioni
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {topUsers.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Nessun utente in classifica al momento</p>
                    <p className="text-sm mt-2">Sii il primo a lasciare recensioni e guadagnare punti!</p>
                  </div>
                )}
              </div>

              <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Come Guadagnare Punti</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-gray-600" />
                    <span><strong>5 punti</strong> per ogni annuncio pubblicato</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span><strong>15 punti</strong> per ogni prodotto completo inserito</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-orange-600" />
                    <span><strong>20 punti</strong> per inserimento di un'attività non presente</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <span><strong>30 punti</strong> per ogni amico che si registra con il tuo nickname</span>
                  </li>
                </ul>

                <h4 className="text-md font-bold text-gray-900 mt-4 mb-2">Punti per Recensioni (in base alle stelle):</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-red-600" />
                    <span><strong>2 punti</strong> per recensione a 1 stella</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-orange-600" />
                    <span><strong>4 punti</strong> per recensione a 2 stelle</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span><strong>10 punti</strong> per recensione a 3 stelle</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-600" />
                    <span><strong>25 punti</strong> per recensione a 4 stelle</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-green-600" />
                    <span><strong>50 punti</strong> per recensione a 5 stelle</span>
                  </li>
                </ul>
              </div>

              {rewards.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Badge Disponibili</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-blue-500 transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${reward.color}`}>
                            {reward.icon === 'trophy' && <Trophy className="w-8 h-8" />}
                            {reward.icon === 'medal' && <Medal className="w-8 h-8" />}
                            {reward.icon === 'award' && <Award className="w-8 h-8" />}
                            {reward.icon === 'gift' && <Gift className="w-8 h-8" />}
                            {reward.icon === 'star' && <Star className="w-8 h-8" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">
                              {reward.title}
                            </h4>
                            <p className="text-gray-600 mb-4">
                              {reward.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                                {reward.points_required} punti richiesti
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Trophy className="w-16 h-16 text-blue-600" />
                <h3 className="text-3xl font-bold text-gray-900">
                  Premi per Utenti Privati
                </h3>
              </div>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed mb-6 text-center">
                I migliori 20 utenti privati dell'anno riceveranno fantastici premi: gift card ricaricabili e altri riconoscimenti esclusivi.
              </p>
              <p className="text-gray-600 max-w-2xl mx-auto text-center mb-8">
                Continua a guadagnare punti scrivendo recensioni verificate con foto e dettagli.
                Maggiore è il tuo contributo alla community, maggiori saranno le tue possibilità di vincere!
              </p>
              <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                  <p className="font-bold text-gray-900 text-lg">1° Posto</p>
                  <p className="text-sm text-gray-600 mt-2">Gift card da 500€</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <Medal className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-bold text-gray-900 text-lg">2° - 5° Posto</p>
                  <p className="text-sm text-gray-600 mt-2">Gift card da 200€</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <Award className="w-12 h-12 mx-auto mb-3 text-amber-700" />
                  <p className="font-bold text-gray-900 text-lg">6° - 20° Posto</p>
                  <p className="text-sm text-gray-600 mt-2">Gift card da 50€</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Trophy className="w-16 h-16 text-green-600" />
                <h3 className="text-3xl font-bold text-gray-900">
                  Premi per Professionisti
                </h3>
              </div>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed mb-6 text-center">
                I migliori 20 professionisti dell'anno riceveranno riconoscimenti speciali per la loro eccellenza nel servizio clienti.
              </p>
              <p className="text-gray-600 max-w-2xl mx-auto text-center mb-8">
                Ricevi recensioni positive e scala la classifica per ottenere visibilità e premi esclusivi!
              </p>
              <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                  <p className="font-bold text-gray-900 text-lg">1° Posto</p>
                  <p className="text-sm text-gray-600 mt-2">Certificato Eccellenza + Visibilità Premium</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <Medal className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-bold text-gray-900 text-lg">2° - 5° Posto</p>
                  <p className="text-sm text-gray-600 mt-2">Badge Qualità + Promozione Premium</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <Award className="w-12 h-12 mx-auto mb-3 text-amber-700" />
                  <p className="font-bold text-gray-900 text-lg">6° - 20° Posto</p>
                  <p className="text-sm text-gray-600 mt-2">Badge Riconoscimento + Visibilità Extra</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
