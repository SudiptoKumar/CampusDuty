-- Fix: Restrict post_comments visibility to comments on posts the user can access
-- This ensures users can only see comments on posts matching their faculty/semester

-- First, create a helper function to check if a user can view a post's comments
CREATE OR REPLACE FUNCTION public.can_view_post_comments(_post_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classroom_posts cp
    WHERE cp.id = _post_id
      AND (
        -- User can view if post is published and matches their faculty/semester
        (
          cp.is_published = true
          AND cp.faculty IS NOT NULL
          AND cp.semester IS NOT NULL
          AND public.can_view_classroom_post(auth.uid(), cp.faculty, cp.semester)
        )
        -- Or if user is the post owner
        OR cp.user_id = auth.uid()
        -- Or if user is an admin
        OR public.has_role(auth.uid(), 'admin')
      )
  )
$$;

-- Drop the existing overly-permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.post_comments;

-- Create a properly scoped SELECT policy
CREATE POLICY "Users can view comments on accessible posts"
ON public.post_comments
FOR SELECT
TO authenticated
USING (public.can_view_post_comments(post_id));