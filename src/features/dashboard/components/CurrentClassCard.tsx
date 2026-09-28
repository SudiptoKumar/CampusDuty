import { useState, useEffect, useMemo } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { TiltCard } from '@/components/shared';

type TimetableClass = Database['public']['Tables']['classes']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];

interface CurrentClassCardProps {
  classItem: TimetableClass;
  subject: Subject;
  type: 'current' | 'next';
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

export function CurrentClassCard({ classItem, subject, type }: CurrentClassCardProps) {
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };

    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const startMinutes = timeToMinutes(classItem.start_time);
  const endMinutes = timeToMinutes(classItem.end_time);
  const totalDuration = endMinutes - startMinutes;
  
  const { remainingMinutes, progressPercent } = useMemo(() => {
    if (type !== 'current') {
      return { remainingMinutes: 0, progressPercent: 0 };
    }
    
    const elapsed = currentMinutes - startMinutes;
    const remaining = endMinutes - currentMinutes;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    return {
      remainingMinutes: Math.max(0, remaining),
      progressPercent: progress,
    };
  }, [currentMinutes, startMinutes, endMinutes, totalDuration, type]);

  const formatRemainingTime = (mins: number): string => {
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      return minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`;
    }
    return `${mins}m left`;
  };

  return (
    <TiltCard tiltAmount={6} className="rounded-2xl">
      <div 
        className="rounded-2xl p-4 border"
        style={{ 
          backgroundColor: `${subject.color}10`,
          borderColor: `${subject.color}30`,
        }}
      >
        {/* Live indicator */}
        {type === 'current' && (
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span 
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: subject.color }}
              />
              <span 
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: subject.color }}
              />
            </span>
            <span className="text-xs font-medium" style={{ color: subject.color }}>
              In Progress
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: subject.color }}
          >
            {subject.name.charAt(0)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{subject.name}</h3>
            <p className="text-sm text-muted-foreground">
              {formatTime(classItem.start_time)} – {formatTime(classItem.end_time)}
              {classItem.room && (
                <span className="ml-2">• {classItem.room}</span>
              )}
            </p>
          </div>

          {type === 'current' && (
            <div 
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ 
                backgroundColor: `${subject.color}20`,
                color: subject.color,
              }}
            >
              {formatRemainingTime(remainingMinutes)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {type === 'current' && (
          <div className="mt-4 h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000"
              style={{ 
                width: `${progressPercent}%`,
                backgroundColor: subject.color,
              }}
            />
          </div>
        )}
      </div>
    </TiltCard>
  );
}
