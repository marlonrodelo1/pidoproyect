import { supabase } from '../ services/supabaseClient';

const withUserFilter = (query, userId) => {
  if (!userId) return query;
  return query.eq('user_id', userId);
};

export const loadNotifications = async (userId = null) => {
  if (!supabase) {
    console.error('[notificationService] Supabase client is not initialized');
    return [];
  }

  const query = withUserFilter(
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false }),
    userId,
  );

  const { data, error } = await query;

  if (error) {
    console.error('[notificationService] Error loading notifications:', error);
    return [];
  }

  return data || [];
};

export const markAsRead = async (userId = null) => {
  if (!supabase) {
    console.error('[notificationService] Supabase client is not initialized');
    return;
  }

  const query = withUserFilter(
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false),
    userId,
  );

  const { error } = await query;

  if (error) {
    console.error('[notificationService] Error marking notifications as read:', error);
  }
};

export const getUnreadCount = async (userId = null) => {
  if (!supabase) {
    console.error('[notificationService] Supabase client is not initialized');
    return 0;
  }

  const query = withUserFilter(
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false),
    userId,
  );

  const { count, error } = await query;

  if (error) {
    console.error('[notificationService] Error getting unread notifications count:', error);
    return 0;
  }

  return count || 0;
};

export const subscribeToNotifications = (handler, userId = null) => {
  if (!supabase) {
    console.error('[notificationService] Supabase client is not initialized');
    return () => {};
  }

  const channel = supabase
    .channel('notifications-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        ...(userId
          ? {
              filter: `user_id=eq.${userId}`,
            }
          : {}),
      },
      (payload) => {
        if (typeof handler === 'function') {
          handler(payload);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
