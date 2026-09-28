
-- Fix 1: Drop the permissive INSERT policy that allows anyone to insert notifications
-- The SECURITY DEFINER triggers handle all legitimate inserts
DROP POLICY IF EXISTS "System can insert activity notifications" ON public.user_activity_notifications;

-- Fix 2: Improve input validation on get_public_post_by_slug
CREATE OR REPLACE FUNCTION public.get_public_post_by_slug(_slug text)
 RETURNS TABLE(id uuid, user_id uuid, content text, created_at timestamp with time zone, is_pinned boolean, faculty text, semester integer, tags text[], attachments jsonb, share_slug text, author_name text, author_username text, author_avatar_url text, author_role app_role, author_headline text, reaction_count bigint, comment_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _slug IS NULL OR length(_slug) != 6 OR _slug !~ '^[a-zA-Z0-9]{6}$' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    cp.id, cp.user_id, cp.content, cp.created_at, cp.is_pinned,
    cp.faculty::text, cp.semester, cp.tags, cp.attachments, cp.share_slug,
    p.name as author_name, p.username as author_username, p.avatar_url as author_avatar_url,
    public.get_user_role(cp.user_id) as author_role,
    CASE WHEN p.show_headline THEN p.headline ELSE NULL END as author_headline,
    (SELECT count(*) FROM public.post_reactions pr WHERE pr.post_id = cp.id) as reaction_count,
    (SELECT count(*) FROM public.post_comments pc WHERE pc.post_id = cp.id) as comment_count
  FROM public.classroom_posts cp
  JOIN public.profiles p ON p.user_id = cp.user_id
  WHERE cp.share_slug = _slug
    AND cp.is_published = true
    AND cp.visibility = 'everyone'
  LIMIT 1;
END;
$function$;
