import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { useCreateClass, useClasses } from '@/hooks/useClasses';
import { useSetClassTeachers } from '@/hooks/useClassTeachers';
import { useSubjectTeachers } from '@/hooks/useSubjectTeachers';
import { SubjectPickerSheet } from './SubjectPickerSheet';
import { TeacherPickerSheet } from './TeacherPickerSheet';
import { DAY_NAMES } from '@/lib/mockData';
import { findConflictingClasses } from '@/lib/timetableUtils';
import type { Database } from '@/integrations/supabase/types';
import { Occurrence } from './AddOccurrenceSheet';

type Subject = Database['public']['Tables']['subjects']['Row'];
type RecurrenceType = Database['public']['Enums']['recurrence_type'];

interface LocationState {
  occurrences?: Occurrence[];
  fromOccurrences?: boolean;
  selectedSubjectId?: string;
  selectedTeacherIds?: string[];
  room?: string;
  notes?: string;
}

export function AddClassPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: subjects } = useSubjects();
  const { data: teachers } = useTeachers();
  const { data: allClasses } = useClasses();
  const createClass = useCreateClass();
  const setClassTeachers = useSetClassTeachers();
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([
    { day: 1, startTime: '09:00', endTime: '10:00', recurrence: 'weekly' as RecurrenceType }
  ]);
  const [room, setRoom] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch teachers for the selected subject
  const { data: subjectTeachers } = useSubjectTeachers(selectedSubject?.id);
  
  // Auto-populate teachers when subject is selected
  useEffect(() => {
    if (subjectTeachers && subjectTeachers.length > 0) {
      const teacherIds = subjectTeachers.map(st => st.teacher_id);
      setSelectedTeacherIds(teacherIds);
    }
  }, [subjectTeachers]);
  
  // Handle returning from occurrences page
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.fromOccurrences) {
      if (state.occurrences) {
        setOccurrences(state.occurrences);
      }
      // Restore subject
      if (state.selectedSubjectId && subjects) {
        const subject = subjects.find(s => s.id === state.selectedSubjectId);
        if (subject) {
          setSelectedSubject(subject);
        }
      }
      // Restore other fields
      if (state.selectedTeacherIds) {
        setSelectedTeacherIds(state.selectedTeacherIds);
      }
      if (state.room !== undefined) {
        setRoom(state.room);
      }
      if (state.notes !== undefined) {
        setNotes(state.notes);
      }
      // Clear the state to prevent re-applying on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, subjects]);

  // Conflict detection
  const conflicts = useMemo(() => {
    if (!allClasses || occurrences.length === 0) return [];
    return occurrences.flatMap((occ) => {
      const found = findConflictingClasses(allClasses, occ.day, occ.startTime, occ.endTime);
      return found.map(c => ({
        ...c,
        occDay: occ.day,
      }));
    });
  }, [allClasses, occurrences]);
  
  const getTeacherNames = () => {
    if (selectedTeacherIds.length === 0) return '';
    return teachers
      ?.filter(t => selectedTeacherIds.includes(t.id))
      .map(t => `${t.first_name} ${t.last_name}`)
      .join(', ') || '';
  };
  
  const getOccurrencesSummary = () => {
    if (occurrences.length === 0) return 'No occurrences';
    const days = occurrences.map(o => DAY_NAMES[o.day].slice(0, 3));
    return days.join(', ');
  };
  
  const handleSave = async () => {
    if (!selectedSubject || occurrences.length === 0) return;
    
    setIsSaving(true);
    try {
      // Create a class for each occurrence
      const createdClassIds: string[] = [];
      
      for (const occurrence of occurrences) {
        const result = await createClass.mutateAsync({
          subject_id: selectedSubject.id,
          day: occurrence.day,
          start_time: occurrence.startTime,
          end_time: occurrence.endTime,
          type: 'lecture',
          room: room.trim() || null,
          recurrence: occurrence.recurrence,
          notes: notes.trim() || null,
        });
        createdClassIds.push(result.id);
      }
      
      // Set teachers for each created class
      if (selectedTeacherIds.length > 0) {
        for (const classId of createdClassIds) {
          await setClassTeachers.mutateAsync({
            classId,
            teacherIds: selectedTeacherIds,
          });
        }
      }
      
      navigate('/timetable');
    } catch (error) {
      console.error('Failed to create class:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const navigateToOccurrences = () => {
    navigate('/timetable/occurrences', {
      state: { 
        occurrences,
        returnPath: '/timetable/add',
        selectedSubjectId: selectedSubject?.id,
        selectedTeacherIds,
        room,
        notes,
      }
    });
  };
  
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/timetable')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedSubject || isSaving}
            className="rounded-full px-6"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>
      
      <div className="p-4 space-y-4">
        {/* Subject */}
        <div className="surface-card rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowSubjectPicker(true)}
            className="w-full flex items-center justify-between p-4"
          >
            <span className="text-muted-foreground">Subject</span>
            <div className="flex items-center gap-2">
              {selectedSubject ? (
                <>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedSubject.color }}
                  />
                  <span className="font-medium truncate max-w-[180px]">{selectedSubject.name}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Select subject</span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        </div>
        
        {/* Occurrences */}
        <div className="surface-card rounded-2xl overflow-hidden">
          <button
            onClick={navigateToOccurrences}
            className="w-full flex items-center justify-between p-4"
          >
            <div>
              <p className="text-muted-foreground text-left">Occurrences</p>
              <p className="text-sm text-muted-foreground mt-1">{getOccurrencesSummary()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{occurrences.length}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        </div>

        {/* Conflict Warning */}
        {conflicts.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Time Conflict Detected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Overlaps with: {conflicts.map(c => {
                  const subj = subjects?.find(s => s.id === c.subject_id);
                  return subj?.name || 'Unknown';
                }).join(', ')} on {conflicts.map(c => DAY_NAMES[c.occDay]).join(', ')}
              </p>
            </div>
          </div>
        )}
        
        {/* Room */}
        <div className="surface-card rounded-2xl overflow-hidden">
          <div className="p-4">
            <input
              type="text"
              placeholder="Room (optional)"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
        
        {/* Teachers */}
        <div className="surface-card rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowTeacherPicker(true)}
            className="w-full flex items-center justify-between p-4"
          >
            <span className="text-muted-foreground">Teachers</span>
            <div className="flex items-center gap-2">
              {selectedTeacherIds.length > 0 ? (
                <span className="font-medium truncate max-w-[180px]">{getTeacherNames()}</span>
              ) : (
                <span className="text-muted-foreground">Select teachers</span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        </div>
        
        {/* Notes */}
        <div className="surface-card rounded-2xl overflow-hidden">
          <div className="p-4">
            <Textarea
              placeholder="Note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] bg-transparent border-none resize-none"
            />
          </div>
        </div>
      </div>
      
      <SubjectPickerSheet
        open={showSubjectPicker}
        onClose={() => setShowSubjectPicker(false)}
        selectedId={selectedSubject?.id}
        onSelect={setSelectedSubject}
      />
      
      <TeacherPickerSheet
        open={showTeacherPicker}
        onClose={() => setShowTeacherPicker(false)}
        selectedIds={selectedTeacherIds}
        onSelect={setSelectedTeacherIds}
      />
    </div>
  );
}
