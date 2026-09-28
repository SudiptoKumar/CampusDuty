import { useState, useEffect } from 'react';

/**
 * A centralized hook that provides reactive time state.
 * Components using this hook will re-render when time updates.
 * 
 * @param intervalMs - Update interval in milliseconds (default: 60000 = 1 minute)
 * @returns Object containing current time values that update reactively
 */
export function useCurrentTimeUpdate(intervalMs = 60000) {
  const [timeState, setTimeState] = useState(() => {
    const now = new Date();
    return {
      currentMinutes: now.getHours() * 60 + now.getMinutes(),
      dayOfWeek: now.getDay(),
      timestamp: now.getTime(),
    };
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeState({
        currentMinutes: now.getHours() * 60 + now.getMinutes(),
        dayOfWeek: now.getDay(),
        timestamp: now.getTime(),
      });
    };

    // Update immediately on mount to sync
    update();

    const interval = setInterval(update, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return timeState;
}

/**
 * Helper to convert time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Handle end times that cross midnight (e.g., 23:00 → 00:30)
 * If end time is less than start time, add 24 hours to get effective end
 */
export function getEffectiveEndMinutes(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  // If end time is less than start time, it crosses midnight
  return end < start ? end + 1440 : end;
}

/**
 * Helper to format time string to 12-hour format
 */
export function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Calculate class status and progress
 */
/**
 * Calculate class status and progress
 * @returns status: 'ongoing' | 'starting_soon' | 'upcoming' | 'past'
 *          progress: percentage for ongoing classes
 *          minutesUntilStart: minutes until class starts (for upcoming/starting_soon)
 */
export function getClassStatus(
  startTime: string, 
  endTime: string, 
  classDay: number,
  currentMinutes: number,
  currentDayOfWeek: number
): { 
  status: 'ongoing' | 'starting_soon' | 'upcoming' | 'past'; 
  progress: number;
  minutesUntilStart: number;
} {
  const start = timeToMinutes(startTime);
  const end = getEffectiveEndMinutes(startTime, endTime); // Handle midnight crossover
  const minutesUntilStart = start - currentMinutes;
  
  // Only check ongoing/starting_soon for same day
  if (classDay !== currentDayOfWeek) {
    return { status: 'upcoming', progress: 0, minutesUntilStart: -1 };
  }
  
  // For midnight crossover, also consider if currentMinutes is past midnight (0-60) 
  // and the class started before midnight
  const effectiveCurrentMinutes = currentMinutes < start && end > 1440 
    ? currentMinutes + 1440 
    : currentMinutes;
  
  if (effectiveCurrentMinutes >= start && effectiveCurrentMinutes < end) {
    const progress = ((effectiveCurrentMinutes - start) / (end - start)) * 100;
    return { status: 'ongoing', progress, minutesUntilStart: 0 };
  }
  
  if (effectiveCurrentMinutes >= end) {
    return { status: 'past', progress: 100, minutesUntilStart: -1 };
  }
  
  // Starting soon: up to 30 minutes before class starts
  if (minutesUntilStart > 0 && minutesUntilStart <= 30) {
    return { status: 'starting_soon', progress: 0, minutesUntilStart };
  }
  
  return { status: 'upcoming', progress: 0, minutesUntilStart };
}
