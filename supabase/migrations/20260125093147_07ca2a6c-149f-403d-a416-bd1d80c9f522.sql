-- Add UPDATE policy for shared_links table
CREATE POLICY "Users can update own shared links"
ON public.shared_links
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);