
-- Drop and recreate get_all_users_for_admin with new return type
DROP FUNCTION IF EXISTS public.get_all_users_for_admin();

CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(
  user_id uuid,
  name text,
  username text,
  avatar_url text,
  role app_role,
  faculty public.faculty_type,
  semester integer,
  is_shadow_banned boolean,
  is_soft_deleted boolean,
  is_blocked boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.name,
    p.username,
    p.avatar_url,
    COALESCE(get_user_role(p.user_id), 'student'::app_role) as role,
    p.faculty,
    p.semester,
    p.is_shadow_banned,
    p.is_soft_deleted,
    EXISTS(
      SELECT 1 FROM public.user_blocks ub
      WHERE ub.user_id = p.user_id AND ub.is_active = true
      AND (ub.expires_at IS NULL OR ub.expires_at > now())
    ) as is_blocked
  FROM public.profiles p
  ORDER BY p.name;
END;
$$;
