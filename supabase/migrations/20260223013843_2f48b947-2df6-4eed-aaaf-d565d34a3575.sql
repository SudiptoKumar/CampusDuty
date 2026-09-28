
-- Add visibility and tags columns to classroom_posts
ALTER TABLE public.classroom_posts
  ADD COLUMN visibility TEXT NOT NULL DEFAULT 'everyone',
  ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}';

-- Drop existing SELECT policy and recreate with visibility check
DROP POLICY "Users can view matching posts" ON public.classroom_posts;

CREATE POLICY "Users can view matching posts"
ON public.classroom_posts FOR SELECT TO authenticated
USING (
  (
    (is_published = true)
    AND (faculty IS NOT NULL)
    AND (semester IS NOT NULL)
    AND can_view_classroom_post(auth.uid(), faculty, semester)
    AND (visibility = 'everyone')
  )
  OR (user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
