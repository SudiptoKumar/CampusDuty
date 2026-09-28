import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Database } from '@/integrations/supabase/types';

type Attendance = Database['public']['Tables']['attendance']['Row'];
type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];
type AttendanceUpdate = Database['public']['Tables']['attendance']['Update'];

export function useAttendance() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['attendance', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Attendance[];
    },
    enabled: !!user,
  });
}

export function useAttendanceBySubject(subjectId: string | undefined) {
  const { data: attendance } = useAttendance();
  return attendance?.filter((a) => a.subject_id === subjectId) ?? [];
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (record: Omit<AttendanceInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('attendance')
        .insert({ ...record, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance recorded');
    },
    onError: (error) => {
      toast.error('Failed to record attendance: ' + error.message);
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: AttendanceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance updated');
    },
    onError: (error) => {
      toast.error('Failed to update attendance: ' + error.message);
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance record deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete attendance: ' + error.message);
    },
  });
}

// Calculate attendance stats for a subject
export function calculateAttendanceStats(records: Attendance[]) {
  const present = records.filter((a) => a.status === 'present').length;
  const absent = records.filter((a) => a.status === 'absent' && !a.excused).length;
  const excused = records.filter((a) => a.excused).length;
  const total = records.length;
  const rate = total > 0 ? (present / total) * 100 : 100;
  
  return { present, absent, excused, total, rate };
}
