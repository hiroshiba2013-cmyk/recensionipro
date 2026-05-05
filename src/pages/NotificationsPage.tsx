import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Heart, Briefcase, CreditCard, Store, ShoppingBag, CheckCircle, XCircle, Star, Gavel, AlertTriangle, Building2, FileText } from 'lucide-react';
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

type CategoryFilter =
  | 'all'
  | 'unread'
  | 'reviews'
  | 'classifieds'
  | 'auctions'
  | 'businesses'
  | 'jobs'
  | 'reports'
  | 'points';

const CATEGORY_TYPES: Record<Exclude<CategoryFilter, 'all' | 'unread'>, string[]> = {
  reviews: ['review_approved', 'review_rejected', 'admin_new_review'],
  classifieds: ['classified_ad_approved', 'classified_ad_rejected', 'admin_new_classified_ad'],
  auctions: ['auction_approved', 'auction_rejected', 'admin_new_auction'],
  businesses: ['business_approved', 'business_rejected', 'admin_new_business'],
  jobs: ['job_approved', 'job_rejected', 'admin_new_job_seeker', 'admin_new_job_posting'],
  reports: ['report_submitted', 'report_resolved'],
  points: ['points_earned'],
};

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'Tutte',
  unread: 'Non lette',
  reviews: 'Recensioni',
  classifieds: 'Annunci',
  auctions: 'Aste',
  businesses: 'Attività',
  jobs: 'Lavoro',
  reports: 'Segnalazioni',
  points: 'Punti',
};

