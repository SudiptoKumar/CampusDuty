-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view shared links by token" ON public.shared_links;

-- Create a security definer function to safely get a shared link by token
-- This bypasses RLS but validates the token parameter
CREATE OR REPLACE FUNCTION public.get_shared_link_by_token(_token text)
RETURNS SETOF public.shared_links
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.shared_links
  WHERE token = _token
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

-- Create a function to increment view count (also security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.increment_shared_link_view_count(_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.shared_links
  SET view_count = view_count + 1
  WHERE token = _token;
$$;