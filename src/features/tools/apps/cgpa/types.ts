export interface Course {
  id: string;
  name: string;
  creditHours: number;
  grade: string;
  includeInCGPA: boolean;
  isRetake: boolean;
}

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
}

export type GPAScale = 4.0 | 5.0 | 10.0;

export interface CGPASettings {
  scale: GPAScale;
  passMark: number;
  roundingDecimals: number;
}

export type ViewTab = 'dashboard' | 'semesters' | 'predict' | 'analytics';
