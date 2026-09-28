import type { Subject, TimetableClass, Task, Teacher, Term, Grade } from '@/types';

// Subject Colors
export const SUBJECT_COLORS = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Rose', value: '#F43F5E' },
];

// Primary Colors for Settings
export const PRIMARY_COLORS = [
  { name: 'Blue', value: '#5F6AF7' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
];

// Mock Subjects
export const mockSubjects: Subject[] = [
  {
    id: 'sub-1',
    name: 'Development Economics',
    color: '#5F6AF7',
    room: 'Room 301',
    teacherId: 'teacher-1',
  },
  {
    id: 'sub-2',
    name: 'Consumer Behavior',
    color: '#F97316',
    room: 'Room 205',
    teacherId: 'teacher-2',
  },
  {
    id: 'sub-3',
    name: 'Statistics',
    color: '#22C55E',
    room: 'Room 102',
    teacherId: 'teacher-3',
  },
  {
    id: 'sub-4',
    name: 'Marketing Research',
    color: '#EC4899',
    room: 'Room 401',
    teacherId: 'teacher-2',
  },
  {
    id: 'sub-5',
    name: 'Financial Accounting',
    color: '#14B8A6',
    room: 'Room 108',
    teacherId: 'teacher-4',
  },
];

// Mock Teachers
export const mockTeachers: Teacher[] = [
  {
    id: 'teacher-1',
    name: 'Dr. Sarah',
    surname: 'Johnson',
    email: 'sarah.johnson@university.edu',
    phone: '+1 555-0101',
    officeHours: 'Mon/Wed 2-4 PM',
  },
  {
    id: 'teacher-2',
    name: 'Prof. Michael',
    surname: 'Chen',
    email: 'michael.chen@university.edu',
    phone: '+1 555-0102',
    officeHours: 'Tue/Thu 10 AM - 12 PM',
  },
  {
    id: 'teacher-3',
    name: 'Dr. Emily',
    surname: 'Rodriguez',
    email: 'emily.rodriguez@university.edu',
    phone: '+1 555-0103',
    officeHours: 'Fri 1-3 PM',
  },
  {
    id: 'teacher-4',
    name: 'Prof. David',
    surname: 'Williams',
    email: 'david.williams@university.edu',
    phone: '+1 555-0104',
    officeHours: 'Mon/Thu 3-5 PM',
  },
];

// Mock Timetable Classes
export const mockClasses: TimetableClass[] = [
  {
    id: 'class-1',
    subjectId: 'sub-1',
    day: 1, // Monday
    startTime: '09:00',
    endTime: '10:30',
    type: 'lecture',
    room: 'Room 301',
    recurrence: 'weekly',
  },
  {
    id: 'class-2',
    subjectId: 'sub-2',
    day: 1, // Monday
    startTime: '11:00',
    endTime: '12:30',
    type: 'lecture',
    room: 'Room 205',
    recurrence: 'weekly',
  },
  {
    id: 'class-3',
    subjectId: 'sub-3',
    day: 2, // Tuesday
    startTime: '10:00',
    endTime: '11:30',
    type: 'lecture',
    room: 'Room 102',
    recurrence: 'weekly',
  },
  {
    id: 'class-4',
    subjectId: 'sub-3',
    day: 2, // Tuesday
    startTime: '14:00',
    endTime: '16:00',
    type: 'lab',
    room: 'Lab A',
    recurrence: 'weekly',
  },
  {
    id: 'class-5',
    subjectId: 'sub-4',
    day: 3, // Wednesday
    startTime: '09:00',
    endTime: '10:30',
    type: 'lecture',
    room: 'Room 401',
    recurrence: 'weekly',
  },
  {
    id: 'class-6',
    subjectId: 'sub-1',
    day: 3, // Wednesday
    startTime: '14:00',
    endTime: '15:30',
    type: 'seminar',
    room: 'Room 301',
    recurrence: 'weekly',
  },
  {
    id: 'class-7',
    subjectId: 'sub-5',
    day: 4, // Thursday
    startTime: '11:00',
    endTime: '12:30',
    type: 'lecture',
    room: 'Room 108',
    recurrence: 'weekly',
  },
  {
    id: 'class-8',
    subjectId: 'sub-2',
    day: 5, // Friday
    startTime: '10:00',
    endTime: '11:30',
    type: 'lecture',
    room: 'Room 205',
    recurrence: 'weekly',
  },
];

// Mock Terms
export const mockTerms: Term[] = [
  {
    id: 'term-1',
    name: '1st Term',
    startDate: '2024-01-15',
    endDate: '2024-05-30',
  },
  {
    id: 'term-2',
    name: '2nd Term',
    startDate: '2024-09-01',
    endDate: '2024-12-20',
  },
];

// Get today and upcoming dates for tasks
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);
const inTwoWeeks = new Date(today);
inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Chapter 5 Reading',
    subjectId: 'sub-1',
    dueDate: tomorrow.toISOString().split('T')[0],
    isCompleted: false,
    type: 'homework',
    priority: 'medium',
    notes: 'Focus on economic development theories',
    subtasks: [
      { id: 'st-1', text: 'Read pages 120-145', completed: true },
      { id: 'st-2', text: 'Take notes', completed: false },
    ],
    attachments: [],
  },
  {
    id: 'task-2',
    title: 'Statistics Midterm',
    subjectId: 'sub-3',
    dueDate: nextWeek.toISOString().split('T')[0],
    dueTime: '10:00',
    isCompleted: false,
    type: 'exam',
    priority: 'high',
    notes: 'Covers chapters 1-6',
    subtasks: [],
    attachments: [],
  },
  {
    id: 'task-3',
    title: 'Marketing Case Study',
    subjectId: 'sub-4',
    dueDate: inTwoWeeks.toISOString().split('T')[0],
    isCompleted: false,
    type: 'assignment',
    priority: 'medium',
    notes: 'Group project - team of 4',
    subtasks: [
      { id: 'st-3', text: 'Form team', completed: true },
      { id: 'st-4', text: 'Research phase', completed: false },
      { id: 'st-5', text: 'Write report', completed: false },
    ],
    attachments: [],
  },
  {
    id: 'task-4',
    title: 'Consumer Survey Analysis',
    subjectId: 'sub-2',
    dueDate: tomorrow.toISOString().split('T')[0],
    isCompleted: true,
    type: 'homework',
    priority: 'low',
    subtasks: [],
    attachments: [],
  },
];

// Mock Grades
export const mockGrades: Grade[] = [
  {
    id: 'grade-1',
    subjectId: 'sub-1',
    termId: 'term-1',
    value: 85,
    maxScore: 100,
    weight: 30,
    type: 'written',
    date: '2024-02-15',
  },
  {
    id: 'grade-2',
    subjectId: 'sub-2',
    termId: 'term-1',
    value: 92,
    maxScore: 100,
    weight: 25,
    type: 'project',
    date: '2024-02-20',
  },
  {
    id: 'grade-3',
    subjectId: 'sub-3',
    termId: 'term-1',
    value: 78,
    maxScore: 100,
    weight: 40,
    type: 'written',
    date: '2024-03-01',
  },
  {
    id: 'grade-4',
    subjectId: 'sub-3',
    termId: 'term-1',
    value: 88,
    maxScore: 100,
    weight: 20,
    type: 'participation',
    date: '2024-03-10',
  },
];

// Helper to generate unique IDs
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// Day names
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Time slots for timetable (8 AM to 8 PM)
export const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => ({
  hour: 8 + i,
  minute: 0,
  label: `${(8 + i).toString().padStart(2, '0')}:00`,
}));
