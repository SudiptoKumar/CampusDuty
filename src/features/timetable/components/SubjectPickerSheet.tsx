import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubjects, useDeleteSubject } from '@/hooks/useSubjects';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import type { Database } from '@/integrations/supabase/types';

type Subject = Database['public']['Tables']['subjects']['Row'];

interface SubjectPickerSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (subject: Subject) => void;
  selectedId?: string;
}

export function SubjectPickerSheet({ open, onClose, onSelect, selectedId }: SubjectPickerSheetProps) {
  const { data: subjects } = useSubjects();
  const deleteSubject = useDeleteSubject();
  const navigate = useNavigate();
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  
  const handleAddNew = () => {
    onClose();
    navigate('/subjects/add');
  };
  
  const handleDelete = async () => {
    if (deletingSubject) {
      await deleteSubject.mutateAsync(deletingSubject.id);
      setDeletingSubject(null);
    }
  };
  
  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Subject</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-2 overflow-y-auto max-h-[calc(70vh-80px)]">
            {/* Add new subject option */}
            <button
              onClick={handleAddNew}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-medium text-primary">Add new subject</span>
            </button>
            
            {/* Subject list */}
            {subjects?.map((subject) => (
              <div
                key={subject.id}
                className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${
                  selectedId === subject.id ? 'bg-primary/10' : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <button
                  onClick={() => {
                    onSelect(subject);
                    onClose();
                  }}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="font-medium truncate">{subject.name}</span>
                </button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      onClose();
                      navigate(`/subjects/${subject.id}/edit`);
                    }}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeletingSubject(subject)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={!!deletingSubject} onOpenChange={() => setDeletingSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSubject?.name}"? This will also remove all associated classes.
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
