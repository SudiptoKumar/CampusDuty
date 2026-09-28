import { useMemo } from 'react';
import { Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, addDays, isSameDay } from 'date-fns';
import { useSubjects } from '@/hooks/useSubjects';
import { useTasks } from '@/hooks/useTasks';

export function TomorrowScheduleWidget() {
  const { data: subjects } = useSubjects();
  const { data: tasks } = useTasks();
  
  const tomorrow = addDays(new Date(), 1);
  
  const { tomorrowTasks, pendingCount } = useMemo(() => {
    const tomorrowsTasks = (tasks ?? [])
      .filter((t) => !t.is_completed && isSameDay(new Date(t.due_date), tomorrow))
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority] ?? 1;
        const bPriority = priorityOrder[b.priority] ?? 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    
    return {
      tomorrowTasks: tomorrowsTasks,
      pendingCount: tomorrowsTasks.length,
    };
  }, [tasks, tomorrow]);
  
  const getSubject = (id: string | null) => subjects?.find((s) => s.id === id);

  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Tomorrow</h2>
            <p className="text-xs text-muted-foreground">{format(tomorrow, 'MMM d, yyyy')}</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {pendingCount} pending
          </span>
        )}
      </div>
      
      {/* Pending Events */}
      {tomorrowTasks.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium mb-2">Pending events</p>
          {tomorrowTasks.slice(0, 2).map((task) => {
            const subject = task.subject_id ? getSubject(task.subject_id) : null;
            return (
              <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                <div 
                  className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                  style={{ borderColor: subject?.color || 'hsl(var(--muted-foreground))' }}
                />
                <span className="text-sm truncate flex-1 text-muted-foreground">{task.title}</span>
              </div>
            );
          })}
          {tomorrowTasks.length > 2 && (
            <Link 
              to="/agenda" 
              className="text-xs text-muted-foreground hover:text-primary font-medium flex items-center gap-1 pt-1"
            >
              +{tomorrowTasks.length - 2} more
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Nothing scheduled</p>
        </div>
      )}
    </section>
  );
}
