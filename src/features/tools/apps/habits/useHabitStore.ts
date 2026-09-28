import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Habit, HabitTab, HabitFrequency } from './types';

interface HabitState {
  habits: Habit[];
  activeTab: HabitTab;
  selectedHabitId: string | null;
  selectedDate: string; // yyyy-MM-dd

  setActiveTab: (tab: HabitTab) => void;
  selectHabit: (id: string | null) => void;
  setSelectedDate: (date: string) => void;
  addHabit: (name: string, icon: string, color: string, frequency: HabitFrequency, customDays: number[], goal: number) => void;
  removeHabit: (id: string) => void;
  toggleCheckin: (habitId: string, date: string) => void;
  clearAllData: () => void;
}

const STORAGE_KEY = 'campus-duty-habits';

function migrateOldData(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const old = JSON.parse(raw);
    if (!Array.isArray(old)) return [];
    return old.map((h: any) => ({
      id: h.id || crypto.randomUUID(),
      name: h.name || 'Habit',
      icon: '🎯',
      color: h.color || '#5F6AF7',
      frequency: 'daily' as const,
      customDays: [],
      goal: 1,
      checkins: h.checkins || {},
      createdAt: new Date().toISOString(),
    }));
  } catch { return []; }
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set) => ({
      habits: [],
      activeTab: 'dashboard',
      selectedHabitId: null,
      selectedDate: new Date().toISOString().split('T')[0],

      setActiveTab: (tab) => set({ activeTab: tab, selectedHabitId: null }),
      selectHabit: (id) => set({ selectedHabitId: id }),
      setSelectedDate: (date) => set({ selectedDate: date }),

      addHabit: (name, icon, color, frequency, customDays, goal) => set(s => ({
        habits: [...s.habits, {
          id: crypto.randomUUID(),
          name, icon, color, frequency, customDays, goal,
          checkins: {},
          createdAt: new Date().toISOString(),
        }],
      })),

      removeHabit: (id) => set(s => ({
        habits: s.habits.filter(h => h.id !== id),
        selectedHabitId: s.selectedHabitId === id ? null : s.selectedHabitId,
      })),

      toggleCheckin: (habitId, date) => set(s => ({
        habits: s.habits.map(h => h.id === habitId ? {
          ...h, checkins: { ...h.checkins, [date]: !h.checkins[date] }
        } : h),
      })),

      clearAllData: () => set({ habits: [], selectedHabitId: null }),
    }),
    {
      name: 'habit-tracker-store',
      partialize: (s) => ({ habits: s.habits }),
      onRehydrateStorage: () => (state) => {
        if (state && state.habits.length === 0) {
          const migrated = migrateOldData();
          if (migrated.length > 0) {
            state.habits = migrated;
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      },
    }
  )
);
