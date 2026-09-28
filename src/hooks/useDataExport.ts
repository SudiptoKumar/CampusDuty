import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExportData {
  version: string;
  exportedAt: string;
  subjects?: any[];
  teachers?: any[];
  classes?: any[];
  tasks?: any[];
  grades?: any[];
  attendance?: any[];
  terms?: any[];
  notes?: any[];
  subject_teachers?: any[];
  class_teachers?: any[];
}

export interface ImportResult {
  subjects: number;
  teachers: number;
  classes: number;
  tasks: number;
  grades: number;
  attendance: number;
  terms: number;
  notes: number;
}

export function useExportData() {
  return useMutation({
    mutationFn: async ({ 
      includeSubjects, 
      includeTeachers, 
      includeClasses,
      includeTasks,
      includeGrades,
      includeAttendance,
      includeTerms,
      includeNotes,
    }: { 
      includeSubjects?: boolean;
      includeTeachers?: boolean;
      includeClasses?: boolean;
      includeTasks?: boolean;
      includeGrades?: boolean;
      includeAttendance?: boolean;
      includeTerms?: boolean;
      includeNotes?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const exportData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
      };

      if (includeTeachers) {
        const { data: teachers } = await supabase
          .from('teachers')
          .select('id, first_name, last_name, email, phone, address, office_hours, website')
          .eq('user_id', user.id);
        exportData.teachers = teachers || [];
      }

      if (includeSubjects) {
        const { data: subjects } = await supabase
          .from('subjects')
          .select('id, name, color, icon, room, teacher_id')
          .eq('user_id', user.id);
        exportData.subjects = subjects || [];

        const { data: subjectTeachers } = await supabase
          .from('subject_teachers')
          .select('subject_id, teacher_id')
          .eq('user_id', user.id);
        exportData.subject_teachers = subjectTeachers || [];
      }

      if (includeClasses) {
        const { data: classes } = await supabase
          .from('classes')
          .select('id, day, start_time, end_time, room, type, recurrence, notes, subject_id')
          .eq('user_id', user.id);
        exportData.classes = classes || [];

        const { data: classTeachers } = await supabase
          .from('class_teachers')
          .select('class_id, teacher_id')
          .eq('user_id', user.id);
        exportData.class_teachers = classTeachers || [];
      }

      if (includeTerms) {
        const { data: terms } = await supabase
          .from('terms')
          .select('id, name, start_date, end_date')
          .eq('user_id', user.id);
        exportData.terms = terms || [];
      }

      if (includeTasks) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, due_date, due_time, type, priority, notes, is_completed, subtasks, attachments, subject_id')
          .eq('user_id', user.id);
        exportData.tasks = tasks || [];
      }

      if (includeGrades) {
        const { data: grades } = await supabase
          .from('grades')
          .select('id, value, max_score, weight, date, type, notes, subject_id, term_id')
          .eq('user_id', user.id);
        exportData.grades = grades || [];
      }

      if (includeAttendance) {
        const { data: attendance } = await supabase
          .from('attendance')
          .select('id, date, status, excused, notes, subject_id, class_id')
          .eq('user_id', user.id);
        exportData.attendance = attendance || [];
      }

      if (includeNotes) {
        const { data: notes } = await supabase
          .from('notes')
          .select('id, title, content, color, category, is_pinned')
          .eq('user_id', user.id);
        exportData.notes = notes || [];
      }

      return exportData;
    },
    onSuccess: (data) => {
      // Create and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campus-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    },
    onError: (error) => {
      toast.error('Failed to export: ' + error.message);
    },
  });
}

export interface ImportOptions {
  includeSubjects?: boolean;
  includeTeachers?: boolean;
  includeClasses?: boolean;
  includeTasks?: boolean;
  includeGrades?: boolean;
  includeAttendance?: boolean;
  includeTerms?: boolean;
  includeNotes?: boolean;
}

