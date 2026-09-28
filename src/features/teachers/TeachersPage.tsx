import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useTeachers, useDeleteTeacher } from '@/hooks/useTeachers';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmptyState } from '@/components/shared/EmptyState';
import { EditTeacherForm } from './components/EditTeacherForm';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Database } from '@/integrations/supabase/types';

type Teacher = Database['public']['Tables']['teachers']['Row'];

export function TeachersPage() {
  const navigate = useNavigate();
  const { data: teachers, isLoading } = useTeachers();
  const deleteTeacher = useDeleteTeacher();
  const isMobile = useIsMobile();
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  
  // Group teachers by first letter of last name
  const groupedTeachers = useMemo(() => {
    if (!teachers) return {};
    
    const groups: Record<string, Teacher[]> = {};
    
    teachers.forEach(teacher => {
      const firstLetter = teacher.last_name[0]?.toUpperCase() || '#';
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(teacher);
    });
    
    // Sort each group by last name
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.last_name.localeCompare(b.last_name));
    });
    
    return groups;
  }, [teachers]);
  
  const sortedLetters = useMemo(() => {
    return Object.keys(groupedTeachers).sort();
  }, [groupedTeachers]);
  
  const handleDelete = async () => {
    if (deleteId) {
      await deleteTeacher.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const TeacherRow = ({ teacher, showLetter }: { teacher: Teacher; showLetter: boolean }) => {
    const letter = teacher.last_name[0]?.toUpperCase() || '#';
    const fullName = `${teacher.first_name} ${teacher.last_name}`;
    
    return (
      <div className="stagger-item">
        <div 
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group"
          onClick={() => navigate(`/teachers/${teacher.id}`)}
        >
          {/* Letter indicator */}
          <div className="w-8 text-center">
            {showLetter && (
              <span className="text-primary font-semibold">{letter}</span>
            )}
          </div>
          
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          
          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{fullName}</p>
          </div>
          
          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={`p-2 rounded-lg hover:bg-muted transition-all ${!isMobile ? 'opacity-0 group-hover:opacity-100' : ''}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setEditTeacher(teacher);
              }}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(teacher.id);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <header className="p-4 md:p-6 lg:p-8 pb-2">
        <h1 className="text-2xl font-bold">Teachers</h1>
      </header>
      
      {teachers && teachers.length > 0 ? (
        <div className="divide-y divide-border">
          {sortedLetters.map(letter => (
            <div key={letter}>
              {groupedTeachers[letter].map((teacher, index) => (
                <TeacherRow 
                  key={teacher.id} 
                  teacher={teacher} 
                  showLetter={index === 0}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 md:p-6 lg:p-8">
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="No teachers yet"
            description="Add your teachers to keep their contact info handy"
          />
        </div>
      )}
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The teacher will be removed from all associated subjects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTeacher.isPending}
            >
              {deleteTeacher.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Form - Desktop Dialog */}
      {!isMobile && (
        <Dialog open={!!editTeacher} onOpenChange={() => setEditTeacher(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Teacher</DialogTitle>
            </DialogHeader>
            {editTeacher && (
              <EditTeacherForm 
                teacher={editTeacher} 
                onClose={() => setEditTeacher(null)} 
              />
            )}
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Form - Mobile Sheet */}
      {isMobile && (
        <Sheet open={!!editTeacher} onOpenChange={() => setEditTeacher(null)}>
          <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Teacher</SheetTitle>
            </SheetHeader>
            <div className="pt-4 pb-8">
              {editTeacher && (
                <EditTeacherForm 
                  teacher={editTeacher} 
                  onClose={() => setEditTeacher(null)} 
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export default TeachersPage;
