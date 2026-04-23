import { useState, useEffect } from 'react';
import {
  Bell, Check, CheckCheck, Trash2, ArrowLeft, Heart, Briefcase, CreditCard,
  Store, CheckCircle, XCircle, Star, Search, Filter, X, Gavel,
  FileText, Users, ShieldCheck, Clock, MessageSquare, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  family_member_id: string | null;
}

interface NotificationTypeConfig {
  icon: any;
  color: string;
  bg: string;
  borderColor: string;
  cardBg: string;
  label: string;
  category: string;
}

const NOTIFICATION_CATEGORIES = [
  { key: 'all', label: 'Tutte', icon: Bell, color: 'text-gray-700', activeBg: 'bg-gray-800 text-white' },
  { key: 'business', label: 'Attivita', icon: Store, color: 'text-green-700', activeBg: 'bg-green-600 text-white' },
  { key: 'review', label: 'Recensioni', icon: Star, color: 'text-yellow-700', activeBg: 'bg-yellow-500 text-white' },
  { key: 'classifieds', label: 'Annunci', icon: FileText, color: 'text-teal-700', activeBg: 'bg-teal-600 text-white' },
  { key: 'auction', label: 'Aste', icon: Gavel, color: 'text-orange-700', activeBg: 'bg-orange-600 text-white' },
  { key: 'job', label: 'Lavoro', icon: Briefcase, color: 'text-blue-700', activeBg: 'bg-blue-600 text-white' },
  { key: 'subscription', label: 'Abbonamento', icon: CreditCard, color: 'text-cyan-700', activeBg: 'bg-cyan-600 text-white' },
  { key: 'points', label: 'Punti', icon: Star, color: 'text-amber-700', activeBg: 'bg-amber-500 text-white' },
  { key: 'favorite', label: 'Preferiti', icon: Heart, color: 'text-rose-700', activeBg: 'bg-rose-500 text-white' },
  { key: 'admin', label: 'Admin', icon: ShieldCheck, color: 'text-gray-700', activeBg: 'bg-gray-700 text-white' },
];

