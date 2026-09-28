-- Add notes column to classes table for additional class information
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS notes text;

-- Create junction table for class-teacher relationships (many-to-many)
CREATE TABLE IF NOT EXISTS public.class_teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, teacher_id)
);

-- Enable RLS on class_teachers
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for class_teachers
CREATE POLICY "Users can view own class_teachers" 
ON public.class_teachers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own class_teachers" 
ON public.class_teachers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own class_teachers" 
ON public.class_teachers 
FOR DELETE 
USING (auth.uid() = user_id);