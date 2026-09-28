
-- Drop the function first since return type is changing
DROP FUNCTION IF EXISTS public.get_public_profile_by_username(text);

-- Recreate without location column
CREATE OR REPLACE FUNCTION public.get_public_profile_by_username(_username text)
 RETURNS TABLE(user_id uuid, name text, username text, avatar_url text, bio text, social_links jsonb, faculty faculty_type, semester integer, email text, class_id text, reg_number text, blood_group text, created_at timestamp with time zone, role app_role, headline text, skills jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _username IS NULL OR length(_username) < 3 OR length(_username) > 30 THEN
    RETURN;
  END IF;
  
  IF _username !~ '^[a-z0-9_]+$' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.name,
    p.username,
    p.avatar_url,
    CASE WHEN p.show_bio THEN p.bio ELSE NULL END,
    CASE WHEN p.show_social_links THEN p.social_links ELSE NULL END,
    CASE WHEN p.show_faculty THEN p.faculty ELSE NULL END,
    CASE WHEN p.show_semester THEN p.semester ELSE NULL END,
    CASE WHEN p.show_email THEN p.email ELSE NULL END,
    CASE WHEN p.show_class_id THEN p.class_id ELSE NULL END,
    CASE WHEN p.show_reg_number THEN p.reg_number ELSE NULL END,
    CASE WHEN p.show_blood_group THEN p.blood_group ELSE NULL END,
    p.created_at,
    public.get_user_role(p.user_id),
    CASE WHEN p.show_headline THEN p.headline ELSE NULL END,
    CASE WHEN p.show_skills THEN p.skills ELSE NULL END
  FROM public.profiles p
  WHERE p.username = _username
  LIMIT 1;
END;
$function$;
