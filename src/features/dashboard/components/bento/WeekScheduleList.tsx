import { motion } from 'framer-motion';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useCurrentTimeUpdate, timeToMinutes, formatTimeDisplay } from '@/hooks/useCurrentTimeUpdate';
import { addDays, format, startOfDay } from 'date-fns';

export function WeekScheduleList() {
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  
  // Use reactive time state - updates at midnight
  const { dayOfWeek } = useCurrentTimeUpdate();
  
  const today = startOfDay(new Date());
  
  // Generate next 7 days starting from day after tomorrow
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i + 2));
  
  const getClassesForDay = (dayNum: number) => {
    return (classes ?? [])
      .filter((c) => c.day === dayNum)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
      .slice(0, 4);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {days.map((day, dayIndex) => {
        const dayClasses = getClassesForDay(day.getDay());
        const dayName = format(day, 'EEEE');
        const dateStr = format(day, 'MMM d, yyyy');
        
        return (
          <div key={dayIndex} className="liquid-glass-card overflow-hidden">
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
              <h3 className="font-semibold text-sm">{dayName}</h3>
              <span className="text-xs text-muted-foreground">{dateStr}</span>
            </div>
            
            {/* Classes - Pixel consistent layout */}
            {dayClasses.length > 0 ? (
              <div className="px-4 py-2 space-y-1">
                {dayClasses.map((classItem) => {
                  const subject = subjects?.find(s => s.id === classItem.subject_id);
                  
                  return (
                    <div 
                      key={classItem.id}
                      className="flex items-center gap-2 h-8"
                    >
                      {/* Fixed-width time column - right aligned */}
                      <span className="w-[62px] flex-shrink-0 text-xs text-muted-foreground font-medium tabular-nums text-right">
                        {formatTimeDisplay(classItem.start_time)}
                      </span>
                      
                      {/* Color dot - fixed 8px */}
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subject?.color || '#666' }}
                      />
                      
                      {/* Subject name - truncate with ellipsis */}
                      <span className="flex-1 text-sm font-medium truncate min-w-0">
                        {subject?.name || 'Unknown'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-3 text-xs text-muted-foreground">
                No classes scheduled
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
