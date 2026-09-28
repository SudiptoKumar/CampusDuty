import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAllSubjectTeachers() {
  return useQuery({
    queryKey: ['all-subject-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subject_teachers')
        .select(`
          subject_id,
          teachers (
            id,
            first_name,
            last_name
          )
        `);
      
      if (error) throw error;
      
      // Group by subject_id for easy lookup
      const teachersBySubject: Record<string, { id: string; first_name: string; last_name: string }[]> = {};
      
      data?.forEach((item) => {
        if (!teachersBySubject[item.subject_id]) {
          teachersBySubject[item.subject_id] = [];
        }
        if (item.teachers) {
          teachersBySubject[item.subject_id].push(item.teachers as { id: string; first_name: string; last_name: string });
        }
      });
      
      return teachersBySubject;
    },
  });
}
