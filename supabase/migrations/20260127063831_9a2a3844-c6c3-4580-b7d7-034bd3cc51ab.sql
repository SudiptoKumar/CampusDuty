-- Remove the overly permissive policy that exposes all profiles
DROP POLICY IF EXISTS "Users can view any profile for lookup" ON public.profiles;

-- Keep only the secure "Users can view own profile" policy
-- (This already exists, so we just ensure it's in place)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Note: The profiles_public view already exists with security_invoker=on
-- and properly filters out sensitive data based on user privacy settings.
-- All public profile lookups should use this view, not the profiles table directly.