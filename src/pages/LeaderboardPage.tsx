import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ActivityFeed } from '../components/activity/ActivityFeed';

interface LeaderboardUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  points: number;
  reviews_count: number;
  rank: number;
  is_family_member?: boolean;
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
  const { profile, activeProfile } = useAuth();
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rewards' | 'activity'>('leaderboard');

  useEffect(() => {
    loadLeaderboard();
    loadRewards();
  }, [profile, activeProfile]);

  const loadLeaderboard = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Se è un membro della famiglia, carica solo i suoi dati
      if (activeProfile?.isOwner === false && activeProfile?.id) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('id, points_awarded, review_status')
          .eq('family_member_id', activeProfile.id)
          .eq('review_status', 'approved');

        if (reviews) {
          const reviewsCount = reviews.length;
          const totalPoints = reviews.reduce((sum, r) => sum + (r.points_awarded || 0), 0);

          // Calcola il rank globale
          const { count } = await supabase
            .from('user_activity')
            .select('user_id', { count: 'exact', head: true })
            .gt('total_points', totalPoints);

          const { data: memberData } = await supabase
            .from('customer_family_members')
            .select('first_name, last_name, nickname, avatar_url')
            .eq('id', activeProfile.id)
            .maybeSingle();

          if (memberData) {
            setUserRank({
              id: activeProfile.id,
              full_name: memberData.nickname || `${memberData.first_name} ${memberData.last_name}`,
              avatar_url: memberData.avatar_url,
              points: totalPoints,
              reviews_count: reviewsCount,
              rank: (count || 0) + 1,
              is_family_member: true,
            });
          }
        }
      } else {
        // Carica solo i dati del profilo principale, senza membri della famiglia
        const { data: reviews } = await supabase
          .from('reviews')
          .select('id, points_awarded, review_status')
          .eq('customer_id', profile.id)
          .is('family_member_id', null)
          .eq('review_status', 'approved');

        if (reviews) {
          const reviewsCount = reviews.length;
          const totalPoints = reviews.reduce((sum, r) => sum + (r.points_awarded || 0), 0);

          // Calcola il rank globale
          const { count } = await supabase
            .from('user_activity')
            .select('user_id', { count: 'exact', head: true })
            .gt('total_points', totalPoints);

          setUserRank({
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            points: totalPoints,
            reviews_count: reviewsCount,
            rank: (count || 0) + 1,
            is_family_member: false,
          });
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
              La Tua Classifica
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Visualizza la tua posizione e scopri i premi disponibili
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
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'activity'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              La Mia Attività
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
        </div>

        {activeTab === 'activity' ? (
          <div className="max-w-6xl mx-auto">
            <ActivityFeed />
          </div>
        ) : activeTab === 'leaderboard' ? (
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
                          {profile?.user_type !== 'business' && (
                            <span className="text-sm">{userRank.points} punti</span>
                          )}
                          <span className="text-sm">{userRank.reviews_count} recensioni</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto">
              {profile?.user_type === 'customer' && (
                <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Come Guadagnare Punti - Utenti Privati e Membri Famiglia</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Tutti gli utenti (profilo principale e membri della famiglia) guadagnano punti allo stesso modo:
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-green-600" />
                      <span><strong>50 punti</strong> per recensione completa (con valutazioni dettagliate)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-600" />
                      <span><strong>30 punti</strong> quando un amico si abbona usando il tuo nickname</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-blue-600" />
                      <span><strong>25 punti</strong> per recensione base (solo voto finale)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-orange-600" />
                      <span><strong>20 punti</strong> per inserimento di un'attività non presente</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <span><strong>10 punti</strong> per ogni prodotto inserito</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-gray-600" />
                      <span><strong>5 punti</strong> per ogni annuncio pubblicato</span>
                    </li>
                  </ul>

                  <div className="mt-4 bg-amber-50 border border-amber-300 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Nota:</strong> I punti delle recensioni vengono assegnati dopo l'approvazione dello staff. Ogni utente compete individualmente nella classifica, inclusi i membri della famiglia.
                    </p>
                  </div>
                </div>
              )}

              {profile?.user_type === 'business' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Come Guadagnare Punti - Professionisti</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    I professionisti guadagnano punti in base alle recensioni ricevute dai clienti e alle attività pubblicate.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-red-600" />
                      <span><strong>2 punti</strong> per recensione a 1 stella ricevuta</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-orange-600" />
                      <span><strong>4 punti</strong> per recensione a 2 stelle ricevuta</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <span><strong>10 punti</strong> per recensione a 3 stelle ricevuta</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-blue-600" />
                      <span><strong>25 punti</strong> per recensione a 4 stelle ricevuta</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-green-600" />
                      <span><strong>50 punti</strong> per recensione a 5 stelle ricevuta</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-blue-600" />
                      <span><strong>30 punti</strong> per ogni annuncio di lavoro pubblicato</span>
                    </li>
                  </ul>

                  <div className="mt-4 bg-amber-50 border border-amber-300 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Nota:</strong> I punti delle recensioni vengono assegnati solo dopo l'approvazione dello staff.
                      Maggiore è la qualità del servizio, maggiori saranno i punti guadagnati.
                    </p>
                  </div>
                </div>
              )}

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
                I migliori 20 utenti privati dell'anno riceveranno fantastici premi in gift card.
              </p>
              <p className="text-gray-600 max-w-2xl mx-auto text-center mb-8">
                Continua a guadagnare punti scrivendo recensioni verificate con foto e dettagli.
                Maggiore è il tuo contributo alla community, maggiori saranno le tue possibilità di vincere!
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-6 shadow-lg border-2 border-yellow-400">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
                  <p className="font-bold text-gray-900 text-xl">1° Posto</p>
                  <p className="text-lg text-yellow-800 font-semibold mt-2">Gift card da 500€</p>
                </div>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-6 shadow-lg border-2 border-gray-400">
                  <Medal className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="font-bold text-gray-900 text-xl">2° Posto</p>
                  <p className="text-lg text-gray-800 font-semibold mt-2">Gift card da 200€</p>
                </div>
                <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg p-6 shadow-lg border-2 border-amber-400">
                  <Medal className="w-12 h-12 mx-auto mb-3 text-amber-700" />
                  <p className="font-bold text-gray-900 text-xl">3° Posto</p>
                  <p className="text-lg text-amber-800 font-semibold mt-2">Gift card da 150€</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md border-2 border-blue-200">
                  <Award className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                  <p className="font-bold text-gray-900 text-lg">4° - 5° Posto</p>
                  <p className="text-sm text-gray-700 font-semibold mt-2">Gift card da 100€</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md border-2 border-green-200">
                  <Award className="w-12 h-12 mx-auto mb-3 text-green-600" />
                  <p className="font-bold text-gray-900 text-lg">6° - 10° Posto</p>
                  <p className="text-sm text-gray-700 font-semibold mt-2">Gift card da 75€</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md border-2 border-orange-200">
                  <Award className="w-12 h-12 mx-auto mb-3 text-orange-600" />
                  <p className="font-bold text-gray-900 text-lg">11° - 20° Posto</p>
                  <p className="text-sm text-gray-700 font-semibold mt-2">Gift card da 50€</p>
                </div>
              </div>
              <div className="bg-white border-2 border-blue-200 rounded-lg p-6 max-w-3xl mx-auto">
                <div className="flex items-start gap-3">
                  <Gift className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      Le gift card potranno essere scelte tra una lista di brand e servizi che verrà pubblicata in seguito.
                    </p>
                  </div>
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
