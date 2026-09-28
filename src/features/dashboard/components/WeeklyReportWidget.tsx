import { useMemo } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useClasses } from '@/hooks/useClasses';
import { useTasks } from '@/hooks/useTasks';

export function WeeklyReportWidget() {
  const { data: classes } = useClasses();
  const { data: tasks } = useTasks();
  
  const today = new Date();
  
  const { weekData, totalEvents, weekLabel } = useMemo(() => {
    const startOfWeekDate = startOfWeek(today, { weekStartsOn: 0 });
    
    // Generate 7 days of the week
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startOfWeekDate, i);
      const dayOfWeek = date.getDay();
      
      // Count classes for this day
      const classCount = classes?.filter((c) => c.day === dayOfWeek).length ?? 0;
      
      // Count tasks due on this day
      const taskCount = tasks?.filter((t) => 
        !t.is_completed && isSameDay(new Date(t.due_date), date)
      ).length ?? 0;
      
      const total = classCount + taskCount;
      
      return {
        day: format(date, 'EEE')[0],
        fullDay: format(date, 'EEEE'),
        date,
        count: total,
        isToday: isSameDay(date, today),
        isPast: date < today && !isSameDay(date, today),
      };
    });
    
    // Calculate max for scaling
    const maxCount = Math.max(...days.map((d) => d.count), 1);
    
    // Add height percentage for bars
    const daysWithHeight = days.map((d) => ({
      ...d,
      heightPercent: d.count > 0 ? Math.max((d.count / maxCount) * 100, 15) : 0,
    }));
    
    // Count upcoming events (next 7 days)
    const upcomingTasks = tasks?.filter((t) => {
      const dueDate = new Date(t.due_date);
      return !t.is_completed && dueDate >= today && dueDate <= addDays(today, 7);
    }).length ?? 0;
    
    return {
      weekData: daysWithHeight,
      totalEvents: upcomingTasks,
      weekLabel: `${format(startOfWeekDate, 'MMM d')} - ${format(addDays(startOfWeekDate, 6), 'MMM d')}`,
    };
  }, [classes, tasks, today]);

  return (
    <section className="surface-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold text-sm">Weekly Report</span>
      </div>
      
      {/* Chart and Stats */}
      <div className="flex items-end gap-4">
        {/* Bar Chart */}
        <div className="flex-1 flex items-end justify-between h-20 gap-1">
          {weekData.map((day, i) => (
            <div key={i} className="flex flex-col items-center flex-1 gap-1">
              {/* Bar */}
              <div className="w-full flex justify-center">
                <div 
                  className={`
                    w-full max-w-6 rounded-t-sm transition-all duration-300
                    ${day.isToday 
                      ? 'bg-primary' 
                      : day.isPast 
                        ? 'bg-muted-foreground/30' 
                        : 'bg-muted/60'
                    }
                  `}
                  style={{ 
                    height: day.heightPercent > 0 ? `${day.heightPercent}%` : '2px',
                    minHeight: day.count > 0 ? '8px' : '2px',
                  }}
                />
              </div>
              {/* Dot indicator */}
              <div 
                className={`
                  w-1.5 h-1.5 rounded-full
                  ${day.isToday ? 'bg-primary' : 'bg-muted-foreground/40'}
                `}
              />
              {/* Day label */}
              <span className={`text-[10px] ${day.isToday ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {day.day}
              </span>
            </div>
          ))}
        </div>
        
        {/* Stats */}
        <div className="text-right min-w-fit">
          <p className="text-2xl font-bold">{totalEvents}</p>
          <p className="text-xs text-muted-foreground">event{totalEvents !== 1 ? 's' : ''}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Next 7 days</p>
        </div>
      </div>
      
      {/* Show More Link */}
      <Link 
        to="/agenda" 
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mt-4 pt-3 border-t border-border/30 transition-colors"
      >
        <ArrowRight className="w-3.5 h-3.5" />
        <span>Show more</span>
      </Link>
    </section>
  );
}
