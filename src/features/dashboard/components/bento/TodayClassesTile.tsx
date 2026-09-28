import { useMemo } from 'react';
import { Clock, ChevronRight, MapPin, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { addDays, format } from 'date-fns';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useCurrentTimeUpdate, timeToMinutes, formatTimeDisplay, getClassStatus, getEffectiveEndMinutes } from '@/hooks/useCurrentTimeUpdate';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TodayClassesTile() {
  const navigate = useNavigate();
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  
  // Use reactive time state - updates every minute
  const { currentMinutes, dayOfWeek } = useCurrentTimeUpdate();
  
  // Calculate which day to show and the display data
  const { displayClasses, remainingCount, showNextDay, nextDayName, nextDayDate, activeClassId } = useMemo(() => {
    const today = new Date();
    
    // Get today's classes sorted by time
    const todaysClasses = (classes ?? [])
      .filter((c) => c.day === dayOfWeek)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    
    // Find the active class (ongoing or starting soon) - this will be shown in LiveClassTile
    let currentActiveClassId: string | null = null;
    for (const c of todaysClasses) {
      const { status } = getClassStatus(c.start_time, c.end_time, c.day, currentMinutes, dayOfWeek);
      if (status === 'ongoing' || status === 'starting_soon') {
        currentActiveClassId = c.id;
        break;
      }
    }
    
    // Find upcoming classes (not yet ended), excluding the active class shown in LiveClassTile
    // Use getEffectiveEndMinutes to handle midnight crossover correctly
    const upcomingToday = todaysClasses.filter((c) => 
      getEffectiveEndMinutes(c.start_time, c.end_time) > currentMinutes && c.id !== currentActiveClassId
    );
    
    // If today has classes remaining (excluding active), show today
    if (upcomingToday.length > 0 || currentActiveClassId) {
      return {
        displayClasses: upcomingToday,
        remainingCount: 0,
        showNextDay: false,
        nextDayName: '',
        nextDayDate: null,
        activeClassId: currentActiveClassId,
      };
    }
    
    // Otherwise, find the NEXT available day with classes (up to 7 days ahead)
    for (let offset = 1; offset <= 7; offset++) {
      const checkDay = (dayOfWeek + offset) % 7;
      const checkDate = addDays(today, offset);
      const dayClasses = (classes ?? [])
        .filter((c) => c.day === checkDay)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
      
      if (dayClasses.length > 0) {
        return {
          displayClasses: dayClasses,
          remainingCount: 0,
          showNextDay: true,
          nextDayName: DAY_NAMES[checkDay],
          nextDayDate: checkDate,
          activeClassId: null,
        };
      }
    }
    
    // No classes in the next week
    return {
      displayClasses: [],
      remainingCount: 0,
      showNextDay: true,
      nextDayName: '',
      nextDayDate: null,
      activeClassId: null,
    };
  }, [classes, dayOfWeek, currentMinutes]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden liquid-glass-card p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${showNextDay ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
            {showNextDay ? (
              <CalendarDays className="w-4 h-4 text-blue-500" />
            ) : (
              <Clock className="w-4 h-4 text-green-500" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {showNextDay ? nextDayName || 'No Upcoming' : "Today's Classes"}
            </span>
            {showNextDay && nextDayDate && (
              <span className="text-xs text-muted-foreground">{format(nextDayDate, 'MMM d')}</span>
            )}
          </div>
        </div>
        <button 
          onClick={() => navigate('/timetable', { 
            state: { targetDate: (showNextDay && nextDayDate ? nextDayDate : new Date()).toISOString() } 
          })}
          aria-label="View all classes in timetable"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
        >
          View all <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>
      
      {/* Content - Pixel consistent layout */}
      {displayClasses.length > 0 ? (
        <div className="space-y-1">
          {displayClasses.map((classItem, index) => {
            const subject = subjects?.find(s => s.id === classItem.subject_id);
            // Only check real-time status for today's classes
            const { status, progress, minutesUntilStart } = !showNextDay
              ? getClassStatus(
                  classItem.start_time, 
                  classItem.end_time, 
                  classItem.day,
                  currentMinutes,
                  dayOfWeek
                )
              : { status: 'upcoming' as const, progress: 0, minutesUntilStart: 0 };
            
            const isNow = status === 'ongoing';
            const isSoon = status === 'starting_soon';
            
            return (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="relative"
              >
                {/* Main row - fixed height */}
                <div className="flex items-center gap-2 h-8">
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
                  
                {/* Status badge - only for today, only if not showing in LiveClassTile */}
                  {!showNextDay && isSoon && !activeClassId && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase bg-amber-500/20 text-amber-500 rounded">
                      {minutesUntilStart}m
                    </span>
                  )}
                </div>
                
                {/* Room info - only show for first class if available */}
                {index === 0 && classItem.room && (
                  <div className="ml-[72px] mt-0.5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {classItem.room}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
          
        </div>
      ) : (
        <div className="text-center py-6">
          <div className={`w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center ${showNextDay ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
            <span className="text-2xl">{showNextDay ? '📅' : '🎉'}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {showNextDay ? 'No classes this week' : 'No more classes today'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {showNextDay ? 'Add classes in timetable' : 'Enjoy your free time!'}
          </p>
        </div>
      )}
    </motion.div>
  );
}
