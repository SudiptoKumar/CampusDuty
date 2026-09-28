import { useMemo } from 'react';
import { Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays, isPast, isToday, isTomorrow } from 'date-fns';
import { useTasks } from '@/hooks/useTasks';
import { useSubjects } from '@/hooks/useSubjects';

export function UpcomingDeadlinesWidget() {
  const { data: tasks } = useTasks();
  const { data: subjects } = useSubjects();
  
  const upcomingDeadlines = useMemo(() => {
    if (!tasks) return [];
    
    return tasks
      .filter((t) => !t.is_completed && !isPast(new Date(t.due_date)))
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 4);
  }, [tasks]);
  
  const getSubject = (id: string | null) => 
    id ? subjects?.find((s) => s.id === id) : null;
  
  const getUrgencyStyle = (dueDate: Date) => {
    const daysUntil = differenceInDays(dueDate, new Date());
    
    if (isToday(dueDate)) {
      return { bg: 'bg-red-500/15', text: 'text-red-500', label: 'Today' };
    }
    if (isTomorrow(dueDate)) {
      return { bg: 'bg-orange-500/15', text: 'text-orange-500', label: 'Tomorrow' };
    }
    if (daysUntil <= 3) {
      return { bg: 'bg-yellow-500/15', text: 'text-yellow-500', label: `${daysUntil}d` };
    }
    return { bg: 'bg-muted', text: 'text-muted-foreground', label: format(dueDate, 'MMM d') };
  };

  if (upcomingDeadlines.length === 0) {
    return null;
  }

  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <h2 className="font-semibold text-sm">Upcoming Deadlines</h2>
        </div>
        <Link to="/agenda" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      
      <div className="space-y-2">
        {upcomingDeadlines.map((task) => {
          const subject = getSubject(task.subject_id);
          const dueDate = new Date(task.due_date);
          const urgency = getUrgencyStyle(dueDate);
          
          return (
            <div 
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <div 
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ backgroundColor: subject?.color || 'hsl(var(--primary))' }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {subject?.name || 'General'}
                </p>
              </div>
              <div className={`px-2 py-1 rounded-md ${urgency.bg}`}>
                <span className={`text-xs font-medium ${urgency.text}`}>
                  {urgency.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
