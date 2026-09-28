import { useState, useEffect, useMemo, forwardRef } from 'react';
import { Bell, X } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type TimetableClass = Database['public']['Tables']['classes']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];

interface ClassStartingSoonBannerProps {
  classes: TimetableClass[];
  subjects: Subject[];
  alertMinutes: number;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export const ClassStartingSoonBanner = forwardRef<HTMLDivElement, ClassStartingSoonBannerProps>(
  function ClassStartingSoonBanner({ classes, subjects, alertMinutes }, ref) {
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [dismissedClasses, setDismissedClasses] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };

    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const upcomingClass = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    return classes
      .filter((c) => {
        if (c.day !== dayOfWeek) return false;
        if (dismissedClasses.has(c.id)) return false;
        
        const startMinutes = timeToMinutes(c.start_time);
        const minutesUntilStart = startMinutes - currentMinutes;
        
        return minutesUntilStart > 0 && minutesUntilStart <= alertMinutes;
      })
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))[0];
  }, [classes, currentMinutes, alertMinutes, dismissedClasses]);

  const getSubject = (id: string) => subjects.find((s) => s.id === id);

  if (!upcomingClass) return null;

  const subject = getSubject(upcomingClass.subject_id);
  if (!subject) return null;

  const startMinutes = timeToMinutes(upcomingClass.start_time);
  const minutesUntilStart = startMinutes - currentMinutes;

  const handleDismiss = () => {
    setDismissedClasses((prev) => new Set([...prev, upcomingClass.id]));
  };

  return (
    <div 
      className="relative rounded-2xl p-4 animate-fade-in border"
      style={{ 
        backgroundColor: `${subject.color}15`,
        borderColor: `${subject.color}30`,
      }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/10 transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
      
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: subject.color }}
        >
          <Bell className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium mb-0.5" style={{ color: subject.color }}>
            Starting in {minutesUntilStart} min
          </p>
          <p className="font-semibold truncate">{subject.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatTime(upcomingClass.start_time)}
            {upcomingClass.room && ` • ${upcomingClass.room}`}
          </p>
        </div>
      </div>
    </div>
  );
});