function getNotificationConfig(type: string): { icon: React.ElementType; color: string; bg: string } {
  switch (type) {
    case 'review_approved':
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
    case 'review_rejected':
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
    case 'admin_new_review':
      return { icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' };

    case 'classified_ad_approved':
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
    case 'classified_ad_rejected':
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
    case 'admin_new_classified_ad':
      return { icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' };

    case 'auction_approved':
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
    case 'auction_rejected':
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
    case 'admin_new_auction':
      return { icon: Gavel, color: 'text-orange-600', bg: 'bg-orange-100' };

    case 'business_approved':
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
    case 'business_rejected':
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
    case 'admin_new_business':
      return { icon: Building2, color: 'text-teal-600', bg: 'bg-teal-100' };

    case 'job_approved':
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
    case 'job_rejected':
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
    case 'admin_new_job_seeker':
    case 'admin_new_job_posting':
      return { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' };

    case 'report_submitted':
    case 'report_resolved':
      return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' };

    case 'points_earned':
      return { icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' };

    case 'ad_favorited':
      return { icon: Heart, color: 'text-red-600', bg: 'bg-red-100' };
    case 'job_favorited':
      return { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' };
    case 'business_favorited':
      return { icon: Store, color: 'text-green-600', bg: 'bg-green-100' };
    case 'subscription_expiring':
      return { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' };

    default:
      return { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-100' };
  }
}

function getCategoryForType(type: string): Exclude<CategoryFilter, 'all' | 'unread'> | null {
  for (const [cat, types] of Object.entries(CATEGORY_TYPES)) {
    if ((types as string[]).includes(type)) {
      return cat as Exclude<CategoryFilter, 'all' | 'unread'>;
    }
  }
  return null;
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

function getCategoryIcon(category: CategoryFilter): React.ElementType {
  switch (category) {
    case 'reviews': return Star;
    case 'classifieds': return ShoppingBag;
    case 'auctions': return Gavel;
    case 'businesses': return Building2;
    case 'jobs': return Briefcase;
    case 'reports': return AlertTriangle;
    case 'points': return Star;
    default: return Bell;
  }
}

export function NotificationsPage() {
  const { user, profile, activeProfile, selectedBusinessLocationId, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');

  const activeFamilyMemberId = activeProfile && !activeProfile.isOwner && profile?.user_type === 'customer'
    ? activeProfile.id
    : null;
  const activeBusinessLocationId = profile?.user_type === 'business' ? (selectedBusinessLocationId ?? null) : null;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { window.location.href = '/'; return; }
    loadNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => { loadNotifications(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, authLoading, activeFamilyMemberId]);

  async function loadNotifications() {
    if (!user) return;
    try {
      setLoading(true);
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id);

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
      await supabase.rpc('mark_notification_read', { notification_id: notificationId });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      await supabase.rpc('mark_all_notifications_read', {
        p_family_member_id: activeFamilyMemberId,
        p_business_location_id: activeBusinessLocationId,
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      await supabase.from('notifications').delete().eq('id', notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) markAsRead(notification.id);
    if (notification.data?.url) window.location.href = notification.data.url;
  }

  // Count per category
  const countByCategory = (cat: CategoryFilter): number => {
    if (cat === 'all') return notifications.length;
    if (cat === 'unread') return notifications.filter(n => !n.read).length;
    const types = CATEGORY_TYPES[cat];
    return notifications.filter(n => types.includes(n.type)).length;
  };

  const unreadCountByCategory = (cat: CategoryFilter): number => {
    if (cat === 'all') return notifications.filter(n => !n.read).length;
    if (cat === 'unread') return notifications.filter(n => !n.read).length;
    const types = CATEGORY_TYPES[cat];
    return notifications.filter(n => !n.read && types.includes(n.type)).length;
  };

  const filteredNotifications = (() => {
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'unread') return notifications.filter(n => !n.read);
    const types = CATEGORY_TYPES[activeFilter];
    return notifications.filter(n => types.includes(n.type));
  })();

  const totalUnread = notifications.filter(n => !n.read).length;

  const categories: CategoryFilter[] = ['all', 'unread', 'reviews', 'classifieds', 'auctions', 'businesses', 'jobs', 'reports', 'points'];
  const ALWAYS_VISIBLE: CategoryFilter[] = ['all', 'unread', 'reviews', 'classifieds', 'reports'];
  const visibleCategories = categories.filter(cat => ALWAYS_VISIBLE.includes(cat) || countByCategory(cat) > 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <div className={`w-1.5 h-1.5 rounded-full ${totalUnread > 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></div>
                {totalUnread > 0 ? `${totalUnread} ${totalUnread === 1 ? 'non letta' : 'non lette'}` : 'Tutto in ordine'}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">Notifiche</h1>
              <p className="text-lg text-gray-500 mt-2">Tieniti aggiornato su tutto quello che succede</p>
            </div>
            {totalUnread > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors self-start md:self-auto"
              >
                <CheckCheck className="w-4 h-4" />
                Segna tutte come lette
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">

          {/* Sidebar filters */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-6">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtra per</p>
              </div>
              <nav className="p-2">
                {visibleCategories.map(cat => {
                  const count = countByCategory(cat);
                  const unread = unreadCountByCategory(cat);
                  const isActive = activeFilter === cat;
                  const IconComp = cat === 'all'
                    ? Bell
                    : cat === 'unread'
                    ? Bell
                    : getCategoryIcon(cat);

                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComp className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        <span>{CATEGORY_LABELS[cat]}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {unread > 0 && cat !== 'unread' && (
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-white' : 'bg-blue-500'}`}></span>
                        )}
                        <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>{count}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Mobile filter tabs */}
          <div className="md:hidden w-full mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {visibleCategories.map(cat => {
                const count = countByCategory(cat);
                const unread = unreadCountByCategory(cat);
                const isActive = activeFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {unread > 0 && cat !== 'unread' && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-blue-500'}`}></span>
                    )}
                    {CATEGORY_LABELS[cat]}
                    <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications list */}
          <div className="flex-1 min-w-0">
            {/* Active filter header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">
                {CATEGORY_LABELS[activeFilter]}
                <span className="ml-2 text-sm font-normal text-gray-400">({filteredNotifications.length})</span>
              </h2>
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Bell className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  {activeFilter === 'unread' ? 'Nessuna notifica non letta' : 'Nessuna notifica in questa categoria'}
                </h3>
                <p className="text-sm text-gray-500">
                  {activeFilter === 'unread' ? 'Hai letto tutto!' : 'Le notifiche appariranno qui quando disponibili'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {filteredNotifications.map(notification => {
                  const { icon: IconComp, color, bg } = getNotificationConfig(notification.type);
                  const cat = getCategoryForType(notification.type);

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`group transition-colors cursor-pointer hover:bg-gray-50 ${!notification.read ? 'border-l-4 border-blue-600' : ''}`}
                    >
                      <div className="p-4 md:p-5">
                        <div className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${!notification.read ? bg : 'bg-gray-100'}`}>
                            <IconComp className={`w-5 h-5 ${!notification.read ? color : 'text-gray-400'}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-semibold text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {notification.title}
                                </span>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                )}
                                {cat && (
                                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                    {CATEGORY_LABELS[cat]}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(notification.created_at)}</span>
                            </div>

                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">{notification.message}</p>

                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <button
                                  onClick={e => { e.stopPropagation(); markAsRead(notification.id); }}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Segna come letta
                                </button>
                              )}
                              <button
                                onClick={e => { e.stopPropagation(); deleteNotification(notification.id); }}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
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
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
