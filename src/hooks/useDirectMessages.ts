import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  context_type: string;
  context_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  other_user_id: string;
  other_user_name: string;
  other_user_username: string;
  other_user_avatar: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  context_type: string;
  context_id: string | null;
}

export function useConversations(contextType?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['conversations', contextType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Group by conversation partner
      const convMap = new Map<string, Conversation>();
      for (const msg of (data as DirectMessage[])) {
        if (contextType && msg.context_type !== contextType) continue;
        const otherId = msg.sender_id === user!.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            other_user_id: otherId,
            other_user_name: '',
            other_user_username: '',
            other_user_avatar: '',
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread_count: 0,
            context_type: msg.context_type,
            context_id: msg.context_id,
          });
        }
        const conv = convMap.get(otherId)!;
        if (msg.receiver_id === user!.id && !msg.is_read) {
          conv.unread_count++;
        }
      }
      const conversations = Array.from(convMap.values());
      
      // Fetch real names for all conversation partners
      const otherIds = conversations.map(c => c.other_user_id);
      if (otherIds.length > 0) {
        const { data: profiles } = await supabase.rpc('get_public_profiles', { _user_ids: otherIds });
        const profileMap = new Map(
          (profiles || []).map((p: any) => [p.user_id, { name: p.name, username: p.username, avatar_url: p.avatar_url }])
        );
        for (const conv of conversations) {
          const profile = profileMap.get(conv.other_user_id);
          if (profile) {
            conv.other_user_name = profile.name;
            conv.other_user_username = profile.username || '';
            conv.other_user_avatar = profile.avatar_url || '';
          }
        }
      }
      
      return conversations;
    },
    enabled: !!user,
  });
}

export function useChatMessages(otherUserId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to realtime
  useEffect(() => {
    if (!user || !otherUserId) return;
    const channel = supabase
      .channel(`dm-${otherUserId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['chat_messages', otherUserId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['unread_message_count'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, otherUserId, queryClient]);

  return useQuery({
    queryKey: ['chat_messages', otherUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user!.id})`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as DirectMessage[];
    },
    enabled: !!user && !!otherUserId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ receiverId, content, contextType = 'marketplace', contextId }: {
      receiverId: string; content: string; contextType?: string; contextId?: string;
    }) => {
      const { error } = await supabase.from('direct_messages').insert({
        sender_id: user!.id,
        receiver_id: receiverId,
        content,
        context_type: contextType,
        context_id: contextId || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat_messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => toast.error('Failed to send message'),
  });
}

export function useMarkAsRead(otherUserId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!otherUserId) return;
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true } as any)
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread_message_count'] });
    },
  });
}

export function useUnreadMessageCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['unread_message_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
