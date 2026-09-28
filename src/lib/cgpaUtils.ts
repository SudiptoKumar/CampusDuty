export interface SubjectMarks {
  id: string;
  name: string;
  final: number;
  midterm: number;
  assignment: number;
  presentation: number;
  attendance: number;
}

export function calculateTotal(s: SubjectMarks): number {
  return s.final + s.midterm + s.assignment + s.presentation + s.attendance;
}

export function calculateCGPA(total: number): number {
  if (total < 40) return 0;
  if (total >= 80) return 4.0;
  return 2.0 + Math.floor((total - 40) / 5) * 0.25;
}

const GRADE_TABLE: { min: number; grade: string }[] = [
  { min: 80, grade: 'A+' },
  { min: 75, grade: 'A' },
  { min: 70, grade: 'A-' },
  { min: 65, grade: 'B+' },
  { min: 60, grade: 'B' },
  { min: 55, grade: 'B-' },
  { min: 50, grade: 'C+' },
  { min: 45, grade: 'C' },
  { min: 40, grade: 'D' },
];

export function getLetterGrade(total: number): string {
  for (const { min, grade } of GRADE_TABLE) {
    if (total >= min) return grade;
  }
  return 'F';
}

export function calculateOverallCGPA(subjects: SubjectMarks[]): number {
  if (subjects.length === 0) return 0;
  const sum = subjects.reduce((acc, s) => acc + calculateCGPA(calculateTotal(s)), 0);
  return sum / subjects.length;
}
