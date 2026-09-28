-- Add explicit admin checks to get_all_users_for_admin function
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
 RETURNS TABLE(user_id uuid, name text, username text, avatar_url text, role app_role)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.name,
    p.username,
    p.avatar_url,
    COALESCE(get_user_role(p.user_id), 'student'::app_role) as role
  FROM public.profiles p
  ORDER BY p.name;
END;
$$;

-- Add explicit admin checks to get_admin_user_stats function
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
 RETURNS TABLE(faculty faculty_type, semester integer, user_count bigint, role app_role)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    p.faculty,
    p.semester,
    COUNT(*)::bigint as user_count,
    COALESCE(get_user_role(p.user_id), 'student'::app_role) as role
  FROM public.profiles p
  GROUP BY p.faculty, p.semester, get_user_role(p.user_id)
  ORDER BY p.faculty, p.semester;
END;
$$;