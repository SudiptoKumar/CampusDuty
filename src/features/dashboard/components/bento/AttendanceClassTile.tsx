import { UserCheck, TrendingUp, BookOpen, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAttendance, calculateAttendanceStats } from '@/hooks/useAttendance';
import { useSubjects } from '@/hooks/useSubjects';
import { useClasses } from '@/hooks/useClasses';
import { AnimatedProgressRing } from '@/components/shared';
import { format, differenceInMinutes, parse, isToday } from 'date-fns';

export function AttendanceClassTile() {
  const { data: attendance } = useAttendance();
  const { data: subjects } = useSubjects();
  const { data: classes } = useClasses();
  
  const stats = calculateAttendanceStats(attendance ?? []);
  const attendanceRate = stats.total > 0 ? stats.rate : 0;
  
  // Check if there's a class coming up within 30 minutes or currently happening
  const now = new Date();
  const currentDay = now.getDay();
  
  const todayClasses = (classes ?? [])
    .filter(c => c.day === currentDay)
    .map(c => {
      const startTime = parse(c.start_time, 'HH:mm:ss', now);
      const endTime = parse(c.end_time, 'HH:mm:ss', now);
      const minutesUntilStart = differenceInMinutes(startTime, now);
      const minutesUntilEnd = differenceInMinutes(endTime, now);
      return {
        ...c,
        startTime,
        endTime,
        minutesUntilStart,
        minutesUntilEnd,
        isOngoing: minutesUntilStart <= 0 && minutesUntilEnd > 0,
        isUpcoming: minutesUntilStart > 0 && minutesUntilStart <= 30,
      };
    });
  
  const ongoingClass = todayClasses.find(c => c.isOngoing);
  const upcomingClass = todayClasses.find(c => c.isUpcoming);
  const showAttendancePrompt = ongoingClass || upcomingClass;
  const activeClass = ongoingClass || upcomingClass;
  const activeSubject = activeClass ? subjects?.find(s => s.id === activeClass.subject_id) : null;
  
  // Subject progress - top 3 subjects by class count
  const subjectProgress = subjects?.slice(0, 3).map(subject => {
    const subjectAttendance = (attendance ?? []).filter(a => a.subject_id === subject.id);
    const subjectStats = calculateAttendanceStats(subjectAttendance);
    return {
      id: subject.id,
      name: subject.name,
      color: subject.color,
      rate: subjectStats.total > 0 ? subjectStats.rate : 0,
      total: subjectStats.total,
    };
  }) || [];
  
  const getStatusColor = (rate: number) => {
    if (rate >= 75) return 'text-green-500';
    if (rate >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="col-span-2 relative overflow-hidden rounded-3xl backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 p-4"
    >
      {/* Class prompt banner */}
      {showAttendancePrompt && activeSubject && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-3 p-2 rounded-xl flex items-center gap-2"
          style={{ backgroundColor: `${activeSubject.color}20` }}
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: activeSubject.color }}
          >
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{activeSubject.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {ongoingClass ? 'Happening now' : `Starts in ${activeClass?.minutesUntilStart} min`}
            </p>
          </div>
          <Link
            to="/attendance"
            className="px-3 py-1.5 rounded-lg text-[10px] font-medium text-white"
            style={{ backgroundColor: activeSubject.color }}
          >
            Mark
          </Link>
        </motion.div>
      )}
      
      <div className="flex gap-4">
        {/* Attendance Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-blue-500" />
            </div>
            <span className="font-semibold text-sm">Attendance</span>
          </div>
          
          <div className="flex items-center gap-3">
            <AnimatedProgressRing 
              value={attendanceRate} 
              size={56} 
              strokeWidth={5}
              className="flex-shrink-0"
            />
            <div>
              <p className={`text-2xl font-bold ${getStatusColor(attendanceRate)}`}>
                {attendanceRate.toFixed(0)}%
              </p>
              <p className="text-[10px] text-muted-foreground">
                {stats.present} of {stats.total} classes
              </p>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-px bg-border/50" />
        
        {/* Subject Progress Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <span className="font-semibold text-sm">Subjects</span>
          </div>
          
          <div className="space-y-2">
            {subjectProgress.length > 0 ? (
              subjectProgress.map((subject) => (
                <div key={subject.id} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="text-xs flex-1 truncate">{subject.name}</span>
                  <span className={`text-xs font-medium ${getStatusColor(subject.rate)}`}>
                    {subject.rate.toFixed(0)}%
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs">No subjects yet</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex justify-between mt-3 pt-2 border-t border-border/30">
        <Link to="/attendance" className="text-[10px] text-blue-500 font-medium hover:underline">
          View Attendance →
        </Link>
        <Link to="/subjects" className="text-[10px] text-indigo-500 font-medium hover:underline">
          View Subjects →
        </Link>
      </div>
    </motion.div>
  );
}
