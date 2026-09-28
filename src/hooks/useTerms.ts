import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Database } from '@/integrations/supabase/types';

type Term = Database['public']['Tables']['terms']['Row'];
type TermInsert = Database['public']['Tables']['terms']['Insert'];

export function useTerms() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['terms', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('terms')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as Term[];
    },
    enabled: !!user,
  });
}

export function useCreateTerm() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (term: Omit<TermInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('terms')
        .insert({ ...term, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      toast.success('Term created');
    },
    onError: (error) => {
      toast.error('Failed to create term: ' + error.message);
    },
  });
}

export function useDeleteTerm() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('terms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      toast.success('Term deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete term: ' + error.message);
    },
  });
}
