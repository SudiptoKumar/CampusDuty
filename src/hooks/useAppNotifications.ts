import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';

interface AppNotification {
  id: string;
  title: string;
  content: string;
  type: 'update' | 'feature' | 'announcement' | 'maintenance';
  created_at: string;
  is_active: boolean;
}

interface NotificationRead {
  notification_id: string;
  read_at: string;
}

export function useAppNotifications() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['app-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AppNotification[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useNotificationReads() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notification-reads'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_notification_reads')
        .select('notification_id, read_at')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as NotificationRead[];
    },
    enabled: !!user,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_notification_reads')
        .insert({
          user_id: user.id,
          notification_id: notificationId,
        });
      
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-reads'] });
    },
  });
}

export function useUnreadNotificationCount() {
  const { data: notifications } = useAppNotifications();
  const { data: reads } = useNotificationReads();
  
  const readIds = new Set(reads?.map(r => r.notification_id) || []);
  const unreadCount = notifications?.filter(n => !readIds.has(n.id)).length || 0;
  
  return unreadCount;
}

// Fetch ALL notifications (including inactive) for changelog
export function useAllAppNotifications() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['all-app-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AppNotification[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAppNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (notification: { title: string; content: string; type: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('app_notifications')
        .insert({
          ...notification,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['all-app-notifications'] });
    },
  });
}

export function useDeleteAppNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('app_notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['all-app-notifications'] });
    },
  });
}
