import { motion } from 'framer-motion';
import { formatTimeDisplay, getClassStatus, timeToMinutes } from '@/hooks/useCurrentTimeUpdate';

interface ScheduleRowProps {
  time: string;
  endTime?: string;
  subjectName: string;
  subjectColor: string;
  classDay?: number;
  currentMinutes?: number;
  currentDayOfWeek?: number;
  showStatus?: boolean;
  animationDelay?: number;
}

/**
 * A pixel-consistent schedule row component
 * - Fixed 70px time column
 * - 8px color dot
 * - Single-line subject text with ellipsis
 * - Optional NOW/SOON badges
 */
export function ScheduleRow({
  time,
  endTime,
  subjectName,
  subjectColor,
  classDay,
  currentMinutes,
  currentDayOfWeek,
  showStatus = false,
  animationDelay = 0,
}: ScheduleRowProps) {
  // Calculate status if we have the necessary data
  let status: 'ongoing' | 'starting_soon' | 'upcoming' | 'past' = 'upcoming';
  let minutesUntilStart = -1;
  
  if (showStatus && endTime && classDay !== undefined && currentMinutes !== undefined && currentDayOfWeek !== undefined) {
    const result = getClassStatus(time, endTime, classDay, currentMinutes, currentDayOfWeek);
    status = result.status;
    minutesUntilStart = result.minutesUntilStart;
  }

  const isNow = status === 'ongoing';
  const isSoon = status === 'starting_soon';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay }}
      className="flex items-center gap-3 h-8"
    >
      {/* Fixed-width time column - right aligned */}
      <span className="w-[70px] flex-shrink-0 text-xs text-muted-foreground font-medium tabular-nums text-right">
        {formatTimeDisplay(time)}
      </span>
      
      {/* Color dot - fixed 8px */}
      <div 
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: subjectColor }}
      />
      
      {/* Subject name - truncate with ellipsis */}
      <span className="flex-1 text-sm font-medium truncate min-w-0">
        {subjectName}
      </span>
      
      {/* Status badge */}
      {isNow && (
        <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase bg-green-500/20 text-green-500 rounded animate-pulse">
          NOW
        </span>
      )}
      {isSoon && (
        <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase bg-amber-500/20 text-amber-500 rounded">
          {minutesUntilStart}m
        </span>
      )}
    </motion.div>
  );
}
