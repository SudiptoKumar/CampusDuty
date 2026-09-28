-- Provide a safe way to fetch public profile fields for Classroom authors
-- This avoids reopening SELECT access to the private profiles table.

CREATE OR REPLACE FUNCTION public.get_public_profiles(_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  name text,
  username text,
  avatar_url text,
  bio text,
  social_links jsonb,
  faculty public.faculty_type,
  semester integer,
  role public.app_role
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _user_ids IS NULL OR array_length(_user_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Prevent bulk scraping via a single call
  IF array_length(_user_ids, 1) > 50 THEN
    RAISE EXCEPTION 'Too many user ids';
  END IF;

  RETURN QUERY
  WITH requested AS (
    SELECT DISTINCT unnest(_user_ids) AS user_id
  ),
  allowed AS (
    SELECT r.user_id
    FROM requested r
    WHERE r.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1
        FROM public.classroom_posts cp
        WHERE cp.user_id = r.user_id
          AND (
            (
              cp.is_published = TRUE
              AND cp.faculty IS NOT NULL
              AND cp.semester IS NOT NULL
              AND public.can_view_classroom_post(auth.uid(), cp.faculty, cp.semester)
            )
            OR cp.user_id = auth.uid()
            OR public.has_role(auth.uid(), 'admin'::public.app_role)
          )
      )
      OR EXISTS (
        SELECT 1
        FROM public.post_comments pc
        JOIN public.classroom_posts cp ON cp.id = pc.post_id
        WHERE pc.user_id = r.user_id
          AND (
            (
              cp.is_published = TRUE
              AND cp.faculty IS NOT NULL
              AND cp.semester IS NOT NULL
              AND public.can_view_classroom_post(auth.uid(), cp.faculty, cp.semester)
            )
            OR cp.user_id = auth.uid()
            OR public.has_role(auth.uid(), 'admin'::public.app_role)
          )
      )
  )
  SELECT
    p.user_id,
    p.name,
    p.username,
    p.avatar_url,
    CASE WHEN p.show_bio THEN p.bio ELSE NULL END AS bio,
    CASE WHEN p.show_social_links THEN p.social_links ELSE NULL END AS social_links,
    CASE WHEN p.show_faculty THEN p.faculty ELSE NULL END AS faculty,
    CASE WHEN p.show_semester THEN p.semester ELSE NULL END AS semester,
    public.get_user_role(p.user_id) AS role
  FROM public.profiles p
  JOIN allowed a ON a.user_id = p.user_id;
END;
$$;

-- Only logged-in users may call this function
REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;
