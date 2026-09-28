import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { toast } from 'sonner';

export interface TutorProfile {
  id: string;
  user_id: string;
  subjects: string[];
  availability: string | null;
  rate: string;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tutor_name?: string;
  tutor_username?: string;
  tutor_faculty?: string;
  tutor_semester?: number;
}

export function useTutorProfiles(subjectFilter?: string) {
  return useQuery({
    queryKey: ['tutor_profiles', subjectFilter],
    queryFn: async () => {
      let query = supabase.from('tutor_profiles').select('*').eq('is_active', true);
      
      if (subjectFilter) {
        query = query.contains('subjects', [subjectFilter]);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as TutorProfile[];
    },
  });
}

export function useMyTutorProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tutor_profiles', 'mine'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as TutorProfile | null;
    },
    enabled: !!user,
  });
}

export function useUpsertTutorProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (profile: { subjects: string[]; availability?: string; rate?: string; bio?: string; is_active?: boolean }) => {
      // Fetch user profile for identity
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name, username, faculty, semester')
        .eq('user_id', user!.id)
        .single();

      const profileWithIdentity = {
        ...profile,
        tutor_name: userProfile?.name || 'Unknown',
        tutor_username: userProfile?.username || null,
        tutor_faculty: userProfile?.faculty || null,
        tutor_semester: userProfile?.semester || null,
      };

      const { data: existing } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase.from('tutor_profiles').update(profileWithIdentity).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tutor_profiles').insert({ ...profileWithIdentity, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor_profiles'] });
      toast.success('Tutor profile saved!');
    },
    onError: () => toast.error('Failed to save profile'),
  });
}

export function useDeleteTutorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tutor_profiles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor_profiles'] });
      toast.success('Profile removed');
    },
  });
}
