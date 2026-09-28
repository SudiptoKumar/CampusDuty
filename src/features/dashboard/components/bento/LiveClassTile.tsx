import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Radio, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useCurrentTimeUpdate, timeToMinutes, formatTimeDisplay, getClassStatus, getEffectiveEndMinutes } from '@/hooks/useCurrentTimeUpdate';
import { cn } from '@/lib/utils';

export function LiveClassTile() {
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  const { currentMinutes, dayOfWeek } = useCurrentTimeUpdate();
  
  // Get today's classes
  const todaysClasses = useMemo(() => {
    return (classes ?? [])
      .filter((c) => c.day === dayOfWeek)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  }, [classes, dayOfWeek]);
  
  // Find the active class (ongoing or starting soon)
  const activeClassData = useMemo(() => {
    for (const classItem of todaysClasses) {
      const { status, progress, minutesUntilStart } = getClassStatus(
        classItem.start_time,
        classItem.end_time,
        classItem.day,
        currentMinutes,
        dayOfWeek
      );
      
      if (status === 'ongoing' || status === 'starting_soon') {
        const subject = subjects?.find(s => s.id === classItem.subject_id);
        const startMins = timeToMinutes(classItem.start_time);
        // Handle midnight crossover
        const endMins = getEffectiveEndMinutes(classItem.start_time, classItem.end_time);
        const minutesRemaining = endMins - currentMinutes;
        
        return {
          classItem,
          subject,
          status,
          progress,
          minutesUntilStart,
          minutesRemaining: status === 'ongoing' ? minutesRemaining : 0,
        };
      }
    }
    return null;
  }, [todaysClasses, subjects, currentMinutes, dayOfWeek]);
  
  // Don't render if no active class
  if (!activeClassData) return null;
  
  const { classItem, subject, status, progress, minutesUntilStart, minutesRemaining } = activeClassData;
  const isLive = status === 'ongoing';
  const subjectColor = subject?.color || 'hsl(var(--primary))';
  
  // Create gradient colors from subject color
  const colorWithOpacity = (opacity: number) => {
    // Check if it's a hex color
    if (subjectColor.startsWith('#')) {
      const r = parseInt(subjectColor.slice(1, 3), 16);
      const g = parseInt(subjectColor.slice(3, 5), 16);
      const b = parseInt(subjectColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return subjectColor;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <Link to="/timetable" className="block">
        <div 
          className={cn(
            "relative overflow-hidden liquid-glass-card p-4"
          )}
        >
          
          {/* Header row */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              {isLive ? (
                <motion.div 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: colorWithOpacity(0.25) }}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: subjectColor }}
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span 
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: subjectColor }}
                  >
                    Live
                  </span>
                </motion.div>
              ) : (
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20"
                >
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wide">
                    Soon
                  </span>
                </div>
              )}
            </div>
            
            <span 
              className="text-sm font-semibold tabular-nums"
              style={{ color: isLive ? subjectColor : 'hsl(var(--amber-500))' }}
            >
              {isLive 
                ? `${minutesRemaining}m left` 
                : `in ${minutesUntilStart}m`
              }
            </span>
          </div>
          
          {/* Main content */}
          <div className="flex items-start gap-3 relative z-10">
            {/* Subject icon/initial */}
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ backgroundColor: subjectColor }}
            >
              {subject?.name?.charAt(0) || '?'}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-foreground truncate">
                {subject?.name || 'Unknown Subject'}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatTimeDisplay(classItem.start_time)} → {formatTimeDisplay(classItem.end_time)}
              </p>
              {classItem.room && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                  <MapPin className="w-3 h-3" /> {classItem.room}
                </p>
              )}
            </div>
          </div>
          
          {/* Progress bar - only for live classes */}
          {isLive && (
            <div className="mt-4 relative z-10">
              <div 
                className="h-2 rounded-full overflow-hidden bg-muted/50"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Class progress: ${Math.round(progress)}% complete`}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: subjectColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                />
              </div>
              
              {/* Progress percentage */}
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span 
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: subjectColor }}
                  aria-hidden="true"
                >
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          )}
          
          {/* Starting soon indicator */}
          {!isLive && (
            <div className="mt-4 relative z-10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Radio className="w-4 h-4 text-amber-500" />
                <span>Class starting soon</span>
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
