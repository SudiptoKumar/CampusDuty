import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeachers, useDeleteTeacher } from '@/hooks/useTeachers';
import { ArrowLeft, User, Loader2, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: teachers, isLoading } = useTeachers();
  const deleteTeacher = useDeleteTeacher();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const teacher = teachers?.find(t => t.id === id);
  
  const handleDelete = async () => {
    if (id) {
      await deleteTeacher.mutateAsync(id);
      navigate('/teachers');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Teacher not found</p>
        <Button onClick={() => navigate('/teachers')}>Go back</Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/teachers')}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Profile Content */}
      <div className="flex flex-col items-center justify-center pt-16 pb-8 px-4">
        {/* Teacher Icon */}
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <User className="w-12 h-12 text-primary" />
        </div>
        
        {/* Teacher Name */}
        <h1 className="text-2xl font-semibold text-foreground text-center">
          {teacher.first_name} {teacher.last_name}
        </h1>
        
        {/* Optional contact info */}
        {teacher.email && (
          <p className="text-muted-foreground mt-2">{teacher.email}</p>
        )}
        
        {teacher.phone && (
          <p className="text-muted-foreground mt-1">{teacher.phone}</p>
        )}
      </div>
      
      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
    </div>
  );
}
