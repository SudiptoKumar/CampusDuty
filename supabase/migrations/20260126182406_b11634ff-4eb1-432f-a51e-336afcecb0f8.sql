-- Allow all authenticated users to view any profile (for showing post/comment authors)
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);