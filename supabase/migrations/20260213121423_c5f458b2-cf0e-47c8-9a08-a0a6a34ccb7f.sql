
-- Fix overly permissive post_reactions SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view reactions" ON public.post_reactions;

CREATE POLICY "Users can view reactions on accessible posts"
ON public.post_reactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_posts cp
    WHERE cp.id = post_id
      AND (
        (cp.is_published = true AND cp.faculty IS NOT NULL AND cp.semester IS NOT NULL AND public.can_view_classroom_post(auth.uid(), cp.faculty, cp.semester))
        OR cp.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);
