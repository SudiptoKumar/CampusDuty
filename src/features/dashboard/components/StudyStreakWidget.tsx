import { useMemo } from 'react';
import { Flame, Zap, Trophy } from 'lucide-react';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';
import { useTasks } from '@/hooks/useTasks';
import { useAttendance } from '@/hooks/useAttendance';
import { AnimatedCounter, TiltCard } from '@/components/shared';

export function StudyStreakWidget() {
  const { data: tasks } = useTasks();
  const { data: attendance } = useAttendance();
  
  const { currentStreak, longestStreak, weekActivity } = useMemo(() => {
    const today = startOfDay(new Date());
    
    // Get activity from tasks (completed) and attendance (present)
    const activityDates = new Set<string>();
    
    tasks?.forEach((task) => {
      if (task.is_completed) {
        activityDates.add(format(new Date(task.due_date), 'yyyy-MM-dd'));
      }
    });
    
    attendance?.forEach((record) => {
      if (record.status === 'present') {
        activityDates.add(format(new Date(record.date), 'yyyy-MM-dd'));
      }
    });
    
    // Calculate current streak
    let streak = 0;
    let checkDate = today;
    while (activityDates.has(format(checkDate, 'yyyy-MM-dd'))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }
    
    // If no activity today, check if yesterday had activity
    if (streak === 0) {
      checkDate = subDays(today, 1);
      while (activityDates.has(format(checkDate, 'yyyy-MM-dd'))) {
        streak++;
        checkDate = subDays(checkDate, 1);
      }
    }
    
    // Calculate longest streak (simplified)
    const sortedDates = Array.from(activityDates).sort();
    let longest = 0;
    let tempStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longest = Math.max(longest, tempStreak, streak);
    
    // Last 7 days activity
    const week = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      return {
        date,
        day: format(date, 'EEE')[0],
        hasActivity: activityDates.has(format(date, 'yyyy-MM-dd')),
        isToday: isSameDay(date, today),
      };
    });
    
    return {
      currentStreak: streak,
      longestStreak: longest,
      weekActivity: week,
    };
  }, [tasks, attendance]);
  
  const getStreakMessage = () => {
    if (currentStreak === 0) return "Start your streak today!";
    if (currentStreak < 3) return "Keep it going!";
    if (currentStreak < 7) return "You're on fire!";
    if (currentStreak < 14) return "Incredible dedication!";
    return "Legendary streak!";
  };

  return (
    <section className="surface-card p-4 relative overflow-hidden">
      {/* Background glow for active streaks */}
      {currentStreak >= 3 && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      )}
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              ${currentStreak >= 3 
                ? 'bg-gradient-to-br from-orange-500 to-red-500' 
                : 'bg-muted'
              }
            `}>
              <Flame className={`w-5 h-5 ${currentStreak >= 3 ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Study Streak</h2>
              <p className="text-xs text-muted-foreground">{getStreakMessage()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${currentStreak >= 3 ? 'text-primary' : 'text-foreground'}`}>
              <AnimatedCounter value={currentStreak} duration={1000} />
            </p>
            <p className="text-xs text-muted-foreground">days</p>
          </div>
        </div>
        
        {/* Week Activity Dots */}
        <div className="flex justify-between mb-4 px-1">
          {weekActivity.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all
                  ${day.hasActivity 
                    ? 'bg-primary text-primary-foreground' 
                    : day.isToday 
                      ? 'bg-muted ring-2 ring-primary/30' 
                      : 'bg-muted/50 text-muted-foreground'
                  }
                `}
              >
                {day.day}
              </div>
              {day.hasActivity && (
                <div className="w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
          ))}
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 flex-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="font-semibold text-sm">
                <AnimatedCounter value={currentStreak} duration={800} /> days
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Longest</p>
              <p className="font-semibold text-sm">
                <AnimatedCounter value={longestStreak} duration={1000} /> days
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
