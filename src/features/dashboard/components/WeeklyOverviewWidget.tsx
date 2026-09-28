import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Sparkles, ChevronRight, BookOpen, ClipboardCheck, Bell, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { useClasses } from '@/hooks/useClasses';
import { useTasks } from '@/hooks/useTasks';
import { useSubjects } from '@/hooks/useSubjects';
import { cn } from '@/lib/utils';

const getTaskIcon = (type: string) => {
  switch (type) {
    case 'exam': return GraduationCap;
    case 'assignment': return ClipboardCheck;
    case 'reminder': return Bell;
    default: return BookOpen;
  }
};

const getTaskColor = (type: string) => {
  switch (type) {
    case 'exam': return 'text-red-500 bg-red-500/10';
    case 'assignment': return 'text-blue-500 bg-blue-500/10';
    case 'reminder': return 'text-purple-500 bg-purple-500/10';
    default: return 'text-emerald-500 bg-emerald-500/10';
  }
};

export function WeeklyOverviewWidget() {
  const { data: classes } = useClasses();
  const { data: tasks } = useTasks();
  const { data: subjects } = useSubjects();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  
  const today = new Date();
  
  const { weekData, maxCount, upcomingItems } = useMemo(() => {
    const startOfWeekDate = startOfWeek(today, { weekStartsOn: 0 });
    
    // Generate 7 days of the week
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startOfWeekDate, i);
      const dayOfWeek = date.getDay();
      
      // Count classes for this day
      const classCount = classes?.filter((c) => c.day === dayOfWeek).length ?? 0;
      
      // Get tasks for this day
      const dayTasks = tasks?.filter((t) => 
        !t.is_completed && isSameDay(new Date(t.due_date), date)
      ) ?? [];
      
      const total = classCount + dayTasks.length;
      
      return {
        day: format(date, 'EEE')[0],
        fullDay: format(date, 'EEEE'),
        date,
        dateStr: format(date, 'MMM d'),
        count: total,
        classCount,
        taskCount: dayTasks.length,
        tasks: dayTasks,
        isToday: isToday(date),
        isPast: date < today && !isSameDay(date, today),
        isFuture: date > today,
      };
    });
    
    // Calculate max for scaling
    const maxCount = Math.max(...days.map((d) => d.count), 1);
    
    // Get upcoming items (next 5 tasks/events)
    const upcoming = tasks
      ?.filter(t => !t.is_completed && new Date(t.due_date) >= today)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 4) ?? [];
    
    return {
      weekData: days,
      maxCount,
      upcomingItems: upcoming,
    };
  }, [classes, tasks, today]);

  const getSubject = (id: string | null) => subjects?.find(s => s.id === id);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="surface-card p-5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            </motion.div>
          </motion.div>
          <div>
            <h2 className="font-bold text-base">Weekly Overview</h2>
            <p className="text-xs text-muted-foreground">
              {format(startOfWeek(today, { weekStartsOn: 0 }), 'MMM d')} - {format(addDays(startOfWeek(today, { weekStartsOn: 0 }), 6), 'MMM d')}
            </p>
          </div>
        </div>
        
        <Link 
          to="/agenda"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {/* Animated Bar Chart */}
      <div className="flex items-end justify-between h-28 gap-1.5 px-1 mb-6">
        {weekData.map((day, i) => {
          const heightPercent = day.count > 0 ? Math.max((day.count / maxCount) * 100, 12) : 4;
          const isHovered = hoveredDay === i;
          
          return (
            <motion.div 
              key={i}
              className="flex flex-col items-center flex-1 gap-1.5 cursor-pointer"
              onMouseEnter={() => setHoveredDay(i)}
              onMouseLeave={() => setHoveredDay(null)}
              whileHover={{ scale: 1.02 }}
            >
              {/* Count badge on hover */}
              <AnimatePresence>
                {isHovered && day.count > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.8 }}
                    className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full"
                  >
                    {day.count}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Bar */}
              <div className="w-full flex justify-center relative">
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: `${heightPercent}%`,
                    opacity: 1,
                  }}
                  transition={{ 
                    duration: 0.6, 
                    delay: i * 0.08,
                    ease: [0.34, 1.56, 0.64, 1] // bouncy
                  }}
                  className={cn(
                    "w-full max-w-7 rounded-t-md relative overflow-hidden",
                    day.isToday 
                      ? 'bg-gradient-to-t from-primary to-primary/70' 
                      : day.isPast 
                        ? 'bg-muted-foreground/20' 
                        : 'bg-muted/50'
                  )}
                  style={{ 
                    minHeight: day.count > 0 ? '10px' : '3px',
                  }}
                >
                  {/* Shimmer effect for today */}
                  {day.isToday && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: "linear" 
                      }}
                    />
                  )}
                </motion.div>
              </div>
              
              {/* Day indicator dot */}
              <motion.div 
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  day.isToday ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05, type: "spring" }}
              />
              
              {/* Day label */}
              <span className={cn(
                "text-[11px] font-medium",
                day.isToday ? 'text-primary' : 'text-muted-foreground'
              )}>
                {day.day}
              </span>
            </motion.div>
          );
        })}
      </div>
      
      {/* Upcoming Items Preview */}
      {upcomingItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-t border-border/50 pt-4"
        >
          <p className="text-xs font-medium text-muted-foreground mb-3">Coming up</p>
          <div className="space-y-2">
            {upcomingItems.slice(0, 3).map((item, i) => {
              const subject = getSubject(item.subject_id);
              const Icon = getTaskIcon(item.type);
              const colorClass = getTaskColor(item.type);
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center gap-3 group"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(item.due_date), 'EEE, MMM d')}
                      {subject && ` • ${subject.name}`}
                    </p>
                  </div>
                  <div 
                    className="w-1.5 h-6 rounded-full shrink-0"
                    style={{ backgroundColor: subject?.color || 'hsl(var(--muted))' }}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
