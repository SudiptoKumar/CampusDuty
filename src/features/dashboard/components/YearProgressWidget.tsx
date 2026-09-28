import { useMemo } from 'react';
import { format, startOfYear, addDays, getWeek, isSameDay, startOfWeek } from 'date-fns';
import { useTasks } from '@/hooks/useTasks';
import { useAttendance } from '@/hooks/useAttendance';

export function YearProgressWidget() {
  const today = new Date();
  const { data: tasks } = useTasks();
  const { data: attendance } = useAttendance();
  
  const { weeksGrid, months, currentWeek } = useMemo(() => {
    const yearStart = startOfYear(today);
    const weekNumber = getWeek(today, { weekStartsOn: 0 });
    
    // Get activity data
    const activityMap = new Map<string, number>();
    
    tasks?.forEach((task) => {
      if (task.is_completed) {
        const dateKey = format(new Date(task.due_date), 'yyyy-MM-dd');
        activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
      }
    });
    
    attendance?.forEach((record) => {
      if (record.status === 'present') {
        const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
        activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
      }
    });
    
    // Generate 52 weeks x 7 days grid
    const weeks: Array<Array<{ date: Date; count: number; isToday: boolean; isFuture: boolean; isPastWeek: boolean; isCurrentWeek: boolean }>> = [];
    const monthLabels: Array<{ label: string; weekIndex: number }> = [];
    
    // Start from the first Sunday of the year or before
    let firstWeekStart = startOfWeek(yearStart, { weekStartsOn: 0 });
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    
    let lastMonth = -1;
    
    for (let w = 0; w < 53; w++) {
      const week: Array<{ date: Date; count: number; isToday: boolean; isFuture: boolean; isPastWeek: boolean; isCurrentWeek: boolean }> = [];
      const weekStartDate = addDays(firstWeekStart, w * 7);
      const isCurrentWeek = isSameDay(weekStartDate, currentWeekStart);
      const isPastWeek = weekStartDate < currentWeekStart;
      
      for (let d = 0; d < 7; d++) {
        const date = addDays(firstWeekStart, w * 7 + d);
        const dateKey = format(date, 'yyyy-MM-dd');
        const count = activityMap.get(dateKey) || 0;
        
        // Track month labels
        if (d === 0) {
          const month = date.getMonth();
          if (month !== lastMonth && date.getFullYear() === today.getFullYear()) {
            monthLabels.push({ label: format(date, 'MMM'), weekIndex: w });
            lastMonth = month;
          }
        }
        
        week.push({
          date,
          count,
          isToday: isSameDay(date, today),
          isFuture: date > today,
          isPastWeek,
          isCurrentWeek,
        });
      }
      
      weeks.push(week);
    }
    
    return {
      weeksGrid: weeks,
      months: monthLabels,
      currentWeek: weekNumber,
    };
  }, [today, tasks, attendance]);
  
  // Week-based coloring: past weeks and current week are light green
  const getDayClass = (day: { isPastWeek: boolean; isCurrentWeek: boolean; isToday: boolean }) => {
    if (day.isPastWeek || day.isCurrentWeek) {
      return 'bg-emerald-400/70 dark:bg-emerald-500/60';
    }
    return 'bg-muted/40 dark:bg-muted/30';
  };

  return (
    <section className="surface-card p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-sm">{today.getFullYear()} Activity</h2>
          <p className="text-xs text-muted-foreground">Week {currentWeek} of 52</p>
        </div>
      </div>
      
      {/* GitHub-style contribution graph */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="min-w-[640px]">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {months.map((m, i) => (
              <div 
                key={i} 
                className="text-[10px] text-muted-foreground"
                style={{ 
                  position: 'relative',
                  left: `${m.weekIndex * 11}px`,
                  marginRight: i < months.length - 1 ? `${(months[i + 1]?.weekIndex - m.weekIndex - 1) * 11}px` : 0,
                }}
              >
                {m.label}
              </div>
            ))}
          </div>
          
          {/* Grid with day labels */}
          <div className="flex gap-[2px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] mr-1 text-[9px] text-muted-foreground">
              <div className="h-[10px]"></div>
              <div className="h-[10px] flex items-center">Mon</div>
              <div className="h-[10px]"></div>
              <div className="h-[10px] flex items-center">Wed</div>
              <div className="h-[10px]"></div>
              <div className="h-[10px] flex items-center">Fri</div>
              <div className="h-[10px]"></div>
            </div>
            
            {/* Weeks grid */}
            {weeksGrid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px]">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`
                      w-[10px] h-[10px] rounded-[2px] transition-colors
                      ${getDayClass(day)}
                      ${day.isToday ? 'ring-1 ring-foreground ring-offset-1 ring-offset-background' : ''}
                    `}
                    title={`${format(day.date, 'MMM d, yyyy')}${day.isPastWeek ? ' (completed week)' : day.isCurrentWeek ? ' (current week)' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-400/70 dark:bg-emerald-500/60" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-[10px] h-[10px] rounded-[2px] bg-muted/40 dark:bg-muted/30" />
          <span>Upcoming</span>
        </div>
      </div>
    </section>
  );
}
