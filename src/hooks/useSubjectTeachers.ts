import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSubjectTeachers(subjectId: string | undefined) {
  return useQuery({
    queryKey: ['subject-teachers', subjectId],
    queryFn: async () => {
      if (!subjectId) return [];
      
      const { data, error } = await supabase
        .from('subject_teachers')
        .select(`
          id,
          teacher_id,
          teachers (
            id,
            first_name,
            last_name
          )
        `)
        .eq('subject_id', subjectId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!subjectId,
  });
}

export function useSetSubjectTeachers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ subjectId, teacherIds }: { subjectId: string; teacherIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Delete existing teachers for this subject
      const { error: deleteError } = await supabase
        .from('subject_teachers')
        .delete()
        .eq('subject_id', subjectId);
      
      if (deleteError) throw deleteError;
      
      // Insert new teachers if any
      if (teacherIds.length > 0) {
        const insertData = teacherIds.map(teacherId => ({
          subject_id: subjectId,
          teacher_id: teacherId,
          user_id: user.id,
        }));
        
        const { error: insertError } = await supabase
          .from('subject_teachers')
          .insert(insertData);
        
        if (insertError) throw insertError;
      }
      
      return { subjectId, teacherIds };
    },
    onSuccess: (_, { subjectId }) => {
      queryClient.invalidateQueries({ queryKey: ['subject-teachers', subjectId] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (error) => {
      toast.error('Failed to update teachers', { duration: 1000 });
      console.error('Error updating subject teachers:', error);
    },
  });
}