function getTypeConfig(type: string): NotificationTypeConfig {
  const configs: Record<string, NotificationTypeConfig> = {
    business_approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', borderColor: 'border-green-400', cardBg: 'bg-green-50', label: 'Attivita Approvata', category: 'business' },
    business_rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', borderColor: 'border-red-400', cardBg: 'bg-red-50', label: 'Attivita Rifiutata', category: 'business' },
    business_favorited: { icon: Store, color: 'text-green-600', bg: 'bg-green-100', borderColor: 'border-green-300', cardBg: 'bg-green-50/50', label: 'Attivita Preferita', category: 'favorite' },

    review_approved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', borderColor: 'border-emerald-400', cardBg: 'bg-emerald-50', label: 'Recensione Approvata', category: 'review' },
    review_rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', borderColor: 'border-red-400', cardBg: 'bg-red-50', label: 'Recensione Rifiutata', category: 'review' },

    classified_ad_approved: { icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-100', borderColor: 'border-teal-400', cardBg: 'bg-teal-50', label: 'Annuncio Approvato', category: 'classifieds' },
    classified_ad_rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', borderColor: 'border-red-400', cardBg: 'bg-red-50', label: 'Annuncio Rifiutato', category: 'classifieds' },
    ad_expired: { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', borderColor: 'border-gray-400', cardBg: 'bg-gray-50', label: 'Annuncio Scaduto', category: 'classifieds' },
    ad_favorited: { icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100', borderColor: 'border-rose-300', cardBg: 'bg-rose-50/50', label: 'Annuncio Preferito', category: 'favorite' },

    auction_approved: { icon: Gavel, color: 'text-orange-600', bg: 'bg-orange-100', borderColor: 'border-orange-400', cardBg: 'bg-orange-50', label: 'Asta Approvata', category: 'auction' },
    auction_rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', borderColor: 'border-red-400', cardBg: 'bg-red-50', label: 'Asta Rifiutata', category: 'auction' },

    job_approved: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', borderColor: 'border-blue-400', cardBg: 'bg-blue-50', label: 'Lavoro Approvato', category: 'job' },
    job_rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', borderColor: 'border-red-400', cardBg: 'bg-red-50', label: 'Lavoro Rifiutato', category: 'job' },
    job_favorited: { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100', borderColor: 'border-blue-300', cardBg: 'bg-blue-50/50', label: 'Lavoro Preferito', category: 'favorite' },

    subscription: { icon: CreditCard, color: 'text-cyan-600', bg: 'bg-cyan-100', borderColor: 'border-cyan-400', cardBg: 'bg-cyan-50', label: 'Abbonamento', category: 'subscription' },
    subscription_expiring: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', borderColor: 'border-amber-400', cardBg: 'bg-amber-50', label: 'Abbonamento in Scadenza', category: 'subscription' },

    points_earned: { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-100', borderColor: 'border-yellow-400', cardBg: 'bg-yellow-50', label: 'Punti Guadagnati', category: 'points' },

    admin_new_business: { icon: Store, color: 'text-gray-700', bg: 'bg-gray-200', borderColor: 'border-gray-400', cardBg: 'bg-gray-50', label: 'Nuova Attivita (Admin)', category: 'admin' },
    admin_new_review: { icon: Star, color: 'text-gray-700', bg: 'bg-gray-200', borderColor: 'border-gray-400', cardBg: 'bg-gray-50', label: 'Nuova Recensione (Admin)', category: 'admin' },
    admin_new_classified_ad: { icon: FileText, color: 'text-gray-700', bg: 'bg-gray-200', borderColor: 'border-gray-400', cardBg: 'bg-gray-50', label: 'Nuovo Annuncio (Admin)', category: 'admin' },
    admin_new_job_seeker: { icon: Users, color: 'text-gray-700', bg: 'bg-gray-200', borderColor: 'border-gray-400', cardBg: 'bg-gray-50', label: 'Nuova Candidatura (Admin)', category: 'admin' },
  };

  return configs[type] || {
    icon: Bell, color: 'text-blue-600', bg: 'bg-blue-100', borderColor: 'border-blue-300', cardBg: 'bg-white', label: 'Notifica', category: 'all',
  };
}

export function NotificationsPage() {
  const { user, profile, activeProfile, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const activeFamilyMemberId = activeProfile && !activeProfile.isOwner && profile?.user_type === 'customer'
    ? activeProfile.id
    : null;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { window.location.href = '/'; return; }
    loadNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => { loadNotifications(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, authLoading, activeFamilyMemberId]);

  async function loadNotifications() {
    if (!user) return;
    try {
      setLoading(true);
      let query = supabase.from('notifications').select('*').eq('user_id', user.id);
      if (activeFamilyMemberId) {
        query = query.eq('family_member_id', activeFamilyMemberId);
      } else {
        query = query.is('family_member_id', null);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const { error } = await supabase.rpc('mark_notification_read', { notification_id: notificationId });
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const { error } = await supabase.rpc('mark_all_notifications_read', { p_family_member_id: activeFamilyMemberId });
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
      if (error) throw error;
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) markAsRead(notification.id);
    if (notification.data?.url) window.location.href = notification.data.url;
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    return date.toLocaleDateString('it-IT');
  }

  const filteredNotifications = notifications.filter(n => {
    if (readFilter === 'unread' && n.read) return false;
    if (readFilter === 'read' && !n.read) return false;

    if (categoryFilter !== 'all') {
      const config = getTypeConfig(n.type);
      if (config.category !== categoryFilter) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      if (!n.title.toLowerCase().includes(term) && !n.message.toLowerCase().includes(term)) return false;
    }

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const categoryCounts = notifications.reduce<Record<string, number>>((acc, n) => {
    const cat = getTypeConfig(n.type).category;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const activeFiltersCount = (readFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0);

  const clearFilters = () => {
    setReadFilter('all');
    setCategoryFilter('all');
    setSearchTerm('');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-6 h-6" />
                    Notifiche
                  </h1>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {unreadCount} non {unreadCount === 1 ? 'letta' : 'lette'}
                    </p>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Segna tutte come lette</span>
                </button>
              )}
            </div>

            {/* Search bar */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cerca nelle notifiche..."
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${
                  showFilters || activeFiltersCount > 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtri
                {activeFiltersCount > 0 && (
                  <span className="ml-1 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{activeFiltersCount}</span>
                )}
              </button>
            </div>

            {/* Read filter tabs */}
            <div className="flex gap-2 mb-3">
              {([
                { key: 'all', label: `Tutte (${notifications.length})` },
                { key: 'unread', label: `Non lette (${unreadCount})` },
                { key: 'read', label: `Lette (${notifications.length - unreadCount})` },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setReadFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    readFilter === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3 animate-in">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">Filtra per categoria</span>
                  {categoryFilter !== 'all' && (
                    <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      Resetta filtri
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {NOTIFICATION_CATEGORIES.map(cat => {
                    const count = cat.key === 'all' ? notifications.length : (categoryCounts[cat.key] || 0);
                    if (cat.key !== 'all' && count === 0) return null;
                    const CatIcon = cat.icon;
                    const isActive = categoryFilter === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setCategoryFilter(cat.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isActive ? cat.activeBg : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                        {cat.label}
                        <span className={`ml-0.5 ${isActive ? 'opacity-80' : 'text-gray-400'}`}>({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active filters summary */}
            {activeFiltersCount > 0 && !showFilters && (
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                <span>Filtri attivi:</span>
                {categoryFilter !== 'all' && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium flex items-center gap-1">
                    {NOTIFICATION_CATEGORIES.find(c => c.key === categoryFilter)?.label}
                    <button onClick={() => setCategoryFilter('all')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {searchTerm && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium flex items-center gap-1">
                    "{searchTerm}"
                    <button onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                <button onClick={clearFilters} className="text-blue-600 hover:text-blue-800 font-medium ml-auto">
                  Cancella tutto
                </button>
              </div>
            )}

            {/* Result count */}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <span>{filteredNotifications.length} di {notifications.length} notifiche</span>
            </div>
          </div>
        </div>

        {/* Notifications list */}
        <div className="divide-y divide-gray-100">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeFiltersCount > 0 ? 'Nessun risultato' : readFilter === 'unread' ? 'Nessuna notifica non letta' : 'Nessuna notifica'}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeFiltersCount > 0
                  ? 'Prova a modificare i filtri per vedere piu risultati'
                  : readFilter === 'unread'
                  ? 'Tutte le notifiche sono state lette'
                  : 'Non hai ancora ricevuto notifiche'}
              </p>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  Resetta tutti i filtri
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const config = getTypeConfig(notification.type);
              const IconComponent = config.icon;

              return (
                <div
                  key={notification.id}
                  className={`transition-all cursor-pointer group border-l-4 ${
                    !notification.read
                      ? `${config.cardBg} ${config.borderColor}`
                      : 'bg-white border-transparent hover:bg-gray-50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="p-4 md:p-5">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${!notification.read ? config.bg : 'bg-gray-100'}`}>
                        <IconComponent className={`w-5 h-5 ${!notification.read ? config.color : 'text-gray-400'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm truncate ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </h3>
                            {!notification.read && <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${!notification.read ? `${config.bg} ${config.color}` : 'bg-gray-100 text-gray-500'}`}>
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-400">{formatTime(notification.created_at)}</span>
                          </div>
                        </div>

                        <p className={`text-sm mb-2.5 leading-relaxed ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-1.5">
                          {!notification.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Segna come letta
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Elimina
                          </button>
                        </div>
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
