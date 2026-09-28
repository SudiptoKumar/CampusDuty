import { useMemo } from 'react';
import { MapPin, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useAttendance, useCreateAttendance } from '@/hooks/useAttendance';
import { useCurrentTimeUpdate, timeToMinutes, formatTimeDisplay } from '@/hooks/useCurrentTimeUpdate';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function NextUpTile() {
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  const { data: attendance } = useAttendance();
  const addAttendance = useCreateAttendance();
  
  // Use reactive time state - updates every minute
  const { currentMinutes, dayOfWeek } = useCurrentTimeUpdate();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { nextClass, subject, isCurrentlyInClass, minutesUntil, progress } = useMemo(() => {
    const todaysClasses = (classes ?? [])
      .filter((c) => c.day === dayOfWeek)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    
    // Find current class first
    const current = todaysClasses.find((c) => {
      const start = timeToMinutes(c.start_time);
      const end = timeToMinutes(c.end_time);
      return currentMinutes >= start && currentMinutes < end;
    });
    
    if (current) {
      const start = timeToMinutes(current.start_time);
      const end = timeToMinutes(current.end_time);
      const duration = end - start;
      const elapsed = currentMinutes - start;
      const subj = subjects?.find(s => s.id === current.subject_id);
      
      return {
        nextClass: current,
        subject: subj,
        isCurrentlyInClass: true,
        minutesUntil: end - currentMinutes,
        progress: (elapsed / duration) * 100,
      };
    }
    
    // Find next upcoming class
    const upcoming = todaysClasses.find((c) => timeToMinutes(c.start_time) > currentMinutes);
    
    if (upcoming) {
      const subj = subjects?.find(s => s.id === upcoming.subject_id);
      return {
        nextClass: upcoming,
        subject: subj,
        isCurrentlyInClass: false,
        minutesUntil: timeToMinutes(upcoming.start_time) - currentMinutes,
        progress: 0,
      };
    }
    
    return { nextClass: null, subject: null, isCurrentlyInClass: false, minutesUntil: 0, progress: 0 };
  }, [classes, subjects, currentMinutes, dayOfWeek]);
  
  const isAttendanceMarked = useMemo(() => {
    if (!nextClass || !attendance) return false;
    return attendance.some(
      a => a.class_id === nextClass.id && a.date === today
    );
  }, [nextClass, attendance, today]);

  // Only allow marking attendance when class is ongoing OR starts within 30 minutes
  const canMarkAttendance = isCurrentlyInClass || minutesUntil <= 30;
  
  const handleMarkAttendance = () => {
    if (!nextClass || !subject) return;
    
    addAttendance.mutate({
      subject_id: subject.id,
      class_id: nextClass.id,
      date: today,
      status: 'present',
    }, {
      onSuccess: () => {
        toast.success('Attendance marked! 🎉');
      }
    });
  };
  
  if (!nextClass || !subject) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 row-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-xl border border-border/50 p-6 flex flex-col items-center justify-center"
      >
        <div className="text-center space-y-2">
          <div className="text-4xl">🎉</div>
          <h3 className="font-semibold text-lg">No More Classes Today!</h3>
          <p className="text-sm text-muted-foreground">Enjoy your free time</p>
        </div>
        <Link to="/timetable" className="mt-4">
          <Button variant="ghost" size="sm" className="gap-2">
            View Timetable <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-2 row-span-2 relative overflow-hidden rounded-3xl"
      style={{
        background: `linear-gradient(135deg, ${subject.color}20, ${subject.color}05)`,
      }}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 backdrop-blur-xl bg-background/40 border border-white/10" />
      
      {/* Progress bar for current class - updates in real-time */}
      {isCurrentlyInClass && (
        <motion.div 
          className="absolute bottom-0 left-0 h-1 bg-primary/80"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      )}
      
      <div className="relative p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {isCurrentlyInClass ? 'Right Now' : 'Next Up'}
            </span>
            {isCurrentlyInClass && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-flex ml-2 w-2 h-2 bg-green-500 rounded-full"
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">
              {isCurrentlyInClass 
                ? `${minutesUntil}m left` 
                : minutesUntil < 60 
                  ? `in ${minutesUntil}m`
                  : `in ${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m`
              }
            </span>
          </div>
        </div>
        
        {/* Subject */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg"
              style={{ backgroundColor: subject.color }}
            >
              {subject.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-xl truncate">{subject.name}</h2>
              <p className="text-sm text-muted-foreground">
                {formatTimeDisplay(nextClass.start_time)} – {formatTimeDisplay(nextClass.end_time)}
              </p>
            </div>
          </div>
          
          {/* Room */}
          {nextClass.room && (
            <div className="flex items-center gap-2 mt-4 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{nextClass.room}</span>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <div className="mt-auto pt-4">
          {isAttendanceMarked ? (
            <div className="flex items-center gap-2 text-green-500 font-medium">
              <CheckCircle2 className="w-5 h-5" />
              <span>Attendance Marked</span>
            </div>
          ) : canMarkAttendance ? (
            <Button 
              onClick={handleMarkAttendance}
              disabled={addAttendance.isPending}
              className="w-full h-12 text-base font-semibold rounded-2xl shadow-lg"
              style={{ 
                backgroundColor: subject.color,
                color: 'white',
              }}
            >
              {addAttendance.isPending ? 'Marking...' : 'Mark Attendance'}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Mark Attendance unlocks 30 minutes before class starts.
              </p>
              <Link to="/timetable">
                <Button variant="secondary" className="w-full h-12 rounded-2xl">
                  View today's classes
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
