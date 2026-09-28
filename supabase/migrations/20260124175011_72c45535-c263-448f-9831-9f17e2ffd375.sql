-- Create subject_teachers junction table for many-to-many relationship
CREATE TABLE public.subject_teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subject_id, teacher_id)
);

-- Enable Row Level Security
ALTER TABLE public.subject_teachers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own subject_teachers"
ON public.subject_teachers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subject_teachers"
ON public.subject_teachers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subject_teachers"
ON public.subject_teachers
FOR DELETE
USING (auth.uid() = user_id);