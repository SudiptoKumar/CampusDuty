
CREATE OR REPLACE FUNCTION public.get_user_insight(_target_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.user_id = _target_user_id),
    'posts_count', (SELECT COUNT(*) FROM public.classroom_posts WHERE user_id = _target_user_id),
    'reactions_count', (SELECT COUNT(*) FROM public.post_reactions WHERE user_id = _target_user_id),
    'comments_count', (SELECT COUNT(*) FROM public.post_comments WHERE user_id = _target_user_id),
    'blocks', (SELECT COALESCE(jsonb_agg(to_jsonb(b) ORDER BY b.created_at DESC), '[]'::jsonb) FROM public.user_blocks b WHERE b.user_id = _target_user_id),
    'roles', (SELECT COALESCE(jsonb_agg(r.role), '[]'::jsonb) FROM public.user_roles r WHERE r.user_id = _target_user_id)
  ) INTO result;
  RETURN result;
END;
$$;
