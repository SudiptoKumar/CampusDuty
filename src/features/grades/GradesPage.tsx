import { useState } from 'react';
import { GraduationCap, MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useTerms } from '@/hooks/useTerms';
import { useGrades, useDeleteGrade } from '@/hooks/useGrades';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmptyState } from '@/components/shared/EmptyState';
import { EditGradeForm } from './components/EditGradeForm';
import { GPASimulator } from './components/GPASimulator';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

type Grade = Database['public']['Tables']['grades']['Row'];

export function GradesPage() {
  const { data: subjects } = useSubjects();
  const { data: grades, isLoading } = useGrades();
  const { data: terms } = useTerms();
  const deleteGrade = useDeleteGrade();
  const isMobile = useIsMobile();
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState<Grade | null>(null);
  
  const getSubject = (id: string) => subjects?.find((s) => s.id === id);
  
  // Calculate weighted average for a subject within a term
  const calculateAverage = (subjectId: string, termId: string) => {
    const subjectGrades = grades?.filter(
      (g) => g.subject_id === subjectId && g.term_id === termId
    ) ?? [];
    
    if (subjectGrades.length === 0) return null;
    
    const totalWeight = subjectGrades.reduce((sum, g) => sum + Number(g.weight), 0);
    const weightedSum = subjectGrades.reduce(
      (sum, g) => sum + (Number(g.value) / Number(g.max_score)) * 100 * Number(g.weight),
      0
    );
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };
  
  // Calculate overall average
  const calculateOverallAverage = (termId: string) => {
    const termGrades = grades?.filter((g) => g.term_id === termId) ?? [];
    if (termGrades.length === 0) return null;
    
    const totalWeight = termGrades.reduce((sum, g) => sum + Number(g.weight), 0);
    const weightedSum = termGrades.reduce(
      (sum, g) => sum + (Number(g.value) / Number(g.max_score)) * 100 * Number(g.weight),
      0
    );
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };
  
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 80) return 'text-blue-500';
    if (percentage >= 70) return 'text-yellow-500';
    if (percentage >= 60) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const handleDelete = async () => {
    if (deleteId) {
      await deleteGrade.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const GradeChip = ({ grade }: { grade: Grade }) => {
    return (
      <div className="px-3 py-2 rounded-xl bg-muted text-sm flex items-center gap-2 group">
        <div>
          <span className="font-medium">{Number(grade.value)}</span>
          <span className="text-muted-foreground">/{Number(grade.max_score)}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`p-0.5 rounded hover:bg-background transition-all ${!isMobile ? 'opacity-0 group-hover:opacity-100' : ''}`}>
              <MoreVertical className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
            <DropdownMenuItem onClick={() => setEditGrade(grade)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteId(grade.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
    <div className="p-4 md:p-6 lg:p-8 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Grades</h1>
        <p className="text-muted-foreground text-sm">
          {grades?.length ?? 0} grade{(grades?.length ?? 0) !== 1 ? 's' : ''} recorded
        </p>
      </header>

      <Tabs defaultValue="grades" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="grades" className="flex-1">Grades</TabsTrigger>
          <TabsTrigger value="whatif" className="flex-1">What-If Simulator</TabsTrigger>
        </TabsList>

        <TabsContent value="grades">
      {grades && grades.length > 0 ? (
        <div className="space-y-6">
          {terms?.map((term) => {
            const termGrades = grades.filter((g) => g.term_id === term.id);
            if (termGrades.length === 0) return null;
            
            const overallAvg = calculateOverallAverage(term.id);
            
            return (
              <section key={term.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{term.name}</h2>
                  {overallAvg !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Average:</span>
                      <span className={cn('text-lg font-bold', getGradeColor(overallAvg))}>
                        {overallAvg.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="surface-card overflow-hidden">
                  {subjects?.map((subject) => {
                    const subjectGrades = grades.filter(
                      (g) => g.subject_id === subject.id && g.term_id === term.id
                    );
                    const avg = calculateAverage(subject.id, term.id);
                    
                    if (subjectGrades.length === 0) return null;
                    
                    return (
                      <div 
                        key={subject.id}
                        className="p-4 border-b border-border last:border-b-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: subject.color }}
                            />
                            <span className="font-medium">{subject.name}</span>
                          </div>
                          {avg !== null && (
                            <span className={cn('font-bold', getGradeColor(avg))}>
                              {avg.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2 flex-wrap mt-2">
                          {subjectGrades.map((grade) => (
                            <GradeChip key={grade.id} grade={grade} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<GraduationCap className="w-8 h-8" />}
          title="No grades yet"
          description="Start adding grades to track your academic progress"
        />
      )}
        </TabsContent>

        <TabsContent value="whatif">
          <GPASimulator />
        </TabsContent>
      </Tabs>
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grade?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The grade will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteGrade.isPending}
            >
              {deleteGrade.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Form - Desktop Dialog */}
      {!isMobile && (
        <Dialog open={!!editGrade} onOpenChange={() => setEditGrade(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Grade</DialogTitle>
            </DialogHeader>
            {editGrade && (
              <EditGradeForm 
                grade={editGrade} 
                onClose={() => setEditGrade(null)} 
              />
            )}
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Form - Mobile Sheet */}
      {isMobile && (
        <Sheet open={!!editGrade} onOpenChange={() => setEditGrade(null)}>
          <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Grade</SheetTitle>
            </SheetHeader>
            <div className="pt-4 pb-8">
              {editGrade && (
                <EditGradeForm 
                  grade={editGrade} 
                  onClose={() => setEditGrade(null)} 
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export default GradesPage;
