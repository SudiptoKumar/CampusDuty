import { useState, useMemo, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { Loader2, Calendar, Users, MoreVertical, Bell, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSubjects } from '@/hooks/useSubjects';
import { useClasses } from '@/hooks/useClasses';
import { useProfile } from '@/hooks/useProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { TimetableWeekStrip } from './components/TimetableWeekStrip';
import { ClassCard } from './components/ClassCard';
import { ClassDetailSheet } from './components/ClassDetailSheet';
import { ClassStartingSoonBanner } from '@/features/dashboard/components/ClassStartingSoonBanner';
import type { Database } from '@/integrations/supabase/types';

type TimetableClass = Database['public']['Tables']['classes']['Row'];

export function TimetablePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: subjects } = useSubjects();
  const { data: classes, isLoading } = useClasses();
  const { data: profile } = useProfile();
  const isMobile = useIsMobile();
  
  // Initialize selectedDate from navigation state if provided
  const [selectedDate, setSelectedDate] = useState(() => {
    const state = location.state as { targetDate?: string } | null;
    if (state?.targetDate) {
      return new Date(state.targetDate);
    }
    return new Date();
  });
  const [selectedClass, setSelectedClass] = useState<TimetableClass | null>(null);
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };

    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Clear navigation state after using it (prevents stale state on back navigation)
  useEffect(() => {
    if (location.state?.targetDate) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  const getSubject = (id: string) => subjects?.find((s) => s.id === id);
  
  // Get current month name
  const monthName = format(selectedDate, 'MMMM');
  
  // Get day of week (0-6)
  const selectedDayOfWeek = selectedDate.getDay();
  const isSelectedToday = isToday(selectedDate);
  
  // Helper to convert time string to minutes for proper sorting
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Handle end times that cross midnight
  const getEffectiveEndMinutes = (startTime: string, endTime: string) => {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    return end < start ? end + 1440 : end;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  // Get classes for selected day, sorted by start time
  const dayClasses = useMemo(() => {
    return (classes ?? [])
      .filter((c) => c.day === selectedDayOfWeek)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  }, [classes, selectedDayOfWeek]);

  // Find current class (happening right now) - only for today
  const currentClass = useMemo(() => {
    if (!isSelectedToday) return null;
    return dayClasses.find((c) => {
      const start = timeToMinutes(c.start_time);
      const end = getEffectiveEndMinutes(c.start_time, c.end_time); // Handle midnight crossover
      return currentMinutes >= start && currentMinutes < end;
    });
  }, [dayClasses, currentMinutes, isSelectedToday]);

  // Calculate progress and remaining time for current class
  const currentClassInfo = useMemo(() => {
    if (!currentClass) return null;
    
    const startMinutes = timeToMinutes(currentClass.start_time);
    const endMinutes = getEffectiveEndMinutes(currentClass.start_time, currentClass.end_time); // Handle midnight crossover
    const totalDuration = endMinutes - startMinutes;
    const elapsed = currentMinutes - startMinutes;
    const remaining = endMinutes - currentMinutes;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    return {
      remainingMinutes: Math.max(0, remaining),
      progressPercent: progress,
    };
  }, [currentClass, currentMinutes]);

  const formatRemainingTime = (mins: number): string => {
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  // Get upcoming classes (excluding current)
  const upcomingClasses = useMemo(() => {
    if (!isSelectedToday) return dayClasses;
    return dayClasses.filter((c) => {
      if (currentClass && c.id === currentClass.id) return false;
      const start = timeToMinutes(c.start_time);
      return start > currentMinutes;
    });
  }, [dayClasses, currentMinutes, currentClass, isSelectedToday]);

  // Get past classes
  const pastClasses = useMemo(() => {
    if (!isSelectedToday) return [];
    return dayClasses.filter((c) => {
      if (currentClass && c.id === currentClass.id) return false;
      const end = getEffectiveEndMinutes(c.start_time, c.end_time); // Handle midnight crossover
      return end <= currentMinutes;
    });
  }, [dayClasses, currentMinutes, currentClass, isSelectedToday]);
  
  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };
  
  const handleClassClick = (classItem: TimetableClass) => {
    setSelectedClass(classItem);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const selectedSubject = selectedClass ? getSubject(selectedClass.subject_id) : null;
  const currentSubject = currentClass ? getSubject(currentClass.subject_id) : null;
  const alertMinutes = profile?.class_alert_minutes ?? 5;
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{monthName}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoToToday}
              className="h-9 w-9"
            >
              <Calendar className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/teachers')}
              className="h-9 w-9"
            >
              <Users className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Week Strip */}
        <TimetableWeekStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </header>
      
      {/* Class Starting Soon Banner - Only for today */}
      {isSelectedToday && subjects && classes && (
        <div className="px-4 mb-4">
          <ClassStartingSoonBanner
            classes={classes}
            subjects={subjects}
            alertMinutes={alertMinutes}
          />
        </div>
      )}
      
      {/* Classes List */}
      <div className="px-4 py-2 space-y-4">
        {/* Current Class - Right Now */}
        {currentClass && currentSubject && currentClassInfo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Bell className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-medium text-sm text-primary">Right now</span>
            </div>
            
            <div 
              className="surface-card p-4 relative overflow-hidden cursor-pointer"
              onClick={() => handleClassClick(currentClass)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: currentSubject.color }}
                    />
                    <h3 className="font-semibold truncate">{currentSubject.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                    <span>{formatTime(currentClass.start_time)}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{formatTime(currentClass.end_time)}</span>
                  </div>
                  
                  {currentClass.room && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{currentClass.room}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatRemainingTime(currentClassInfo.remainingMinutes)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${currentClassInfo.progressPercent}%`,
                    backgroundColor: currentSubject.color,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Classes */}
        {upcomingClasses.length > 0 && (
          <div className="space-y-3">
            {isSelectedToday && currentClass && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                  <Clock className="w-3 h-3 text-accent-foreground" />
                </div>
                <span className="font-medium text-sm">Upcoming</span>
              </div>
            )}
            
            {upcomingClasses.map((classItem) => {
              const subject = getSubject(classItem.subject_id);
              if (!subject) return null;
              
              return (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  subject={subject}
                  onClick={() => handleClassClick(classItem)}
                  showProgress
                />
              );
            })}
          </div>
        )}

        {/* Past Classes - Only for today */}
        {pastClasses.length > 0 && (
          <div className="space-y-3 opacity-60">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Earlier today</span>
            </div>
            
            {pastClasses.map((classItem) => {
              const subject = getSubject(classItem.subject_id);
              if (!subject) return null;
              
              return (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  subject={subject}
                  onClick={() => handleClassClick(classItem)}
                  showProgress
                />
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {dayClasses.length === 0 && (
          <EmptyState
            icon={<Calendar className="w-8 h-8" />}
            title="No classes scheduled"
            description={`No classes for ${format(selectedDate, 'EEEE')}. Tap + to add your first class.`}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/timetable/add')}
                className="mt-2"
              >
                Add Class
              </Button>
            }
          />
        )}
      </div>
      
      {/* Class Detail Sheet */}
      {selectedClass && selectedSubject && (
        <ClassDetailSheet
          open={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          classItem={selectedClass}
          subject={selectedSubject}
        />
      )}
    </div>
  );
}

export default TimetablePage;
