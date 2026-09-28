import { useMemo } from 'react';
import { Calendar, ArrowRight, Plus, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isSameDay } from 'date-fns';
import { useSubjects } from '@/hooks/useSubjects';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';

export function TodayScheduleWidget() {
  const { data: subjects } = useSubjects();
  const { data: tasks } = useTasks();
  
  const today = new Date();
  
  const { todayTasks, pendingCount } = useMemo(() => {
    const todaysTasks = (tasks ?? [])
      .filter((t) => !t.is_completed && isSameDay(new Date(t.due_date), today))
      .sort((a, b) => {
        // Sort by priority then by time
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority] ?? 1;
        const bPriority = priorityOrder[b.priority] ?? 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    
    return {
      todayTasks: todaysTasks,
      pendingCount: todaysTasks.length,
    };
  }, [tasks, today]);
  
  const getSubject = (id: string | null) => subjects?.find((s) => s.id === id);

  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Today</h2>
            <p className="text-xs text-muted-foreground">{format(today, 'MMM d, yyyy')}</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
            {pendingCount} pending
          </span>
        )}
      </div>
      
      {/* Pending Events */}
      {todayTasks.length > 0 ? (
        <div className="space-y-2 mb-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">Pending events</p>
          {todayTasks.slice(0, 3).map((task) => {
            const subject = task.subject_id ? getSubject(task.subject_id) : null;
            return (
              <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                <div 
                  className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                  style={{ borderColor: subject?.color || 'hsl(var(--primary))' }}
                />
                <span className="text-sm truncate flex-1">{task.title}</span>
                {task.priority === 'high' && (
                  <span className="text-[10px] bg-destructive/15 text-destructive px-1.5 py-0.5 rounded">
                    High
                  </span>
                )}
              </div>
            );
          })}
          {todayTasks.length > 3 && (
            <Link 
              to="/agenda" 
              className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all pt-1"
            >
              +{todayTasks.length - 3} more
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      ) : (
        <div className="text-center py-6 mb-4">
          <CheckCircle2 className="w-10 h-10 text-primary/30 mx-auto mb-2" />
          <p className="text-sm font-medium">All clear for today!</p>
          <p className="text-xs text-muted-foreground">No pending tasks</p>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex gap-2">
        <Link to="/agenda" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 flex-1">
          <ArrowRight className="w-3.5 h-3.5" />
          Show more
        </Link>
        <Link to="/agenda">
          <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            New event
          </Button>
        </Link>
      </div>
    </section>
  );
}
