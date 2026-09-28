export type HabitFrequency = 'daily' | 'weekly' | 'custom';
export type HabitTab = 'dashboard' | 'stats' | 'settings';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  customDays: number[]; // 0-6 for Sun-Sat
  goal: number;
  checkins: Record<string, boolean>; // yyyy-MM-dd -> true
  createdAt: string;
}
