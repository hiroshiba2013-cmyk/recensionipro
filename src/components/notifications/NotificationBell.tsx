import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (!user) return;

    loadUnreadCount();

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadUnreadCount() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_unread_notification_count');

      if (error) throw error;
      setUnreadCount(data || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative flex items-center gap-0.5 text-gray-700 hover:text-blue-600 transition-colors font-medium"
        title="Notifiche"
      >
        <div className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[16px] h-4">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-xs">Notifiche</span>
      </button>

      {showPanel && (
        <NotificationPanel
          onClose={() => setShowPanel(false)}
          onNotificationRead={loadUnreadCount}
        />
      )}
    </div>
  );
}
