import type { Database } from '@/integrations/supabase/types';

type TimetableClass = Database['public']['Tables']['classes']['Row'];

/**
 * Check if two time ranges overlap.
 * Times are in "HH:MM" format.
 */
export function hasTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Find classes that conflict with a given day + time range.
 * Optionally exclude a class by ID (useful when editing).
 */
export function findConflictingClasses(
  classes: TimetableClass[],
  day: number,
  startTime: string,
  endTime: string,
  excludeId?: string
): TimetableClass[] {
  return classes.filter((c) => {
    if (c.id === excludeId) return false;
    if (c.day !== day) return false;
    return hasTimeOverlap(startTime, endTime, c.start_time, c.end_time);
  });
}
