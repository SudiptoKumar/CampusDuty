import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthProvider';

interface SharedLinkData {
  subjects?: any[];
  teachers?: any[];
  classes?: any[];
  class_teachers?: any[];
  subject_teachers?: any[];
}

export interface SharedLink {
  id: string;
  user_id: string;
  token: string;
  title: string;
  share_code: string | null;
  include_subjects: boolean;
  include_teachers: boolean;
  include_classes: boolean;
  data: SharedLinkData;
  expires_at: string | null;
  created_at: string;
  view_count: number;
}

interface CreateShareInput {
  title: string;
  includeSubjects: boolean;
  includeTeachers: boolean;
  includeClasses: boolean;
  expiresAt?: Date;
}

export function useSharedLinks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['shared-links', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('shared_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SharedLink[];
    },
    enabled: !!user,
  });
}

export function useSharedLinkByToken(token: string | null) {
  return useQuery({
    queryKey: ['shared-link', token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await supabase
        .rpc('get_shared_link_by_token', { _token: token });
      if (error) throw error;
      const links = data as SharedLink[] | null;
      return links && links.length > 0 ? links[0] : null;
    },
    enabled: !!token,
  });
}

export function useSharedLinkByCode(code: string | null) {
  return useQuery({
    queryKey: ['shared-link-code', code],
    queryFn: async () => {
      if (!code) return null;
      const { data, error } = await supabase
        .rpc('get_shared_link_by_code', { _code: code });
      if (error) throw error;
      const links = data as SharedLink[] | null;
      return links && links.length > 0 ? links[0] : null;
    },
    enabled: !!code && code.length === 6,
  });
}

export function useImportHistory(sharedLinkId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['import-history', user?.id, sharedLinkId],
    queryFn: async () => {
      if (!user || !sharedLinkId) return null;
      const { data, error } = await supabase
        .from('import_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('shared_link_id', sharedLinkId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!sharedLinkId,
  });
}

export function useCreateSharedLink() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateShareInput) => {
      if (!user) throw new Error('Not authenticated');

      // Fetch the user's profile to embed owner_name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, faculty, semester')
        .eq('user_id', user.id)
        .maybeSingle();

      // Gather data to share - include IDs for proper mapping during import
      const shareData: SharedLinkData & { owner_name?: string } = {};
      if (profile?.name) {
        shareData.owner_name = profile.name;
      }

      // Always fetch subjects with IDs for proper class->subject mapping
      if (input.includeSubjects) {
        const { data: subjects } = await supabase
          .from('subjects')
          .select('id, name, color, icon, room')
          .eq('user_id', user.id);
        shareData.subjects = subjects || [];

        // Also get subject-teacher relationships
        const { data: subjectTeachers } = await supabase
          .from('subject_teachers')
          .select('subject_id, teacher_id')
          .eq('user_id', user.id);
        shareData.subject_teachers = subjectTeachers || [];
      }

      // Always fetch teachers with IDs for proper relationship mapping
      if (input.includeTeachers) {
        const { data: teachers } = await supabase
          .from('teachers')
          .select('id, first_name, last_name, email, phone, address, office_hours, website')
          .eq('user_id', user.id);
        shareData.teachers = teachers || [];
      }

      if (input.includeClasses) {
        const { data: classes } = await supabase
          .from('classes')
          .select('id, day, start_time, end_time, room, type, recurrence, notes, subject_id')
          .eq('user_id', user.id);
        shareData.classes = classes || [];

        // Also get class-teacher relationships
        const { data: classTeachers } = await supabase
          .from('class_teachers')
          .select('class_id, teacher_id')
          .eq('user_id', user.id);
        shareData.class_teachers = classTeachers || [];
      }

      const { data, error } = await supabase
        .from('shared_links')
        .insert([{
          user_id: user.id,
          title: input.title,
          include_subjects: input.includeSubjects,
          include_teachers: input.includeTeachers,
          include_classes: input.includeClasses,
          data: shareData as any,
          expires_at: input.expiresAt?.toISOString() || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as SharedLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-links'] });
      toast.success('Share link created!');
    },
    onError: (error) => {
      toast.error('Failed to create share link: ' + error.message);
    },
  });
}

