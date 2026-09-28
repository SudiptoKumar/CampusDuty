-- Add privacy toggles for achievements and stats
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS show_achievements boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_stats boolean NOT NULL DEFAULT true;

-- Create RPC function to fetch public profile achievements by username
CREATE OR REPLACE FUNCTION public.get_public_profile_achievements(_username TEXT)
RETURNS TABLE (
  achievement_key TEXT,
  unlocked_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_user_id uuid;
  _show_achievements boolean;
BEGIN
  -- Validate username format
  IF _username IS NULL OR length(_username) < 3 OR length(_username) > 30 THEN
    RETURN;
  END IF;
  
  IF _username !~ '^[a-z0-9_]+$' THEN
    RETURN;
  END IF;

  -- Get user_id and privacy setting from profiles
  SELECT p.user_id, p.show_achievements 
  INTO _target_user_id, _show_achievements
  FROM public.profiles p
  WHERE p.username = _username
  LIMIT 1;
  
  -- If user not found or achievements hidden, return empty
  IF _target_user_id IS NULL OR _show_achievements = false THEN
    RETURN;
  END IF;
  
  -- Return achievements for this user
  RETURN QUERY
  SELECT a.achievement_key, a.unlocked_at
  FROM public.achievements a
  WHERE a.user_id = _target_user_id
  ORDER BY a.unlocked_at DESC
  LIMIT 20;
END;
$$;