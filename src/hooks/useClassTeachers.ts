import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useClassTeachers(classId?: string) {
  return useQuery({
    queryKey: ['class_teachers', classId],
    queryFn: async () => {
      if (!classId) return [];
      const { data, error } = await supabase
        .from('class_teachers')
        .select('*, teachers(*)')
        .eq('class_id', classId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });
}

export function useClassTeachersBySubject(subjectId?: string) {
  return useQuery({
    queryKey: ['class_teachers_by_subject', subjectId],
    queryFn: async () => {
      if (!subjectId) return [];
      
      // Get all classes for this subject
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('subject_id', subjectId);
      
      if (classError) throw classError;
      if (!classes?.length) return [];
      
      // Get unique teacher IDs from all these classes
      const classIds = classes.map(c => c.id);
      const { data, error } = await supabase
        .from('class_teachers')
        .select('teacher_id, teachers(*)')
        .in('class_id', classIds);
      
      if (error) throw error;
      
      // Return unique teachers
      const uniqueTeachers = new Map();
      data?.forEach(ct => {
        if (ct.teachers && !uniqueTeachers.has(ct.teacher_id)) {
          uniqueTeachers.set(ct.teacher_id, ct.teachers);
        }
      });
      
      return Array.from(uniqueTeachers.values());
    },
    enabled: !!subjectId,
  });
}

export function useSetClassTeachers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ classId, teacherIds }: { classId: string; teacherIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Delete existing class_teachers for this class
      await supabase
        .from('class_teachers')
        .delete()
        .eq('class_id', classId);
      
      // Insert new ones
      if (teacherIds.length > 0) {
        const { error } = await supabase
          .from('class_teachers')
          .insert(
            teacherIds.map(teacherId => ({
              class_id: classId,
              teacher_id: teacherId,
              user_id: user.id,
            }))
          );
        
        if (error) throw error;
      }
    },
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({ queryKey: ['class_teachers', classId] });
      queryClient.invalidateQueries({ queryKey: ['class_teachers_by_subject'] });
    },
    onError: (error) => {
      toast.error('Failed to update teachers: ' + error.message);
    },
  });
}
