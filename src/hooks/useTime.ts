import { useState, useEffect } from 'react';
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';

export function useCurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  return time;
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return 'Today';
  }
  if (isTomorrow(date)) {
    return 'Tomorrow';
  }
  
  const daysAway = differenceInDays(date, new Date());
  
  if (daysAway > 0 && daysAway <= 7) {
    return format(date, 'EEEE'); // Day name
  }
  
  return format(date, 'MMM d');
}

export function isOverdue(dateString: string): boolean {
  const date = new Date(dateString);
  return isPast(date) && !isToday(date);
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
