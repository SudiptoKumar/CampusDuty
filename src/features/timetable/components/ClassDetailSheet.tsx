import { MapPin, User, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useClasses, useDeleteClass } from '@/hooks/useClasses';
import { useSubjectTeachers } from '@/hooks/useSubjectTeachers';
import { DAY_NAMES } from '@/lib/mockData';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import type { Database } from '@/integrations/supabase/types';

type TimetableClass = Database['public']['Tables']['classes']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];

interface ClassDetailSheetProps {
  open: boolean;
  onClose: () => void;
  classItem: TimetableClass;
  subject: Subject;
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function ClassDetailSheet({ open, onClose, classItem, subject }: ClassDetailSheetProps) {
  const navigate = useNavigate();
  const { data: allClasses } = useClasses();
  const { data: subjectTeachers } = useSubjectTeachers(subject.id);
  const deleteClass = useDeleteClass();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Get all occurrences for this subject
  const subjectClasses = allClasses?.filter(c => c.subject_id === subject.id) || [];
  
  const handleEdit = () => {
    onClose();
    navigate(`/timetable/edit/${classItem.id}`);
  };
  
  const handleDelete = async () => {
    // Delete all classes for this subject
    for (const cls of subjectClasses) {
      await deleteClass.mutateAsync(cls.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };
  
  // Get teacher names from subject_teachers
  const teacherNames = subjectTeachers
    ?.filter(st => st.teachers)
    .map(st => `${(st.teachers as any).first_name} ${(st.teachers as any).last_name}`)
    .join(', ');
  
  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-3xl pb-8">
          <div className="pt-4 space-y-4">
            {/* Subject header */}
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: subject.color }}
              />
              <h2 className="text-xl font-bold">{subject.name}</h2>
            </div>
            
            {/* Occurrences */}
            <div className="space-y-2">
              {subjectClasses.map((cls) => (
                <div key={cls.id} className="flex items-center gap-2 py-2 border-b border-border">
                  <span className="text-muted-foreground">{DAY_NAMES[cls.day]}</span>
                  <span className="text-muted-foreground ml-auto">
                    {formatTime(cls.start_time)} → {formatTime(cls.end_time)}
                  </span>
                </div>
              ))}
            </div>
            
            <Separator />
            
            {/* Room */}
            {classItem.room && (
              <div className="flex items-center gap-3 py-2">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span>{classItem.room}</span>
              </div>
            )}
            
            {/* Teachers */}
            {teacherNames && (
              <div className="flex items-center gap-3 py-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <span>{teacherNames}</span>
              </div>
            )}
            
            <Separator />
            
            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={handleEdit}
              >
                <Pencil className="w-5 h-5" />
                Edit
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all occurrences of "{subject.name}" from your timetable?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