export function useImportFromFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileData, options }: { fileData: ExportData; options?: ImportOptions }): Promise<ImportResult> => {
      const opts: ImportOptions = options ?? {
        includeSubjects: true,
        includeTeachers: true,
        includeClasses: true,
        includeTasks: true,
        includeGrades: true,
        includeAttendance: true,
        includeTerms: true,
        includeNotes: true,
      };
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const result: ImportResult = {
        subjects: 0,
        teachers: 0,
        classes: 0,
        tasks: 0,
        grades: 0,
        attendance: 0,
        terms: 0,
        notes: 0,
      };

      const idMappings: Record<string, Record<string, string>> = {
        teachers: {},
        subjects: {},
        classes: {},
        terms: {},
      };

      const errors: string[] = [];

      // Import teachers first
      if (opts.includeTeachers && fileData.teachers?.length) {
        console.log(`[Import] Processing ${fileData.teachers.length} teachers...`);
        for (const teacher of fileData.teachers) {
          try {
            const originalId = teacher.id;
            const { id, ...teacherData } = teacher;
            
            // Ensure required fields have values
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
              console.error(`[Import] Teacher "${teacherData.first_name}" failed:`, error.message);
              errors.push(`Teacher: ${teacherData.first_name} - ${error.message}`);
            } else if (newTeacher && originalId) {
              idMappings.teachers[originalId] = newTeacher.id;
              result.teachers++;
            }
          } catch (e) {
            console.error(`[Import] Teacher error:`, e);
          }
        }
        console.log(`[Import] Successfully imported ${result.teachers}/${fileData.teachers.length} teachers`);
      }

      // Import terms (needed for grades)
      if (opts.includeTerms && fileData.terms?.length) {
        console.log(`[Import] Processing ${fileData.terms.length} terms...`);
        for (const term of fileData.terms) {
          try {
            const originalId = term.id;
            const { id, ...termData } = term;
            const { data: newTerm, error } = await supabase
              .from('terms')
              .insert([{ ...termData, user_id: user.id }])
              .select('id')
              .single();
            
            if (error) {
              console.error(`[Import] Term "${termData.name}" failed:`, error.message);
              errors.push(`Term: ${termData.name} - ${error.message}`);
            } else if (newTerm && originalId) {
              idMappings.terms[originalId] = newTerm.id;
              result.terms++;
            }
          } catch (e) {
            console.error(`[Import] Term error:`, e);
          }
        }
      }

      // Import subjects
      if (opts.includeSubjects && fileData.subjects?.length) {
        console.log(`[Import] Processing ${fileData.subjects.length} subjects...`);
        for (const subject of fileData.subjects) {
          try {
            const originalId = subject.id;
            const newTeacherId = subject.teacher_id ? idMappings.teachers[subject.teacher_id] : null;
            
            // Ensure required fields have values
            const cleanSubjectData = {
              name: subject.name || 'Unnamed Subject',
              color: subject.color || '#5F6AF7',
              icon: subject.icon || null,
              room: subject.room || null,
              teacher_id: newTeacherId,
              user_id: user.id,
            };
            
            const { data: newSubject, error } = await supabase
              .from('subjects')
              .insert([cleanSubjectData])
              .select('id')
              .single();
            
            if (error) {
              console.error(`[Import] Subject "${subject.name}" failed:`, error.message);
              errors.push(`Subject: ${subject.name} - ${error.message}`);
            } else if (newSubject && originalId) {
              idMappings.subjects[originalId] = newSubject.id;
              result.subjects++;
            }
          } catch (e) {
            console.error(`[Import] Subject error:`, e);
          }
        }
        console.log(`[Import] Successfully imported ${result.subjects}/${fileData.subjects.length} subjects`);

        // Import subject-teacher relationships - support multiple teachers per subject
        if (fileData.subject_teachers?.length) {
          console.log(`[Import] Processing ${fileData.subject_teachers.length} subject-teacher relationships...`);
          let stCount = 0;
          for (const st of fileData.subject_teachers) {
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
              console.error(`[Import] Subject-teacher relationship error:`, e);
            }
          }
          console.log(`[Import] Created ${stCount} subject-teacher relationships`);
        }
      }

      // Import classes
      if (opts.includeClasses && fileData.classes?.length) {
        console.log(`[Import] Processing ${fileData.classes.length} classes...`);
        // Map class types to valid enum values
        const validClassTypes = ['lecture', 'lab', 'seminar', 'tutorial'];
        const typeMapping: Record<string, string> = {
          'practical': 'lab',
          'practice': 'lab',
          'workshop': 'seminar',
          'class': 'lecture',
        };

        for (const cls of fileData.classes) {
          try {
            const originalId = cls.id;
            const newSubjectId = idMappings.subjects[cls.subject_id];
            
            if (!newSubjectId) {
              console.warn(`[Import] Skipping class - no subject mapping for ${cls.subject_id}`);
              continue;
            }

            // Normalize the class type
            let classType = cls.type?.toLowerCase() || 'lecture';
            if (!validClassTypes.includes(classType)) {
              classType = typeMapping[classType] || 'lecture';
            }

            // Normalize recurrence type
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
              console.error(`[Import] Class failed:`, error.message);
              errors.push(`Class on day ${cls.day} - ${error.message}`);
            } else if (newClass && originalId) {
              idMappings.classes[originalId] = newClass.id;
              result.classes++;
            }
          } catch (e) {
            console.error(`[Import] Class error:`, e);
          }
        }
        console.log(`[Import] Successfully imported ${result.classes}/${fileData.classes.length} classes`);

        // Import class-teacher relationships - support multiple teachers per class
        if (fileData.class_teachers?.length) {
          console.log(`[Import] Processing ${fileData.class_teachers.length} class-teacher relationships...`);
          let ctCount = 0;
          for (const ct of fileData.class_teachers) {
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
              console.error(`[Import] Class-teacher relationship error:`, e);
            }
          }
          console.log(`[Import] Created ${ctCount} class-teacher relationships`);
        }
      }

      // Import tasks
      if (opts.includeTasks && fileData.tasks?.length) {
        for (const task of fileData.tasks) {
          const newSubjectId = task.subject_id ? idMappings.subjects[task.subject_id] : null;
          
          const { error } = await supabase
            .from('tasks')
            .insert([{
              title: task.title,
              due_date: task.due_date,
              due_time: task.due_time,
              type: task.type,
              priority: task.priority,
              notes: task.notes,
              is_completed: task.is_completed,
              subtasks: task.subtasks,
              attachments: task.attachments,
              subject_id: newSubjectId,
              user_id: user.id,
            }]);

          if (!error) {
            result.tasks++;
          }
        }
      }

      // Import grades
      if (opts.includeGrades && fileData.grades?.length) {
        for (const grade of fileData.grades) {
          const newSubjectId = idMappings.subjects[grade.subject_id];
          const newTermId = idMappings.terms[grade.term_id];
          
          if (!newSubjectId || !newTermId) continue;

          const { error } = await supabase
            .from('grades')
            .insert([{
              value: grade.value,
              max_score: grade.max_score,
              weight: grade.weight,
              date: grade.date,
              type: grade.type,
              notes: grade.notes,
              subject_id: newSubjectId,
              term_id: newTermId,
              user_id: user.id,
            }]);

          if (!error) {
            result.grades++;
          }
        }
      }

      // Import attendance
      if (opts.includeAttendance && fileData.attendance?.length) {
        for (const att of fileData.attendance) {
          const newSubjectId = idMappings.subjects[att.subject_id];
          const newClassId = att.class_id ? idMappings.classes[att.class_id] : null;
          
          if (!newSubjectId) continue;

          const { error } = await supabase
            .from('attendance')
            .insert([{
              date: att.date,
              status: att.status,
              excused: att.excused,
              notes: att.notes,
              subject_id: newSubjectId,
              class_id: newClassId,
              user_id: user.id,
            }]);

          if (!error) {
            result.attendance++;
          }
        }
      }

      // Import notes
      if (opts.includeNotes && fileData.notes?.length) {
        for (const note of fileData.notes) {
          const { id, ...noteData } = note;
          const { error } = await supabase
            .from('notes')
            .insert([{
              title: noteData.title || 'Untitled',
              content: noteData.content || null,
              color: noteData.color || '#FEF3C7',
              category: noteData.category || 'General',
              is_pinned: noteData.is_pinned || false,
              user_id: user.id,
            }]);

          if (!error) {
            result.notes++;
          }
        }
      }

      // Log import summary
      console.log('[Import] Complete! Summary:', result);
      if (errors.length > 0) {
        console.warn('[Import] Errors encountered:', errors);
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      queryClient.invalidateQueries({ queryKey: ['subject-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['all-subject-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['class-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      
      const parts = [];
      if (result.subjects > 0) parts.push(`${result.subjects} subjects`);
      if (result.teachers > 0) parts.push(`${result.teachers} teachers`);
      if (result.classes > 0) parts.push(`${result.classes} classes`);
      if (result.tasks > 0) parts.push(`${result.tasks} tasks`);
      if (result.grades > 0) parts.push(`${result.grades} grades`);
      if (result.attendance > 0) parts.push(`${result.attendance} attendance records`);
      if (result.terms > 0) parts.push(`${result.terms} terms`);
      if (result.notes > 0) parts.push(`${result.notes} notes`);
      
      toast.success(`Imported ${parts.join(', ')}!`);
    },
    onError: (error) => {
      toast.error('Failed to import: ' + error.message);
    },
  });
}
