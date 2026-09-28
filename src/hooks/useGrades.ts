import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Database } from '@/integrations/supabase/types';

type Grade = Database['public']['Tables']['grades']['Row'];
type GradeInsert = Database['public']['Tables']['grades']['Insert'];
type GradeUpdate = Database['public']['Tables']['grades']['Update'];

export function useGrades() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['grades', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Grade[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useGradesByTerm(termId: string | undefined) {
  const { data: grades } = useGrades();
  return grades?.filter((g) => g.term_id === termId) ?? [];
}

export function useCreateGrade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (grade: Omit<GradeInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('grades')
        .insert({ ...grade, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade added');
    },
    onError: (error) => {
      toast.error('Failed to add grade: ' + error.message);
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: GradeUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('grades')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade updated');
    },
    onError: (error) => {
      toast.error('Failed to update grade: ' + error.message);
    },
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete grade: ' + error.message);
    },
  });
}

// Calculate weighted average
export function calculateWeightedAverage(grades: Grade[]) {
  if (grades.length === 0) return null;
  
  const totalWeight = grades.reduce((sum, g) => sum + Number(g.weight), 0);
  const weightedSum = grades.reduce(
    (sum, g) => sum + (Number(g.value) / Number(g.max_score)) * 100 * Number(g.weight),
    0
  );
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// Convert percentage to 4.0 GPA scale
export function percentageToGPA(percentage: number): number {
  if (percentage >= 90) return 4.0;
  if (percentage >= 85) return 3.7;
  if (percentage >= 80) return 3.3;
  if (percentage >= 75) return 3.0;
  if (percentage >= 70) return 2.7;
  if (percentage >= 65) return 2.3;
  if (percentage >= 60) return 2.0;
  if (percentage >= 55) return 1.7;
  if (percentage >= 50) return 1.3;
  if (percentage >= 45) return 1.0;
  return 0.0;
}

// Calculate cumulative GPA from all grades
export function calculateGPA(grades: Grade[]): number | null {
  if (grades.length === 0) return null;
  const avg = calculateWeightedAverage(grades);
  if (avg === null || avg === 0) return null;
  return percentageToGPA(avg);
}

// Calculate per-subject GPA breakdown
export function calculateSubjectGPAs(
  grades: Grade[],
  subjects: { id: string; name: string; color: string }[]
): { subjectId: string; name: string; color: string; gpa: number; percentage: number }[] {
  return subjects
    .map((subject) => {
      const subjectGrades = grades.filter(g => g.subject_id === subject.id);
      const avg = calculateWeightedAverage(subjectGrades);
      if (avg === null || subjectGrades.length === 0) return null;
      return {
        subjectId: subject.id,
        name: subject.name,
        color: subject.color,
        gpa: percentageToGPA(avg),
        percentage: avg,
      };
    })
    .filter(Boolean) as { subjectId: string; name: string; color: string; gpa: number; percentage: number }[];
}
