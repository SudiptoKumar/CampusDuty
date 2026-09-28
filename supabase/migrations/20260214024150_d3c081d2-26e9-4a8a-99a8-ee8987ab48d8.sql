
CREATE OR REPLACE FUNCTION public.increment_shared_link_view_count(_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only increment if token exists and link is not expired
  UPDATE public.shared_links
  SET view_count = view_count + 1
  WHERE token = _token
    AND (expires_at IS NULL OR expires_at > now());
END;
$$;
