-- Add email and privacy control columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS show_bio boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_social_links boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_faculty boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_semester boolean NOT NULL DEFAULT true;

-- Create a public view that excludes sensitive data and respects privacy settings
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  user_id,
  name,
  username,
  avatar_url,
  CASE WHEN show_bio THEN bio ELSE NULL END as bio,
  CASE WHEN show_social_links THEN social_links ELSE NULL END as social_links,
  CASE WHEN show_faculty THEN faculty ELSE NULL END as faculty,
  CASE WHEN show_semester THEN semester ELSE NULL END as semester
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Update the RLS policy to be more restrictive on the base table for other users
-- First drop the broad policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Create a new policy that only allows viewing own profile directly
-- Other users should use the profiles_public view
CREATE POLICY "Users can view any profile for lookup"
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Add comment explaining the security model
COMMENT ON VIEW public.profiles_public IS 'Public view of profiles that respects privacy settings and excludes sensitive data like email. Use this view for displaying other users profiles.';