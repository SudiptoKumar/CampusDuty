-- Add missing UPDATE policy for subject_teachers table
-- This matches the existing pattern from class_teachers table

CREATE POLICY "Users can update own subject_teachers"
ON public.subject_teachers
FOR UPDATE
USING (auth.uid() = user_id);