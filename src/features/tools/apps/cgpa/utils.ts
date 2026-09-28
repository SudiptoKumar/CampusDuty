import type { Course, Semester, GPAScale } from './types';

const GRADE_POINTS_4: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0,
};

const GRADE_POINTS_5: Record<string, number> = {
  'A+': 5.0, 'A': 5.0, 'A-': 4.5,
  'B+': 4.0, 'B': 3.5, 'B-': 3.0,
  'C+': 2.5, 'C': 2.0, 'C-': 1.5,
  'D+': 1.0, 'D': 0.5, 'F': 0.0,
};

const GRADE_POINTS_10: Record<string, number> = {
  'A+': 10.0, 'A': 9.0, 'A-': 8.5,
  'B+': 8.0, 'B': 7.0, 'B-': 6.5,
  'C+': 6.0, 'C': 5.0, 'C-': 4.5,
  'D+': 4.0, 'D': 3.0, 'F': 0.0,
};

export const ALL_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

export function getGradeMap(scale: GPAScale): Record<string, number> {
  if (scale === 5.0) return GRADE_POINTS_5;
  if (scale === 10.0) return GRADE_POINTS_10;
  return GRADE_POINTS_4;
}

export function gradeToPoints(grade: string, scale: GPAScale): number {
  return getGradeMap(scale)[grade] ?? 0;
}

export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'hsl(142, 71%, 45%)';
  if (grade.startsWith('B')) return 'hsl(200, 70%, 50%)';
  if (grade.startsWith('C')) return 'hsl(35, 80%, 50%)';
  if (grade.startsWith('D')) return 'hsl(25, 80%, 55%)';
  return 'hsl(0, 70%, 55%)';
}

export function calculateSemesterGPA(courses: Course[], scale: GPAScale, decimals: number): number {
  const included = courses.filter(c => c.includeInCGPA);
  if (included.length === 0) return 0;
  const totalCredits = included.reduce((s, c) => s + c.creditHours, 0);
  if (totalCredits === 0) return 0;
  const totalPoints = included.reduce((s, c) => s + gradeToPoints(c.grade, scale) * c.creditHours, 0);
  return Number((totalPoints / totalCredits).toFixed(decimals));
}

export function calculateCumulativeGPA(semesters: Semester[], scale: GPAScale, decimals: number): number {
  const allCourses = semesters.flatMap(s => s.courses).filter(c => c.includeInCGPA);
  if (allCourses.length === 0) return 0;
  const totalCredits = allCourses.reduce((s, c) => s + c.creditHours, 0);
  if (totalCredits === 0) return 0;
  const totalPoints = allCourses.reduce((s, c) => s + gradeToPoints(c.grade, scale) * c.creditHours, 0);
  return Number((totalPoints / totalCredits).toFixed(decimals));
}

export function getTotalCredits(semesters: Semester[]): number {
  return semesters.flatMap(s => s.courses).filter(c => c.includeInCGPA).reduce((s, c) => s + c.creditHours, 0);
}

export function getGradeDistribution(semesters: Semester[]): Record<string, number> {
  const dist: Record<string, number> = {};
  semesters.flatMap(s => s.courses).filter(c => c.includeInCGPA).forEach(c => {
    dist[c.grade] = (dist[c.grade] || 0) + 1;
  });
  return dist;
}

export function qualityPoints(course: Course, scale: GPAScale): number {
  return Number((gradeToPoints(course.grade, scale) * course.creditHours).toFixed(2));
}
