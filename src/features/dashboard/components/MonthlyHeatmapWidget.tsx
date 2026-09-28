import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, isSameDay, isToday } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useAttendance } from '@/hooks/useAttendance';

export function MonthlyHeatmapWidget() {
  const today = new Date();
  const { data: tasks } = useTasks();
  const { data: attendance } = useAttendance();
  
  const { daysGrid, monthLabel, totalActivity, maxActivity } = useMemo(() => {
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get activity data for this month
    const activityMap = new Map<string, number>();
    
    tasks?.forEach((task) => {
      if (task.is_completed) {
        const taskDate = new Date(task.due_date);
        if (taskDate >= monthStart && taskDate <= monthEnd) {
          const dateKey = format(taskDate, 'yyyy-MM-dd');
          activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
        }
      }
    });
    
    attendance?.forEach((record) => {
      if (record.status === 'present') {
        const recordDate = new Date(record.date);
        if (recordDate >= monthStart && recordDate <= monthEnd) {
          const dateKey = format(recordDate, 'yyyy-MM-dd');
          activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
        }
      }
    });
    
    // Calculate max for intensity
    const max = Math.max(...Array.from(activityMap.values()), 1);
    const total = Array.from(activityMap.values()).reduce((a, b) => a + b, 0);
    
    // Build calendar grid with padding for first day of month
    const firstDayOfWeek = getDay(monthStart);
    const paddedDays = Array(firstDayOfWeek).fill(null);
    
    const daysWithActivity = days.map((date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return {
        date,
        day: format(date, 'd'),
        count: activityMap.get(dateKey) || 0,
        isToday: isToday(date),
        isFuture: date > today,
      };
    });
    
    return {
      daysGrid: [...paddedDays, ...daysWithActivity],
      monthLabel: format(today, 'MMMM yyyy'),
      totalActivity: total,
      maxActivity: max,
    };
  }, [today, tasks, attendance]);
  
  const getIntensityClass = (count: number, isFuture: boolean) => {
    if (isFuture) return 'bg-muted/20 text-muted-foreground/50';
    if (count === 0) return 'bg-muted/30 text-muted-foreground';
    const intensity = count / maxActivity;
    if (intensity <= 0.25) return 'bg-primary/20 text-foreground';
    if (intensity <= 0.5) return 'bg-primary/40 text-foreground';
    if (intensity <= 0.75) return 'bg-primary/60 text-primary-foreground';
    return 'bg-primary text-primary-foreground';
  };
  
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">{monthLabel}</h2>
            <p className="text-xs text-muted-foreground">{totalActivity} activities</p>
          </div>
        </div>
      </div>
      
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day, i) => (
          <div key={i} className="text-[10px] text-muted-foreground text-center font-medium">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysGrid.map((day, i) => (
          <div
            key={i}
            className={`
              aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors
              ${day ? getIntensityClass(day.count, day.isFuture) : ''}
              ${day?.isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
            `}
            title={day ? `${format(day.date, 'MMM d')}: ${day.count} activities` : ''}
          >
            {day?.day}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <span className="text-[10px] text-muted-foreground">Activity intensity</span>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Low</span>
          <div className="flex gap-[2px]">
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <div className="w-3 h-3 rounded-sm bg-primary/20" />
            <div className="w-3 h-3 rounded-sm bg-primary/40" />
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
          </div>
          <span>High</span>
        </div>
      </div>
    </section>
  );
}
