import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { toast } from 'sonner';

export interface CampusEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  event_type: string;
  created_by: string;
  faculty: string | null;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export function useCampusEvents(month?: Date) {
  return useQuery({
    queryKey: ['campus_events', month?.toISOString()],
    queryFn: async () => {
      let query = supabase.from('campus_events').select('*').order('event_date', { ascending: true });
      
      if (month) {
        const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0];
        query = query.gte('event_date', start).lte('event_date', end);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CampusEvent[];
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (event: { title: string; description?: string; event_date: string; start_time?: string; end_time?: string; location?: string; event_type: string; is_global?: boolean }) => {
      const { error } = await supabase.from('campus_events').insert({
        ...event,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campus_events'] });
      toast.success('Event created!');
    },
    onError: () => toast.error('Failed to create event'),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campus_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campus_events'] });
      toast.success('Event deleted');
    },
  });
}