export function useDeleteSharedLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shared_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-links'] });
      toast.success('Share link deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });
}

export function useImportSharedData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      token, 
      importSubjects, 
      importTeachers, 
      importClasses 
    }: { 
      token: string; 
      importSubjects: boolean; 
      importTeachers: boolean; 
      importClasses: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Fetch the shared data using security definer function
      const { data: sharedLinks, error: fetchError } = await supabase
        .rpc('get_shared_link_by_token', { _token: token });

      if (fetchError) throw new Error('Share link not found');
      const sharedLink = (sharedLinks as SharedLink[] | null)?.[0];
      if (!sharedLink) throw new Error('Share link not found or expired');

      const data = sharedLink.data as SharedLinkData;
      const idMappings: Record<string, Record<string, string>> = {
        teachers: {},
        subjects: {},
        classes: {},
      };

      // Import teachers first (needed for subject/class relationships)
      if (importTeachers && data.teachers?.length) {
        console.log(`[Share Import] Processing ${data.teachers.length} teachers...`);
        for (const teacher of data.teachers) {
          try {
            const originalId = teacher.id;
            const { id, ...teacherData } = teacher;
            
            const cleanTeacherData = {
              first_name: teacherData.first_name || 'Unknown',
              last_name: teacherData.last_name || '',
              email: teacherData.email || null,
              phone: teacherData.phone || null,
              address: teacherData.address || null,
              office_hours: teacherData.office_hours || null,
              website: teacherData.website || null,
              user_id: user.id,
            };
            
            const { data: newTeacher, error } = await supabase
              .from('teachers')
              .insert([cleanTeacherData])
              .select('id')
              .single();
            
            if (error) {
              console.error(`[Share Import] Teacher "${teacherData.first_name}" failed:`, error.message);
            } else if (newTeacher && originalId) {
              idMappings.teachers[originalId] = newTeacher.id;
            }
          } catch (e) {
            console.error(`[Share Import] Teacher error:`, e);
          }
        }
        console.log(`[Share Import] Imported ${Object.keys(idMappings.teachers).length} teachers`);
      }

      // Import subjects with proper ID mapping
      if (importSubjects && data.subjects?.length) {
        console.log(`[Share Import] Processing ${data.subjects.length} subjects...`);
        for (const subject of data.subjects) {
          try {
            const originalId = subject.id;
            
            const cleanSubjectData = {
              name: subject.name || 'Unnamed Subject',
              color: subject.color || '#5F6AF7',
              icon: subject.icon || null,
              room: subject.room || null,
              user_id: user.id,
            };
            
            const { data: newSubject, error } = await supabase
              .from('subjects')
              .insert([cleanSubjectData])
              .select('id')
              .single();
            
            if (error) {
              console.error(`[Share Import] Subject "${subject.name}" failed:`, error.message);
            } else if (newSubject && originalId) {
              idMappings.subjects[originalId] = newSubject.id;
            }
          } catch (e) {
            console.error(`[Share Import] Subject error:`, e);
          }
        }
        console.log(`[Share Import] Imported ${Object.keys(idMappings.subjects).length} subjects`);

        // Import subject-teacher relationships if both were imported
        if (importTeachers && data.subject_teachers?.length) {
          console.log(`[Share Import] Processing ${data.subject_teachers.length} subject-teacher relationships...`);
          let stCount = 0;
          for (const st of data.subject_teachers) {
            try {
              const newSubjectId = idMappings.subjects[st.subject_id];
              const newTeacherId = idMappings.teachers[st.teacher_id];
              if (newSubjectId && newTeacherId) {
                const { error } = await supabase
                  .from('subject_teachers')
                  .insert([{
                    subject_id: newSubjectId,
                    teacher_id: newTeacherId,
                    user_id: user.id,
                  }]);
                if (!error) stCount++;
              }
            } catch (e) {
              console.error(`[Share Import] Subject-teacher relationship error:`, e);
            }
          }
          console.log(`[Share Import] Created ${stCount} subject-teacher relationships`);
        }
      }

      // Import classes with proper subject_id mapping
      if (importClasses && data.classes?.length) {
        console.log(`[Share Import] Processing ${data.classes.length} classes...`);
        const validClassTypes = ['lecture', 'lab', 'seminar', 'tutorial'];
        const typeMapping: Record<string, string> = {
          'practical': 'lab',
          'practice': 'lab',
          'workshop': 'seminar',
          'class': 'lecture',
        };

        for (const cls of data.classes) {
          try {
            const originalId = cls.id;
            const originalSubjectId = cls.subject_id;
            
            const newSubjectId = importSubjects ? idMappings.subjects[originalSubjectId] : null;
            
            if (!newSubjectId) {
              console.warn(`[Share Import] Skipping class - no subject mapping for ${originalSubjectId}`);
              continue;
            }

            let classType = cls.type?.toLowerCase() || 'lecture';
            if (!validClassTypes.includes(classType)) {
              classType = typeMapping[classType] || 'lecture';
            }

            const validRecurrenceTypes = ['weekly', 'biweekly', 'custom'];
            let recurrence = cls.recurrence?.toLowerCase() || 'weekly';
            if (!validRecurrenceTypes.includes(recurrence)) {
              recurrence = 'weekly';
            }

            const { data: newClass, error } = await supabase
              .from('classes')
              .insert([{
                day: cls.day,
                start_time: cls.start_time,
                end_time: cls.end_time,
                room: cls.room || null,
                type: classType as any,
                recurrence: recurrence as any,
                notes: cls.notes || null,
                subject_id: newSubjectId,
                user_id: user.id,
              }])
              .select('id')
              .single();

            if (error) {
              console.error(`[Share Import] Class failed:`, error.message);
            } else if (newClass && originalId) {
              idMappings.classes[originalId] = newClass.id;
            }
          } catch (e) {
            console.error(`[Share Import] Class error:`, e);
          }
        }
        console.log(`[Share Import] Imported ${Object.keys(idMappings.classes).length} classes`);

        // Import class-teacher relationships if both were imported
        if (importTeachers && data.class_teachers?.length) {
          console.log(`[Share Import] Processing ${data.class_teachers.length} class-teacher relationships...`);
          let ctCount = 0;
          for (const ct of data.class_teachers) {
            try {
              const newClassId = idMappings.classes[ct.class_id];
              const newTeacherId = idMappings.teachers[ct.teacher_id];
              if (newClassId && newTeacherId) {
                const { error } = await supabase
                  .from('class_teachers')
                  .insert([{
                    class_id: newClassId,
                    teacher_id: newTeacherId,
                    user_id: user.id,
                  }]);
                if (!error) ctCount++;
              }
            } catch (e) {
              console.error(`[Share Import] Class-teacher relationship error:`, e);
            }
          }
          console.log(`[Share Import] Created ${ctCount} class-teacher relationships`);
        }
      }

      console.log('[Share Import] Complete! Summary:', {
        teachers: Object.keys(idMappings.teachers).length,
        subjects: Object.keys(idMappings.subjects).length,
        classes: Object.keys(idMappings.classes).length,
      });

      // Update view count
      await supabase.rpc('increment_shared_link_view_count', { _token: token });

      // Record import history to prevent duplicates
      await supabase.from('import_history').insert([{
        user_id: user.id,
        shared_link_id: sharedLink.id,
      }]);

      return { 
        imported: {
          teachers: Object.keys(idMappings.teachers).length,
          subjects: Object.keys(idMappings.subjects).length,
          classes: Object.keys(idMappings.classes).length,
        }
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['subject-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['all-subject-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['class-teachers'] });
      toast.success(`Imported ${result.imported.subjects} subjects, ${result.imported.teachers} teachers, ${result.imported.classes} classes!`);
    },
    onError: (error) => {
      toast.error('Failed to import: ' + error.message);
    },
  });
}
