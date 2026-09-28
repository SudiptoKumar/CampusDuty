import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { useEffect } from 'react';

export interface ActivityNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  reference_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
  actor_name?: string;
  actor_avatar_url?: string;
}

export function usePersonalNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('personal-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_activity_notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['personal-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['personal-unread-count'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['personal-notifications'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_activity_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      
      const notifications = data as ActivityNotification[];
      
      // Fetch actor names
      const actorIds = [...new Set(notifications.map(n => n.actor_id))];
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase.rpc('get_public_profiles', { _user_ids: actorIds });
        const profileMap = new Map(
          (profiles || []).map((p: any) => [p.user_id, { name: p.name, avatar_url: p.avatar_url }])
        );
        for (const n of notifications) {
          const profile = profileMap.get(n.actor_id);
          if (profile) {
            n.actor_name = profile.name;
            n.actor_avatar_url = profile.avatar_url;
          }
        }
      }
      
      return notifications;
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

export function usePersonalUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['personal-unread-count'],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('user_activity_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useMarkPersonalNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (notificationIds?: string[]) => {
      if (!user) throw new Error('Not authenticated');
      let query = supabase
        .from('user_activity_notifications')
        .update({ is_read: true } as any)
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (notificationIds) {
        query = query.in('id', notificationIds);
      }
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['personal-unread-count'] });
    },
  });
}
