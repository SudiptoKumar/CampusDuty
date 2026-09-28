-- Drop the profiles_public view as it exposes sensitive data without proper security
-- The get_public_profiles() and get_public_profile_by_username() RPC functions
-- already provide secure access to profile data with proper authentication and privacy controls

DROP VIEW IF EXISTS public.profiles_public;