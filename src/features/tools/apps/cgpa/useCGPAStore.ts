import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Semester, Course, CGPASettings, ViewTab } from './types';

interface CGPAState {
  semesters: Semester[];
  settings: CGPASettings;
  activeTab: ViewTab;
  selectedSemesterId: string | null;

  setActiveTab: (tab: ViewTab) => void;
  selectSemester: (id: string | null) => void;

  addSemester: () => void;
  removeSemester: (id: string) => void;
  renameSemester: (id: string, name: string) => void;

  addCourse: (semesterId: string, course: Omit<Course, 'id'>) => void;
  updateCourse: (semesterId: string, courseId: string, data: Partial<Course>) => void;
  removeCourse: (semesterId: string, courseId: string) => void;

  updateSettings: (s: Partial<CGPASettings>) => void;
}

export const useCGPAStore = create<CGPAState>()(
  persist(
    (set, get) => ({
      semesters: [],
      settings: { scale: 4.0, passMark: 1.0, roundingDecimals: 2 },
      activeTab: 'dashboard',
      selectedSemesterId: null,

      setActiveTab: (tab) => set({ activeTab: tab }),
      selectSemester: (id) => set({ selectedSemesterId: id, activeTab: id ? 'semesters' : get().activeTab }),

      addSemester: () => {
        const { semesters } = get();
        const newSem: Semester = {
          id: crypto.randomUUID(),
          name: `Semester ${semesters.length + 1}`,
          courses: [],
        };
        set({ semesters: [...semesters, newSem] });
      },

      removeSemester: (id) => set(s => ({
        semesters: s.semesters.filter(sem => sem.id !== id),
        selectedSemesterId: s.selectedSemesterId === id ? null : s.selectedSemesterId,
      })),

      renameSemester: (id, name) => set(s => ({
        semesters: s.semesters.map(sem => sem.id === id ? { ...sem, name } : sem),
      })),

      addCourse: (semesterId, course) => set(s => ({
        semesters: s.semesters.map(sem =>
          sem.id === semesterId
            ? { ...sem, courses: [...sem.courses, { ...course, id: crypto.randomUUID() }] }
            : sem
        ),
      })),

      updateCourse: (semesterId, courseId, data) => set(s => ({
        semesters: s.semesters.map(sem =>
          sem.id === semesterId
            ? { ...sem, courses: sem.courses.map(c => c.id === courseId ? { ...c, ...data } : c) }
            : sem
        ),
      })),

      removeCourse: (semesterId, courseId) => set(s => ({
        semesters: s.semesters.map(sem =>
          sem.id === semesterId
            ? { ...sem, courses: sem.courses.filter(c => c.id !== courseId) }
            : sem
        ),
      })),

      updateSettings: (partial) => set(s => ({ settings: { ...s.settings, ...partial } })),
    }),
    {
      name: 'cgpa-calculator-store',
      partialize: (state) => ({
        semesters: state.semesters,
        settings: state.settings,
      }),
    }
  )
);
