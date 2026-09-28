-- Add faculty enum type
CREATE TYPE public.faculty_type AS ENUM (
  'Agriculture',
  'CSE',
  'FBA',
  'Fisheries',
  'ESDM',
  'NFS',
  'LLA'
);

-- Add faculty and semester to profiles
ALTER TABLE public.profiles
ADD COLUMN faculty public.faculty_type NULL,
ADD COLUMN semester integer NULL CHECK (semester >= 1 AND semester <= 8);

-- Add faculty and semester to classroom_posts (for targeting)
ALTER TABLE public.classroom_posts
ADD COLUMN faculty public.faculty_type NULL,
ADD COLUMN semester integer NULL CHECK (semester >= 1 AND semester <= 8);

-- Drop existing RLS policies on classroom_posts
DROP POLICY IF EXISTS "Authenticated users can view published posts" ON public.classroom_posts;
DROP POLICY IF EXISTS "CRs and Admins can create posts" ON public.classroom_posts;
DROP POLICY IF EXISTS "Post owners and admins can delete" ON public.classroom_posts;
DROP POLICY IF EXISTS "Post owners and admins can update" ON public.classroom_posts;

-- Create helper function to check if user can view a post
CREATE OR REPLACE FUNCTION public.can_view_classroom_post(_user_id uuid, _post_faculty faculty_type, _post_semester integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND p.faculty IS NOT NULL
      AND p.semester IS NOT NULL
      AND p.faculty = _post_faculty
      AND p.semester = _post_semester
  )
  OR public.has_role(_user_id, 'admin')
$$;

-- Create helper function to get user's faculty
CREATE OR REPLACE FUNCTION public.get_user_faculty(_user_id uuid)
RETURNS faculty_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT faculty FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Create helper function to get user's semester
CREATE OR REPLACE FUNCTION public.get_user_semester(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT semester FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- New RLS policy: Users can view posts if faculty+semester match OR they own the post OR admin
CREATE POLICY "Users can view matching posts"
ON public.classroom_posts
FOR SELECT
USING (
  (is_published = true AND faculty IS NOT NULL AND semester IS NOT NULL AND public.can_view_classroom_post(auth.uid(), faculty, semester))
  OR (user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- CRs can create posts only for their own faculty+semester
-- Admins can create posts for any faculty+semester
CREATE POLICY "CRs and Admins can create posts"
ON public.classroom_posts
FOR INSERT
WITH CHECK (
  (
    public.has_role(auth.uid(), 'cr') 
    AND faculty = public.get_user_faculty(auth.uid())
    AND semester = public.get_user_semester(auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Post owners and admins can update
CREATE POLICY "Post owners and admins can update"
ON public.classroom_posts
FOR UPDATE
USING (
  (user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

-- Post owners and admins can delete
CREATE POLICY "Post owners and admins can delete"
ON public.classroom_posts
FOR DELETE
USING (
  (user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);