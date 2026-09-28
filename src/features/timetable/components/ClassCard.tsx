import { MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrentTimeUpdate, timeToMinutes, formatTimeDisplay, getClassStatus } from '@/hooks/useCurrentTimeUpdate';
import type { Database } from '@/integrations/supabase/types';

type TimetableClass = Database['public']['Tables']['classes']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];

interface ClassCardProps {
  classItem: TimetableClass;
  subject: Subject;
  onClick?: () => void;
  showProgress?: boolean;
}

// Generate a lighter/pastel version of the subject color for background
function getBackgroundColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const lightness = 0.85;
  const newR = Math.round(r + (255 - r) * lightness);
  const newG = Math.round(g + (255 - g) * lightness);
  const newB = Math.round(b + (255 - b) * lightness);
  
  return `rgb(${newR}, ${newG}, ${newB})`;
}

// Get a darker text color based on subject color
function getTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const darkness = 0.3;
  const newR = Math.round(r * darkness);
  const newG = Math.round(g * darkness);
  const newB = Math.round(b * darkness);
  
  return `rgb(${newR}, ${newG}, ${newB})`;
}

export function ClassCard({ classItem, subject, onClick, showProgress = false }: ClassCardProps) {
  const bgColor = getBackgroundColor(subject.color);
  const textColor = getTextColor(subject.color);
  
  // Use reactive time state - updates every minute
  const { currentMinutes, dayOfWeek } = useCurrentTimeUpdate();
  
  // Calculate class status using reactive time
  const { status, progress, minutesUntilStart } = getClassStatus(
    classItem.start_time,
    classItem.end_time,
    classItem.day,
    currentMinutes,
    dayOfWeek
  );
  
  const isOngoing = status === 'ongoing';
  const isStartingSoon = status === 'starting_soon';
  
  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer hover:brightness-95 transition-all relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Status indicator */}
      {(isOngoing || isStartingSoon) && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <span 
            className={`w-2 h-2 rounded-full ${isOngoing ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: isOngoing ? subject.color : '#f59e0b' }}
          />
          <span 
            className="text-[10px] font-bold uppercase"
            style={{ color: isOngoing ? subject.color : '#f59e0b' }}
          >
            {isOngoing ? 'Now' : `${minutesUntilStart}m`}
          </span>
        </div>
      )}
      
      <h3 
        className="font-bold text-lg mb-2 leading-tight pr-12"
        style={{ color: textColor }}
      >
        {subject.name}
      </h3>
      
      <div 
        className="flex items-center gap-2 mb-2"
        style={{ color: textColor }}
      >
        <span className="text-sm font-medium">
          {formatTimeDisplay(classItem.start_time)}
        </span>
        <ArrowRight className="w-4 h-4" />
        <span className="text-sm font-medium">
          {formatTimeDisplay(classItem.end_time)}
        </span>
      </div>
      
      {classItem.room && (
        <div 
          className="flex items-center gap-2"
          style={{ color: textColor, opacity: 0.8 }}
        >
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{classItem.room}</span>
        </div>
      )}
      
      {/* Progress bar for ongoing class - updates in real-time */}
      {isOngoing && showProgress && (
        <div 
          className="mt-3 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: `${subject.color}30` }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: subject.color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </div>
  );
}
