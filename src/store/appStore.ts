import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Subject, 
  TimetableClass, 
  Task, 
  Teacher, 
  Term, 
  Grade, 
  AppSettings,
  AttendanceRecord 
} from '@/types';
import { 
  mockSubjects, 
  mockClasses, 
  mockTasks, 
  mockTeachers, 
  mockTerms, 
  mockGrades,
  generateId 
} from '@/lib/mockData';

// Default settings
const defaultSettings: AppSettings = {
  theme: 'dark',
  primaryColor: '#22C55E',
  startOfWeek: 1, // Monday
  gradingSystem: 'numeric_100',
  defaultClassDuration: 90,
  showWeekends: false,
  classAlertMinutes: 5,
  userName: 'Student',
  ttsEnabled: true,
};

interface AppState {
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Subjects
  subjects: Subject[];
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  getSubjectById: (id: string) => Subject | undefined;
  
  // Teachers
  teachers: Teacher[];
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  
  // Timetable Classes
  classes: TimetableClass[];
  addClass: (classItem: Omit<TimetableClass, 'id'>) => void;
  updateClass: (id: string, updates: Partial<TimetableClass>) => void;
  deleteClass: (id: string) => void;
  getClassesByDay: (day: number) => TimetableClass[];
  
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  
  // Terms
  terms: Term[];
  addTerm: (term: Omit<Term, 'id'>) => void;
  
  // Grades
  grades: Grade[];
  addGrade: (grade: Omit<Grade, 'id'>) => void;
  updateGrade: (id: string, updates: Partial<Grade>) => void;
  deleteGrade: (id: string) => void;
  
  // Attendance
  attendance: AttendanceRecord[];
  addAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // UI State
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Settings
      settings: defaultSettings,
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
        
        // Apply primary color to CSS variable
        if (newSettings.primaryColor) {
          const color = newSettings.primaryColor;
          const hsl = hexToHSL(color);
          document.documentElement.style.setProperty('--primary', hsl);
          document.documentElement.style.setProperty('--accent', hsl);
          document.documentElement.style.setProperty('--ring', hsl);
        }
        
        // Apply theme
        if (newSettings.theme) {
          if (newSettings.theme === 'light') {
            document.documentElement.classList.add('light');
          } else {
            document.documentElement.classList.remove('light');
          }
        }
      },
      
      // Subjects
      subjects: mockSubjects,
      addSubject: (subject) => set((state) => ({
        subjects: [...state.subjects, { ...subject, id: generateId() }],
      })),
      updateSubject: (id, updates) => set((state) => ({
        subjects: state.subjects.map((s) => 
          s.id === id ? { ...s, ...updates } : s
        ),
      })),
      deleteSubject: (id) => set((state) => ({
        subjects: state.subjects.filter((s) => s.id !== id),
      })),
      getSubjectById: (id) => get().subjects.find((s) => s.id === id),
      
      // Teachers
      teachers: mockTeachers,
      addTeacher: (teacher) => set((state) => ({
        teachers: [...state.teachers, { ...teacher, id: generateId() }],
      })),
      updateTeacher: (id, updates) => set((state) => ({
        teachers: state.teachers.map((t) => 
          t.id === id ? { ...t, ...updates } : t
        ),
      })),
      deleteTeacher: (id) => set((state) => ({
        teachers: state.teachers.filter((t) => t.id !== id),
      })),
      
      // Timetable Classes
      classes: mockClasses,
      addClass: (classItem) => set((state) => ({
        classes: [...state.classes, { ...classItem, id: generateId() }],
      })),
      updateClass: (id, updates) => set((state) => ({
        classes: state.classes.map((c) => 
          c.id === id ? { ...c, ...updates } : c
        ),
      })),
      deleteClass: (id) => set((state) => ({
        classes: state.classes.filter((c) => c.id !== id),
      })),
      getClassesByDay: (day) => get().classes.filter((c) => c.day === day),
      
      // Tasks
      tasks: mockTasks,
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, { ...task, id: generateId() }],
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) => 
          t.id === id ? { ...t, ...updates } : t
        ),
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),
      toggleTaskComplete: (id) => set((state) => ({
        tasks: state.tasks.map((t) => 
          t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
        ),
      })),
      
      // Terms
      terms: mockTerms,
      addTerm: (term) => set((state) => ({
        terms: [...state.terms, { ...term, id: generateId() }],
      })),
      
      // Grades
      grades: mockGrades,
      addGrade: (grade) => set((state) => ({
        grades: [...state.grades, { ...grade, id: generateId() }],
      })),
      updateGrade: (id, updates) => set((state) => ({
        grades: state.grades.map((g) => 
          g.id === id ? { ...g, ...updates } : g
        ),
      })),
      deleteGrade: (id) => set((state) => ({
        grades: state.grades.filter((g) => g.id !== id),
      })),
      
      // Attendance
      attendance: [],
      addAttendance: (record) => set((state) => ({
        attendance: [...state.attendance, { ...record, id: generateId() }],
      })),
    }),
    {
      name: 'campus-duty-storage',
      partialize: (state) => ({
        settings: state.settings,
        subjects: state.subjects,
        teachers: state.teachers,
        classes: state.classes,
        tasks: state.tasks,
        terms: state.terms,
        grades: state.grades,
        attendance: state.attendance,
      }),
    }
  )
);

// Helper function to convert hex to HSL string
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Initialize theme on load
export const initializeTheme = () => {
  const state = useAppStore.getState();
  const { settings } = state;
  
  // Apply primary color
  if (settings.primaryColor) {
    const hsl = hexToHSL(settings.primaryColor);
    document.documentElement.style.setProperty('--primary', hsl);
    document.documentElement.style.setProperty('--accent', hsl);
    document.documentElement.style.setProperty('--ring', hsl);
  }
  
  // Apply theme
  if (settings.theme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
};
