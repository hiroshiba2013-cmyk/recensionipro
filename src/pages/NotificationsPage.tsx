import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, ArrowLeft, Heart, Briefcase, CreditCard, Store, ShoppingBag, CheckCircle, XCircle, Star } from 'lucide-react';
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

export function NotificationsPage() {
  const { user, profile, activeProfile, selectedBusinessLocationId, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const activeFamilyMemberId = activeProfile && !activeProfile.isOwner && profile?.user_type === 'customer'
    ? activeProfile.id
    : null;
  const activeBusinessLocationId = profile?.user_type === 'business' ? (selectedBusinessLocationId ?? null) : null;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      window.location.href = '/';
      return;
    }

    loadNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      const { error } = await supabase
        .rpc('mark_notification_read', { notification_id: notificationId });

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const { error } = await supabase.rpc('mark_all_notifications_read', {
        p_family_member_id: activeFamilyMemberId,
        p_business_location_id: activeBusinessLocationId,
      });

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }
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

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'ad_favorited':
        return { icon: Heart, color: 'text-red-600', bg: 'bg-red-100' };
      case 'job_favorited':
        return { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'business_favorited':
        return { icon: Store, color: 'text-green-600', bg: 'bg-green-100' };
      case 'subscription_expiring':
        return { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'business_approved':
      case 'review_approved':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'business_rejected':
      case 'review_rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'points_earned':
        return { icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      default:
        return { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-100' };
    }
  }

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                {unreadCount > 0 ? `${unreadCount} non ${unreadCount === 1 ? 'letta' : 'lette'}` : 'Tutto in ordine'}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">Notifiche</h1>
              <p className="text-lg text-gray-500 mt-2">Tieniti aggiornato su tutto quello che succede</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Tutte ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === 'unread' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Non lette ({unreadCount})
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Segna tutte</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto">

        <div className="divide-y divide-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'unread' ? 'Nessuna notifica non letta' : 'Nessuna notifica'}
              </h3>
              <p className="text-gray-600">
                {filter === 'unread'
                  ? 'Tutte le notifiche sono state lette'
                  : 'Non hai ancora ricevuto notifiche'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const iconConfig = getNotificationIcon(notification.type);
              const IconComponent = iconConfig.icon;

              return (
              <div
                key={notification.id}
                className={`bg-white hover:bg-gray-50 transition-colors cursor-pointer group ${
                  !notification.read ? 'border-l-4 border-blue-600' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="p-4 md:p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        !notification.read ? iconConfig.bg : 'bg-gray-100'
                      }`}
                    >
                      <IconComponent
                        className={`w-6 h-6 ${
                          !notification.read ? iconConfig.color : 'text-gray-400'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <h3
                            className={`font-semibold ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3">{notification.message}</p>

                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            Segna come letta
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
