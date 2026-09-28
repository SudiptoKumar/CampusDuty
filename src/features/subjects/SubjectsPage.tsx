import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubjects, useDeleteSubject } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmptyState } from '@/components/shared/EmptyState';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Database } from '@/integrations/supabase/types';

type Subject = Database['public']['Tables']['subjects']['Row'];
type Class = Database['public']['Tables']['classes']['Row'];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export function SubjectsPage() {
  const navigate = useNavigate();
  const { data: subjects, isLoading } = useSubjects();
  const { data: teachers } = useTeachers();
  const { data: classes } = useClasses();
  const deleteSubject = useDeleteSubject();
  const isMobile = useIsMobile();
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const getTeacher = (id?: string | null) => teachers?.find((t) => t.id === id);
  
  // Get next class for a subject
  const getNextClass = (subjectId: string): { day: string; time: string } | null => {
    const subjectClasses = classes?.filter(c => c.subject_id === subjectId) ?? [];
    if (subjectClasses.length === 0) return null;
    
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Sort classes by day and time
    const sortedClasses = [...subjectClasses].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.start_time.localeCompare(b.start_time);
    });
    
    // Find next class from now
    for (const cls of sortedClasses) {
      const [hours, minutes] = cls.start_time.split(':').map(Number);
      const classTime = hours * 60 + minutes;
      
      if (cls.day > currentDay || (cls.day === currentDay && classTime > currentTime)) {
        return { day: DAY_NAMES[cls.day], time: formatTime(cls.start_time) };
      }
    }
    
    // If no class found this week, return first class of next week
    if (sortedClasses.length > 0) {
      const firstClass = sortedClasses[0];
      return { day: DAY_NAMES[firstClass.day], time: formatTime(firstClass.start_time) };
    }
    
    return null;
  };
  
  const handleDelete = async () => {
    if (deleteId) {
      await deleteSubject.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const SubjectCard = ({ subject }: { subject: Subject }) => {
    const teacher = getTeacher(subject.teacher_id);
    const nextClass = getNextClass(subject.id);
    
    const cardContent = (
      <div 
        className="surface-card p-4 flex gap-3 group cursor-pointer"
        onClick={() => navigate(`/subjects/${subject.id}`)}
      >
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${subject.color}20` }}
        >
          <BookOpen className="w-5 h-5" style={{ color: subject.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold truncate" style={{ color: subject.color }}>
              {subject.name}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={`p-1 rounded-lg hover:bg-muted transition-all ${!isMobile ? 'opacity-0 group-hover:opacity-100' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/subjects/${subject.id}/edit`);
                }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(subject.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {nextClass && (
            <div className="mt-1">
              <p className="text-xs text-muted-foreground">Next classes</p>
              <p className="text-sm">{nextClass.day} • {nextClass.time}</p>
            </div>
          )}
          {!nextClass && teacher && (
            <p className="text-xs text-muted-foreground mt-1">
              {teacher.first_name} {teacher.last_name}
            </p>
          )}
        </div>
      </div>
    );
    
    return <div className="rounded-xl stagger-item">{cardContent}</div>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Subjects</h1>
        <p className="text-muted-foreground text-sm">
          {subjects?.length ?? 0} subject{(subjects?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </header>
      
      {subjects && subjects.length > 0 ? (
        <div className="flex flex-col gap-3">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="No subjects yet"
          description="Add your first subject to organize your classes and grades"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/subjects/add')}
              className="mt-2"
            >
              Add Subject
            </Button>
          }
        />
      )}
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All associated classes and grades will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSubject.isPending}
            >
              {deleteSubject.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SubjectsPage;
