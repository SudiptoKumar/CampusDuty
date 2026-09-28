DROP POLICY "CRs and Admins can create posts" ON public.classroom_posts;

CREATE POLICY "Authenticated users can create posts"
ON public.classroom_posts FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  AND (
    (faculty = get_user_faculty(auth.uid()) AND semester = get_user_semester(auth.uid()))
    OR has_role(auth.uid(), 'admin')
  )
);