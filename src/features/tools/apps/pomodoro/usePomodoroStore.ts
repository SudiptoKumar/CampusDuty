import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PomodoroTask, SessionRecord, TimerSettings, PomodoroTab, TaskCategory } from './types';

interface PomodoroState {
  activeTab: PomodoroTab;
  tasks: PomodoroTask[];
  sessions: SessionRecord[];
  settings: TimerSettings;
  activeTaskId: string | null;
  activeSound: string | null;
  soundVolume: number;

  setActiveTab: (tab: PomodoroTab) => void;
  addTask: (name: string, category: TaskCategory, estimated: number) => void;
  removeTask: (id: string) => void;
  toggleTaskDone: (id: string) => void;
  incrementTaskPomodoro: (id: string) => void;
  setActiveTask: (id: string | null) => void;
  addSession: (session: Omit<SessionRecord, 'id'>) => void;
  updateSettings: (s: Partial<TimerSettings>) => void;
  setActiveSound: (id: string | null) => void;
  setSoundVolume: (v: number) => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      activeTab: 'timer',
      tasks: [],
      sessions: [],
      settings: {
        focusDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: false,
        autoStartFocus: false,
        dailyGoal: 8,
      },
      activeTaskId: null,
      activeSound: null,
      soundVolume: 30,

      setActiveTab: (tab) => set({ activeTab: tab }),

      addTask: (name, category, estimated) => set(s => ({
        tasks: [...s.tasks, {
          id: crypto.randomUUID(),
          name,
          category,
          estimatedPomodoros: estimated,
          completedPomodoros: 0,
          done: false,
          createdAt: new Date().toISOString(),
        }],
      })),

      removeTask: (id) => set(s => ({
        tasks: s.tasks.filter(t => t.id !== id),
        activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
      })),

      toggleTaskDone: (id) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t),
      })),

      incrementTaskPomodoro: (id) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t),
      })),

      setActiveTask: (id) => set({ activeTaskId: id }),

      addSession: (session) => set(s => ({
        sessions: [...s.sessions, { ...session, id: crypto.randomUUID() }],
      })),

      updateSettings: (partial) => set(s => ({ settings: { ...s.settings, ...partial } })),
      setActiveSound: (id) => set({ activeSound: id }),
      setSoundVolume: (v) => set({ soundVolume: v }),
    }),
    {
      name: 'pomodoro-store',
      partialize: (s) => ({
        tasks: s.tasks,
        sessions: s.sessions,
        settings: s.settings,
        activeSound: s.activeSound,
        soundVolume: s.soundVolume,
      }),
    }
  )
);
