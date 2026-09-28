-- Add missing UPDATE policy for class_teachers table
CREATE POLICY "Users can update own class_teachers"
ON public.class_teachers
FOR UPDATE
USING (auth.uid() = user_id);