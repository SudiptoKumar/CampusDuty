// Campus Duty - Core TypeScript Types

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export type RecurrenceType = 'weekly' | 'biweekly' | 'custom';
export type TaskType = 'homework' | 'exam' | 'assignment' | 'reminder';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ClassType = 'lecture' | 'lab' | 'seminar' | 'tutorial';
export type GradeType = 'written' | 'oral' | 'project' | 'participation';
export type AttendanceStatus = 'present' | 'absent' | 'tardy' | 'left_early';
export type GradingSystem = 'numeric_10' | 'numeric_20' | 'numeric_100' | 'letter';

// Subject - Core entity for color-coding
export interface Subject {
  id: string;
  name: string;
  color: string; // Hex code
  room?: string;
  teacherId?: string;
  icon?: string;
}

// Teacher
export interface Teacher {
  id: string;
  name: string;
  surname: string;
  email?: string;
  phone?: string;
  address?: string;
  officeHours?: string;
  website?: string;
}

// Timetable Class
export interface TimetableClass {
  id: string;
  subjectId: string;
  day: DayOfWeek;
  startTime: string; // "14:30"
  endTime: string; // "16:00"
  type: ClassType;
  room?: string;
  recurrence: RecurrenceType;
}

// Task / Assessment
export interface Task {
  id: string;
  title: string;
  subjectId?: string;
  dueDate: string; // ISO String
  dueTime?: string; // "14:00"
  isCompleted: boolean;
  type: TaskType;
  priority: TaskPriority;
  notes?: string;
  subtasks: Subtask[];
  attachments: string[];
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

// Grade
export interface Grade {
  id: string;
  subjectId: string;
  termId: string;
  value: number;
  maxScore: number;
  weight: number;
  type: GradeType;
  date: string;
  notes?: string;
}

// Term
export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

// Attendance Record
export interface AttendanceRecord {
  id: string;
  subjectId: string;
  classId?: string;
  date: string;
  status: AttendanceStatus;
  excused: boolean;
  notes?: string;
}

// App Settings
export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  primaryColor: string; // Hex
  startOfWeek: 0 | 1; // Sun or Mon
  gradingSystem: GradingSystem;
  defaultClassDuration: number; // minutes
  showWeekends: boolean;
  classAlertMinutes: number;
  userName: string;
  ttsEnabled: boolean;
}

// Navigation Item
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

// Color option for picker
export interface ColorOption {
  name: string;
  value: string;
}

// Time slot for timetable
export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}
