-- Create RPC function for admin user stats by faculty/semester
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE(
  faculty faculty_type,
  semester integer,
  user_count bigint,
  role app_role
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.faculty,
    p.semester,
    COUNT(*)::bigint as user_count,
    COALESCE(get_user_role(p.user_id), 'student'::app_role) as role
  FROM public.profiles p
  GROUP BY p.faculty, p.semester, get_user_role(p.user_id)
  ORDER BY p.faculty, p.semester;
$$;

-- Change default theme from dark to light for new users
ALTER TABLE public.profiles 
ALTER COLUMN theme SET DEFAULT 'light'::text;