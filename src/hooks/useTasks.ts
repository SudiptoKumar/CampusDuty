import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export function useTasks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date');
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function usePendingTasks() {
  const { data: tasks } = useTasks();
  return tasks?.filter((t) => !t.is_completed).sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  ) ?? [];
}

export function useCompletedTasks() {
  const { data: tasks } = useTasks();
  return tasks?.filter((t) => t.is_completed).sort(
    (a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
  ) ?? [];
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (task: Omit<TaskInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created');
    },
    onError: (error) => {
      toast.error('Failed to create task: ' + error.message);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: TaskUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error('Failed to update task: ' + error.message);
    },
  });
}

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ is_completed })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (data.is_completed) {
        toast.success('Task completed!');
        
        // Auto-create next occurrence for recurring tasks
        if (data.recurrence_rule && user) {
          const nextDate = calculateNextDate(data.due_date, data.recurrence_rule);
          if (nextDate) {
            await supabase.from('tasks').insert({
              title: data.title,
              subject_id: data.subject_id,
              due_date: nextDate,
              due_time: data.due_time,
              type: data.type,
              priority: data.priority,
              notes: data.notes,
              is_completed: false,
              subtasks: [],
              attachments: [],
              recurrence_rule: data.recurrence_rule,
              user_id: user.id,
            });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Next recurring task created');
          }
        }
      }
    },
    onError: (error) => {
      toast.error('Failed to update task: ' + error.message);
    },
  });
}

function calculateNextDate(currentDate: string, rule: string): string | null {
  const date = new Date(currentDate);
  switch (rule) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return null;
  }
  return date.toISOString().split('T')[0];
}

export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: TaskUpdate }) => {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tasks updated');
    },
    onError: (error) => {
      toast.error('Failed to update tasks: ' + error.message);
    },
  });
}

export function useBulkDeleteTasks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tasks deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete tasks: ' + error.message);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete task: ' + error.message);
    },
  });
}
