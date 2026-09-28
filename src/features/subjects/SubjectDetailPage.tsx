import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSubject, useDeleteSubject } from '@/hooks/useSubjects';
import { useSubjectTeachers } from '@/hooks/useSubjectTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useGrades } from '@/hooks/useGrades';
import { useTasks } from '@/hooks/useTasks';
import { 
  ArrowLeft, 
  MoreVertical, 
  MapPin, 
  Users, 
  ArrowRight,
  TrendingUp,
  CalendarDays,
  ClipboardList,
  Award,
  Loader2,
  Trash2
} from 'lucide-react';
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
import { useState } from 'react';
import { format } from 'date-fns';
import { SubjectAnalyticsCard } from './components/SubjectAnalyticsCard';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_MAP = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: subject, isLoading } = useSubject(id);
  const { data: subjectTeachersData } = useSubjectTeachers(id);
  const { data: classes } = useClasses();
  const { data: grades } = useGrades();
  const { data: tasks } = useTasks();
  const deleteSubject = useDeleteSubject();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Get assigned teachers from junction table
  const assignedTeachers = useMemo(() => 
    subjectTeachersData?.map(st => st.teachers).filter(Boolean) ?? [],
    [subjectTeachersData]
  );
  
  // Get classes for this subject
  const subjectClasses = useMemo(() => 
    classes?.filter(c => c.subject_id === id) ?? [],
    [classes, id]
  );
  
  // Get days that have classes
  const classDays = useMemo(() => 
    [...new Set(subjectClasses.map(c => c.day))],
    [subjectClasses]
  );
  
  // Get grades for this subject
  const subjectGrades = useMemo(() => 
    grades?.filter(g => g.subject_id === id) ?? [],
    [grades, id]
  );
  
  // Calculate average
  const average = useMemo(() => {
    if (subjectGrades.length === 0) return null;
    const totalWeight = subjectGrades.reduce((sum, g) => sum + g.weight, 0);
    const weightedSum = subjectGrades.reduce((sum, g) => 
      sum + (g.value / g.max_score * 100) * g.weight, 0
    );
    return totalWeight > 0 ? weightedSum / totalWeight : null;
  }, [subjectGrades]);
  
  // Calculate written vs oral averages
  const writtenAvg = useMemo(() => {
    const written = subjectGrades.filter(g => g.type === 'written');
    if (written.length === 0) return null;
    return written.reduce((sum, g) => sum + (g.value / g.max_score * 100), 0) / written.length;
  }, [subjectGrades]);
  
  const oralAvg = useMemo(() => {
    const oral = subjectGrades.filter(g => g.type === 'oral');
    if (oral.length === 0) return null;
    return oral.reduce((sum, g) => sum + (g.value / g.max_score * 100), 0) / oral.length;
  }, [subjectGrades]);
  
  // Get tasks/events for this subject
  const subjectTasks = useMemo(() => 
    tasks?.filter(t => t.subject_id === id && !t.is_completed) ?? [],
    [tasks, id]
  );
  
  // Recent grades (last 3)
  const recentGrades = useMemo(() => 
    [...subjectGrades]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3),
    [subjectGrades]
  );
  
  const handleDelete = async () => {
    if (id) {
      await deleteSubject.mutateAsync(id);
      navigate('/subjects');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Subject not found</p>
        <Button onClick={() => navigate('/subjects')}>Go back</Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/subjects')}
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold truncate max-w-[200px]">
              {subject.name}
            </h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
      
      <div className="p-4 space-y-4">
        {/* Info Card */}
        <div className="surface-card rounded-xl p-4 space-y-3">
          {subject.room && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{subject.room}</span>
            </div>
          )}
          {assignedTeachers.length > 0 && (
            <div className="flex items-start gap-3 text-sm">
              <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {assignedTeachers.map((teacher, index) => (
                  <span key={teacher?.id}>
                    <Link
                      to={`/teachers/${teacher?.id}`}
                      className="text-primary hover:underline"
                    >
                      {teacher?.first_name} {teacher?.last_name}
                    </Link>
                    {index < assignedTeachers.length - 1 && <span className="text-muted-foreground">,</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(subject.room || assignedTeachers.length > 0) && (
            <button 
              onClick={() => navigate(`/subjects/${id}/edit`)}
              className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border w-full hover:text-foreground transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Edit
            </button>
          )}
          {!subject.room && assignedTeachers.length === 0 && (
            <button 
              onClick={() => navigate(`/subjects/${id}/edit`)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Add details
            </button>
          )}
        </div>
        
        {/* Average Card */}
        <div className="surface-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${subject.color}20` }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: subject.color }} />
            </div>
            <span className="font-medium">Your average</span>
          </div>
          
          <div className="flex items-center gap-8">
            {/* Circle Progress */}
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-muted/30"
                />
                {average !== null && (
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke={subject.color}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${(average / 100) * 220} 220`}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-semibold">
                  {average !== null ? Math.round(average) : '-'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {writtenAvg !== null ? Math.round(writtenAvg) : '-'}
                </p>
                <p className="text-xs text-muted-foreground">Written</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {oralAvg !== null ? Math.round(oralAvg) : '-'}
                </p>
                <p className="text-xs text-muted-foreground">Oral</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Objective Card */}
        <div className="surface-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Your average</span>
            <span className="text-sm text-muted-foreground">Your objective</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              {average !== null ? Math.round(average) : '-'}
            </span>
            <span className="font-semibold">-</span>
          </div>
          <div className="h-2 bg-muted rounded-full mt-3 overflow-hidden">
            {average !== null && (
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${Math.min(average, 100)}%`,
                  backgroundColor: subject.color 
                }}
              />
            )}
          </div>
          <button className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t border-border w-full mt-4 hover:text-foreground transition-colors">
            <ArrowRight className="w-4 h-4" />
            Edit
          </button>
        </div>
        
        {/* Analytics */}
        {id && <SubjectAnalyticsCard subjectId={id} subjectColor={subject.color} />}
        
        {/* Weekly Schedule */}
        <div className="surface-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${subject.color}20` }}
            >
              <CalendarDays className="w-4 h-4" style={{ color: subject.color }} />
            </div>
            <span className="font-medium">Weekly schedule</span>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-4">
            {DAY_MAP.map((day, index) => {
              const hasClass = classDays.includes(day);
              return (
                <div
                  key={index}
                  className={`aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    hasClass 
                      ? 'text-white' 
                      : 'text-muted-foreground'
                  }`}
                  style={hasClass ? { backgroundColor: subject.color } : {}}
                >
                  {DAY_LABELS[index]}
                </div>
              );
            })}
          </div>
          
          <button 
            onClick={() => navigate('/timetable')}
            className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t border-border w-full hover:text-foreground transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Show more
          </button>
        </div>
        
        {/* Events */}
        <div className="surface-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${subject.color}20` }}
            >
              <ClipboardList className="w-4 h-4" style={{ color: subject.color }} />
            </div>
            <span className="font-medium">Events</span>
          </div>
          
          {subjectTasks.length > 0 ? (
            <div className="space-y-2">
              {subjectTasks.slice(0, 3).map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(task.due_date), 'MMM d')}
                      {task.due_time && ` • ${formatTime(task.due_time)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              There are no events
            </p>
          )}
        </div>
        
        {/* Recent Grades */}
        <div className="surface-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${subject.color}20` }}
            >
              <Award className="w-4 h-4" style={{ color: subject.color }} />
            </div>
            <span className="font-medium">Recent grades</span>
          </div>
          
          {recentGrades.length > 0 ? (
            <div className="space-y-2">
              {recentGrades.map((grade) => (
                <div 
                  key={grade.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm capitalize">{grade.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(grade.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {grade.value}/{grade.max_score}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No grades
            </p>
          )}
          
          <button 
            onClick={() => navigate('/grades')}
            className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t border-border w-full mt-4 hover:text-foreground transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Show more
          </button>
        </div>
      </div>
      
      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
