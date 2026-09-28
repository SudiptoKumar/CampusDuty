-- =============================================
-- CAMPUS DUTY DATABASE SCHEMA
-- Complete Academic Management System
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. ENUMS
-- =============================================

CREATE TYPE public.class_type AS ENUM ('lecture', 'lab', 'seminar', 'tutorial');
CREATE TYPE public.recurrence_type AS ENUM ('weekly', 'biweekly', 'custom');
CREATE TYPE public.task_type AS ENUM ('homework', 'exam', 'assignment', 'reminder');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.grade_type AS ENUM ('written', 'oral', 'project', 'participation');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'tardy', 'left_early');
CREATE TYPE public.grading_system AS ENUM ('numeric_10', 'numeric_20', 'numeric_100', 'letter');

-- =============================================
-- 2. PROFILES TABLE (User settings & preferences)
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Student',
  avatar_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#5F6AF7',
  theme TEXT NOT NULL DEFAULT 'dark',
  start_of_week INTEGER NOT NULL DEFAULT 1 CHECK (start_of_week IN (0, 1)),
  grading_system public.grading_system NOT NULL DEFAULT 'numeric_100',
  default_class_duration INTEGER NOT NULL DEFAULT 90,
  show_weekends BOOLEAN NOT NULL DEFAULT false,
  class_alert_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 3. TEACHERS TABLE
-- =============================================

CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  office_hours TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own teachers" ON public.teachers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own teachers" ON public.teachers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own teachers" ON public.teachers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own teachers" ON public.teachers
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 4. TERMS TABLE
-- =============================================

CREATE TABLE public.terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own terms" ON public.terms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own terms" ON public.terms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own terms" ON public.terms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own terms" ON public.terms
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 5. SUBJECTS TABLE
-- =============================================

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#5F6AF7',
  room TEXT,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subjects" ON public.subjects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects" ON public.subjects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects" ON public.subjects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects" ON public.subjects
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 6. CLASSES TABLE (Timetable)
-- =============================================

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  day INTEGER NOT NULL CHECK (day >= 0 AND day <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type public.class_type NOT NULL DEFAULT 'lecture',
  room TEXT,
  recurrence public.recurrence_type NOT NULL DEFAULT 'weekly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own classes" ON public.classes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own classes" ON public.classes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own classes" ON public.classes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own classes" ON public.classes
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 7. TASKS TABLE
-- =============================================

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  due_time TIME,
  type public.task_type NOT NULL DEFAULT 'homework',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 8. GRADES TABLE
-- =============================================

CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  term_id UUID REFERENCES public.terms(id) ON DELETE CASCADE NOT NULL,
  value NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL DEFAULT 100,
  weight NUMERIC NOT NULL DEFAULT 1,
  type public.grade_type NOT NULL DEFAULT 'written',
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grades" ON public.grades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grades" ON public.grades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grades" ON public.grades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own grades" ON public.grades
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 9. ATTENDANCE TABLE
-- =============================================

CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'present',
  excused BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance" ON public.attendance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance" ON public.attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance" ON public.attendance
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance" ON public.attendance
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 10. UPDATED_AT TRIGGER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to all tables
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_teachers_updated_at BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_terms_updated_at BEFORE UPDATE ON public.terms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_grades_updated_at BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_attendance_updated_at BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 11. AUTO-CREATE PROFILE TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Student'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 12. INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_teachers_user_id ON public.teachers(user_id);
CREATE INDEX idx_terms_user_id ON public.terms(user_id);
CREATE INDEX idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX idx_classes_user_id ON public.classes(user_id);
CREATE INDEX idx_classes_subject_id ON public.classes(subject_id);
CREATE INDEX idx_classes_day ON public.classes(day);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_is_completed ON public.tasks(is_completed);
CREATE INDEX idx_grades_user_id ON public.grades(user_id);
CREATE INDEX idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX idx_grades_term_id ON public.grades(term_id);
CREATE INDEX idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);