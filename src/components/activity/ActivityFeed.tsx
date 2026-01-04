import { useState, useEffect } from 'react';
import {
  Activity,
  Eye,
  Star,
  FileText,
  Package,
  Building,
  Gift,
  CreditCard,
  TrendingUp,
  Award
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ActivityItem {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  points_earned: number;
  metadata: any;
  icon: string;
  color: string;
  created_at: string;
}

interface ActivitySummary {
  total_activities: number;
  total_points_earned: number;
  activities_this_week: number;
  activities_this_month: number;
}

const iconMap: { [key: string]: any } = {
  activity: Activity,
  eye: Eye,
  star: Star,
  'file-text': FileText,
  package: Package,
  building: Building,
  gift: Gift,
  'credit-card': CreditCard,
  award: Award,
  'trending-up': TrendingUp
};

export function ActivityFeed() {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    if (profile) {
      loadActivities();
      loadSummary();
    }
  }, [profile, filter]);

  const loadActivities = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      let query = supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (filter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase.rpc('get_user_activity_summary', {
        p_user_id: profile.id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setSummary(data[0]);
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minuti fa`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ore fa`;
    } else if (diffInHours < 48) {
      return 'Ieri';
    } else {
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Activity;
    return IconComponent;
  };

  if (!profile) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Caricamento attività...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Attività Totali</p>
                <p className="text-3xl font-bold text-blue-700">{summary.total_activities}</p>
              </div>
              <Activity className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Punti Guadagnati</p>
                <p className="text-3xl font-bold text-green-700">{summary.total_points_earned}</p>
              </div>
              <Star className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Questa Settimana</p>
                <p className="text-3xl font-bold text-orange-700">{summary.activities_this_week}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Questo Mese</p>
                <p className="text-3xl font-bold text-purple-700">{summary.activities_this_month}</p>
              </div>
              <Award className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">La Tua Attività</h2>
            <div className="inline-flex rounded-lg border border-blue-400 bg-blue-500/20 p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  filter === 'all'
                    ? 'bg-white text-blue-700'
                    : 'text-white hover:bg-blue-500/30'
                }`}
              >
                Tutte
              </button>
              <button
                onClick={() => setFilter('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  filter === 'week'
                    ? 'bg-white text-blue-700'
                    : 'text-white hover:bg-blue-500/30'
                }`}
              >
                Settimana
              </button>
              <button
                onClick={() => setFilter('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  filter === 'month'
                    ? 'bg-white text-blue-700'
                    : 'text-white hover:bg-blue-500/30'
                }`}
              >
                Mese
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {activities.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Nessuna attività ancora</p>
              <p className="text-sm mt-2">Inizia a interagire con la piattaforma per vedere le tue attività qui!</p>
            </div>
          ) : (
            activities.map((activity) => {
              const IconComponent = getIcon(activity.icon);
              return (
                <div
                  key={activity.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-gray-100`}>
                      <IconComponent className={`w-6 h-6 ${activity.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {activity.title}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {activity.description}
                          </p>
                          <p className="text-sm text-gray-400 mt-2">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>

                        {activity.points_earned > 0 && (
                          <div className="flex-shrink-0 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full">
                            <span className="font-bold">+{activity.points_earned}</span>
                            <span className="text-sm ml-1">punti</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
