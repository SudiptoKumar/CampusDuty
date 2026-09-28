import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Helper to call RPCs not yet in generated types
const rpc = (fn: string, args?: Record<string, unknown>) =>
  (supabase.rpc as any)(fn, args);

// Block user
export function useBlockUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, reason, expiresAt }: { userId: string; reason?: string; expiresAt?: string }) => {
      const { data, error } = await rpc('block_user', {
        _target_user_id: userId,
        _reason: reason || null,
        _expires_at: expiresAt || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User blocked successfully');
    },
    onError: (error: Error) => toast.error('Failed to block user: ' + error.message),
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await rpc('unblock_user', { _target_user_id: userId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User unblocked');
    },
    onError: (error: Error) => toast.error('Failed to unblock: ' + error.message),
  });
}

export function useSoftDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await rpc('soft_delete_user', { _target_user_id: userId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User soft deleted');
    },
    onError: (error: Error) => toast.error('Failed: ' + error.message),
  });
}

export function useHardDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await rpc('hard_delete_user', { _target_user_id: userId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User permanently deleted');
    },
    onError: (error: Error) => toast.error('Failed: ' + error.message),
  });
}

export function useShadowBanUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, ban }: { userId: string; ban: boolean }) => {
      const { data, error } = await rpc('shadow_ban_user', {
        _target_user_id: userId,
        _ban: ban,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_: unknown, { ban }: { userId: string; ban: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(ban ? 'User shadow banned' : 'Shadow ban removed');
    },
    onError: (error: Error) => toast.error('Failed: ' + error.message),
  });
}

export function usePromoteToAdmin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await rpc('promote_to_admin', { _target_user_id: userId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User promoted to Admin');
    },
    onError: (error: Error) => toast.error('Failed: ' + error.message),
  });
}

export function useDemoteFromAdmin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await rpc('demote_from_admin', { _target_user_id: userId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin role removed');
    },
    onError: (error: Error) => toast.error('Failed: ' + error.message),
  });
}

export function useAdminUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, name, bio, faculty, semester }: {
      userId: string;
      name?: string;
      bio?: string;
      faculty?: string;
      semester?: number;
    }) => {
      const { data, error } = await rpc('admin_update_user_profile', {
        _target_user_id: userId,
        _name: name || null,
        _bio: bio || null,
        _faculty: faculty || null,
        _semester: semester || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Profile updated');
    },
    onError: (error: Error) => toast.error('Failed: ' + error.message),
  });
}

// Audit logs
export function useAdminAuditLogs(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['admin-audit-logs', limit, offset],
    queryFn: async () => {
      const { data, error } = await rpc('get_admin_audit_logs', {
        _limit: limit,
        _offset: offset,
      });
      if (error) throw error;
      return (data as unknown) as Array<{
        id: string;
        admin_id: string;
        admin_name: string;
        action: string;
        target_id: string | null;
        target_type: string | null;
        reason: string | null;
        metadata: Record<string, unknown>;
        created_at: string;
      }>;
    },
    staleTime: 30 * 1000,
  });
}

// User insight
export function useUserInsight(userId: string | null) {
  return useQuery({
    queryKey: ['user-insight', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await rpc('get_user_insight', { _target_user_id: userId });
      if (error) throw error;
      return (data as unknown) as {
        profile: Record<string, unknown>;
        posts: Array<Record<string, unknown>>;
        blocks: Array<Record<string, unknown>>;
      };
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

// Search posts
export function useAdminSearchPosts(keyword: string) {
  return useQuery({
    queryKey: ['admin-search-posts', keyword],
    queryFn: async () => {
      const { data, error } = await rpc('admin_search_posts', {
        _keyword: keyword,
        _limit: 50,
      });
      if (error) throw error;
      return (data as unknown) as Array<{
        id: string;
        user_id: string;
        author_name: string;
        content: string;
        faculty: string | null;
        semester: number | null;
        is_pinned: boolean;
        is_shadow_banned: boolean;
        is_verified: boolean;
        created_at: string;
      }>;
    },
    enabled: keyword.length >= 2,
    staleTime: 30 * 1000,
  });
}

// Maintenance mode
export function useMaintenanceMode() {
  return useQuery({
    queryKey: ['maintenance-mode'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('system_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();
      if (error) throw error;
      return data?.value === true;
    },
    staleTime: 60 * 1000,
  });
}

export function useToggleMaintenanceMode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data, error } = await rpc('toggle_maintenance_mode', { _enabled: enabled });
      if (error) throw error;
      return data;
    },
    onSuccess: (_: unknown, enabled: boolean) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-mode'] });
      toast.success(enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
    },
    onError: (error: Error) => toast.error('Failed: ' + error.message),
  });
}

// Check if current user is blocked
export function useIsUserBlocked(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-blocked', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await rpc('is_user_blocked', { _user_id: userId });
      if (error) throw error;
      const results = data as unknown as Array<{ is_blocked: boolean; reason: string | null; expires_at: string | null }> | null;
      if (results && results.length > 0) {
        return results[0];
      }
      return null;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}
