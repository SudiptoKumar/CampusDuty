export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';
export type TaskCategory = 'work' | 'personal' | 'study';
export type PomodoroTab = 'timer' | 'tasks' | 'sounds' | 'stats';

export interface PomodoroTask {
  id: string;
  name: string;
  category: TaskCategory;
  estimatedPomodoros: number;
  completedPomodoros: number;
  done: boolean;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  date: string;
  duration: number; // seconds
  type: TimerPhase;
  taskId: string | null;
}

export interface SoundPreset {
  id: string;
  name: string;
  description: string;
  category: 'nature' | 'mechanical';
  filterFreq: number;
  gain: number;
}

export interface TimerSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  dailyGoal: number;
}
