import { useState, useEffect } from 'react';
import { Award, TrendingUp, Star, MessageCircle, Briefcase, Tag, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LeaderboardUser {
  user_id: string;
  full_name: string;
  email: string;
  total_points: number;
  reviews_count: number;
  ads_count: number;
  job_postings_count: number;
  referrals_count: number;
}

export function LeaderboardSection() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'points' | 'reviews' | 'ads' | 'jobs' | 'referrals'>('points');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  useEffect(() => {
    filterLeaderboard();
  }, [leaderboard, searchName, searchEmail]);

  const filterLeaderboard = () => {
    let filtered = [...leaderboard];

    if (searchName) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchEmail) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    setFilteredLeaderboard(filtered);
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_activity')
        .select(`
          user_id,
          total_points,
          reviews_count,
          ads_count,
          job_postings_count,
          referrals_count
        `)
        .order(
          sortBy === 'points'
            ? 'total_points'
            : sortBy === 'reviews'
            ? 'reviews_count'
            : sortBy === 'ads'
            ? 'ads_count'
            : sortBy === 'jobs'
            ? 'job_postings_count'
            : 'referrals_count',
          { ascending: false }
        )
        .limit(100);

      if (error) throw error;

      // Load profile data separately for each user
      const enrichedData = await Promise.all((data || []).map(async (item) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', item.user_id)
          .maybeSingle();

        return {
          user_id: item.user_id,
          full_name: profile?.full_name || 'Unknown User',
          email: profile?.email || '',
          total_points: item.total_points,
          reviews_count: item.reviews_count,
          ads_count: item.ads_count,
          job_postings_count: item.job_postings_count,
          referrals_count: item.referrals_count,
        };
      }));

      setLeaderboard(enrichedData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
    } else if (index === 1) {
      return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
    } else if (index === 2) {
      return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
    }
    return 'bg-gray-100 text-gray-700';
  };

  const getRankIcon = (index: number) => {
    if (index < 3) {
      return <Award className="w-5 h-5" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Classifica Utenti</h2>
              <p className="text-sm text-gray-600">{filteredLeaderboard.length} di {leaderboard.length} utenti</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('points')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                sortBy === 'points'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Punti
            </button>
            <button
              onClick={() => setSortBy('reviews')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                sortBy === 'reviews'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star className="w-4 h-4" />
              Recensioni
            </button>
            <button
              onClick={() => setSortBy('ads')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                sortBy === 'ads'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Tag className="w-4 h-4" />
              Annunci
            </button>
            <button
              onClick={() => setSortBy('jobs')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                sortBy === 'jobs'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Lavori
            </button>
            <button
              onClick={() => setSortBy('referrals')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                sortBy === 'referrals'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Referral
            </button>
          </div>
        </div>
      </div>

      {/* Filtri di ricerca */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per nome utente..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        {(searchName || searchEmail) && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredLeaderboard.length} risultat{filteredLeaderboard.length === 1 ? 'o' : 'i'} trovat{filteredLeaderboard.length === 1 ? 'o' : 'i'}
            </p>
            <button
              onClick={() => {
                setSearchName('');
                setSearchEmail('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Cancella filtri
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase w-20">
                Pos.
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Utente
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                Punti
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                Recensioni
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                Annunci
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                Lavori
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                Referral
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredLeaderboard.map((user, index) => (
              <tr
                key={user.user_id}
                className={`hover:bg-gray-50 transition-colors ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-50/30 to-transparent' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRankBadge(
                      index
                    )}`}
                  >
                    {getRankIcon(index) || index + 1}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        {user.full_name}
                        {index < 3 && (
                          <Award className={`w-4 h-4 ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                            'text-orange-500'
                          }`} />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center">
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                      {user.total_points.toLocaleString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold text-gray-900">{user.reviews_count}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Tag className="w-4 h-4 text-pink-500" />
                    <span className="font-semibold text-gray-900">{user.ads_count}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Briefcase className="w-4 h-4 text-cyan-500" />
                    <span className="font-semibold text-gray-900">{user.job_postings_count}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <MessageCircle className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-gray-900">{user.referrals_count}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLeaderboard.length === 0 && !loading && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">Nessun utente attivo</p>
        </div>
      )}
    </div>
  );
}
