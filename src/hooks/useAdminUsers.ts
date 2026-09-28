import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from './usePermission';

interface UserWithRole {
  user_id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  role: AppRole;
  faculty: string | null;
  semester: number | null;
  is_shadow_banned: boolean;
  is_soft_deleted: boolean;
  is_blocked: boolean;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_users_for_admin');
      
      if (error) throw error;
      return data as UserWithRole[];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function usePromoteToCR() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.rpc('promote_to_cr', {
        _target_user_id: targetUserId,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User promoted to CR!');
    },
    onError: (error) => {
      toast.error('Failed to promote user: ' + error.message);
    },
  });
}

export function useDemoteFromCR() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.rpc('demote_from_cr', {
        _target_user_id: targetUserId,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User demoted from CR');
    },
    onError: (error) => {
      toast.error('Failed to demote user: ' + error.message);
    },
  });
}

// Bulk operations
export function useBulkPromoteCRs() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userIds: string[]) => {
      const results = await Promise.allSettled(
        userIds.map(userId => 
          supabase.rpc('promote_to_cr', { _target_user_id: userId })
        )
      );
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      return { succeeded, failed };
    },
    onSuccess: ({ succeeded, failed }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (failed === 0) {
        toast.success(`Successfully promoted ${succeeded} users to CR`);
      } else {
        toast.warning(`Promoted ${succeeded}, failed ${failed}`);
      }
    },
    onError: (error) => {
      toast.error('Bulk promotion failed: ' + error.message);
    },
  });
}

export function useBulkDemoteCRs() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userIds: string[]) => {
      const results = await Promise.allSettled(
        userIds.map(userId => 
          supabase.rpc('demote_from_cr', { _target_user_id: userId })
        )
      );
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      return { succeeded, failed };
    },
    onSuccess: ({ succeeded, failed }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (failed === 0) {
        toast.success(`Successfully removed CR from ${succeeded} users`);
      } else {
        toast.warning(`Removed ${succeeded}, failed ${failed}`);
      }
    },
    onError: (error) => {
      toast.error('Bulk demotion failed: ' + error.message);
    },
  });
}
