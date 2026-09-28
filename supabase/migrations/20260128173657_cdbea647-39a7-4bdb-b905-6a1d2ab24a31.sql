-- Add new profile columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS class_id TEXT,
ADD COLUMN IF NOT EXISTS reg_number TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS show_email BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS show_class_id BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_reg_number BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_blood_group BOOLEAN NOT NULL DEFAULT true;

-- Add unique constraint on username (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (username) WHERE username IS NOT NULL;

-- Drop and recreate the profiles_public view with new columns
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public 
WITH (security_invoker=on) AS
SELECT
  user_id,
  name,
  username,
  avatar_url,
  CASE WHEN show_bio THEN bio ELSE NULL END AS bio,
  CASE WHEN show_social_links THEN social_links ELSE NULL END AS social_links,
  CASE WHEN show_faculty THEN faculty ELSE NULL END AS faculty,
  CASE WHEN show_semester THEN semester ELSE NULL END AS semester,
  CASE WHEN show_email THEN email ELSE NULL END AS email,
  CASE WHEN show_class_id THEN class_id ELSE NULL END AS class_id,
  CASE WHEN show_reg_number THEN reg_number ELSE NULL END AS reg_number,
  CASE WHEN show_blood_group THEN blood_group ELSE NULL END AS blood_group,
  created_at
FROM public.profiles;

-- Create RPC function for public profile lookup by username (no auth required)
CREATE OR REPLACE FUNCTION public.get_public_profile_by_username(_username TEXT)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  social_links JSONB,
  faculty public.faculty_type,
  semester INTEGER,
  email TEXT,
  class_id TEXT,
  reg_number TEXT,
  blood_group TEXT,
  created_at TIMESTAMPTZ,
  role public.app_role
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate username format (3-30 chars, lowercase alphanumeric + underscore)
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
    public.get_user_role(p.user_id)
  FROM public.profiles p
  WHERE p.username = _username
  LIMIT 1;
END;
$$;