
-- Add moderation columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_shadow_banned boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_soft_deleted boolean NOT NULL DEFAULT false;

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System can insert audit logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create user_blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  blocked_by uuid NOT NULL,
  reason text,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view blocks" ON public.user_blocks FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can insert blocks" ON public.user_blocks FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can update blocks" ON public.user_blocks FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT 'false'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Super admins can update settings" ON public.system_settings FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

INSERT INTO public.system_settings (key, value) VALUES ('maintenance_mode', 'false'::jsonb) ON CONFLICT (key) DO NOTHING;

-- log_admin_action
CREATE OR REPLACE FUNCTION public.log_admin_action(_action text, _target_type text, _target_id text DEFAULT NULL, _details jsonb DEFAULT '{}'::jsonb, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  INSERT INTO public.admin_audit_logs (admin_id, action, target_type, target_id, details, reason)
  VALUES (auth.uid(), _action, _target_type, _target_id, _details, _reason);
END;
$$;

-- is_user_blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE user_id = _user_id AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- block_user
CREATE OR REPLACE FUNCTION public.block_user(_target_user_id uuid, _reason text DEFAULT NULL, _expires_at timestamptz DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  UPDATE public.user_blocks SET is_active = false WHERE user_id = _target_user_id AND is_active = true;
  INSERT INTO public.user_blocks (user_id, blocked_by, reason, expires_at)
  VALUES (_target_user_id, auth.uid(), _reason, _expires_at);
  PERFORM public.log_admin_action('block_user', 'user', _target_user_id::text, jsonb_build_object('expires_at', _expires_at), _reason);
END;
$$;

-- unblock_user
CREATE OR REPLACE FUNCTION public.unblock_user(_target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  UPDATE public.user_blocks SET is_active = false WHERE user_id = _target_user_id AND is_active = true;
  PERFORM public.log_admin_action('unblock_user', 'user', _target_user_id::text);
END;
$$;

-- shadow_ban_user
CREATE OR REPLACE FUNCTION public.shadow_ban_user(_target_user_id uuid, _ban boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  UPDATE public.profiles SET is_shadow_banned = _ban WHERE user_id = _target_user_id;
  PERFORM public.log_admin_action(CASE WHEN _ban THEN 'shadow_ban' ELSE 'remove_shadow_ban' END, 'user', _target_user_id::text);
END;
$$;

-- soft_delete_user
CREATE OR REPLACE FUNCTION public.soft_delete_user(_target_user_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  UPDATE public.profiles SET is_soft_deleted = true WHERE user_id = _target_user_id;
  PERFORM public.log_admin_action('soft_delete_user', 'user', _target_user_id::text, '{}'::jsonb, _reason);
END;
$$;

-- hard_delete_user (super_admin only)
CREATE OR REPLACE FUNCTION public.hard_delete_user(_target_user_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Super admin access required';
  END IF;
  PERFORM public.log_admin_action('hard_delete_user', 'user', _target_user_id::text, '{}'::jsonb, _reason);
  DELETE FROM public.tasks WHERE user_id = _target_user_id;
  DELETE FROM public.attendance WHERE user_id = _target_user_id;
  DELETE FROM public.grades WHERE user_id = _target_user_id;
  DELETE FROM public.classes WHERE user_id = _target_user_id;
  DELETE FROM public.subjects WHERE user_id = _target_user_id;
  DELETE FROM public.teachers WHERE user_id = _target_user_id;
  DELETE FROM public.notes WHERE user_id = _target_user_id;
  DELETE FROM public.goals WHERE user_id = _target_user_id;
  DELETE FROM public.achievements WHERE user_id = _target_user_id;
  DELETE FROM public.post_reactions WHERE user_id = _target_user_id;
  DELETE FROM public.post_comments WHERE user_id = _target_user_id;
  DELETE FROM public.classroom_posts WHERE user_id = _target_user_id;
  DELETE FROM public.shared_links WHERE user_id = _target_user_id;
  DELETE FROM public.user_notification_reads WHERE user_id = _target_user_id;
  DELETE FROM public.user_blocks WHERE user_id = _target_user_id;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  DELETE FROM public.profiles WHERE user_id = _target_user_id;
END;
$$;

-- toggle_maintenance_mode
CREATE OR REPLACE FUNCTION public.toggle_maintenance_mode(_enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Super admin access required';
  END IF;
  UPDATE public.system_settings SET value = to_jsonb(_enabled), updated_at = now(), updated_by = auth.uid() WHERE key = 'maintenance_mode';
  PERFORM public.log_admin_action('toggle_maintenance_mode', 'system', 'maintenance_mode', jsonb_build_object('enabled', _enabled));
END;
$$;

-- promote_to_admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(_target_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Super admin access required';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  PERFORM public.log_admin_action('promote_to_admin', 'user', _target_user_id::text);
  RETURN TRUE;
END;
$$;

-- demote_from_admin
CREATE OR REPLACE FUNCTION public.demote_from_admin(_target_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Super admin access required';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id AND role = 'admin';
  PERFORM public.log_admin_action('demote_from_admin', 'user', _target_user_id::text);
  RETURN TRUE;
END;
$$;

-- get_admin_audit_logs
CREATE OR REPLACE FUNCTION public.get_admin_audit_logs(_limit integer DEFAULT 50, _offset integer DEFAULT 0)
RETURNS TABLE(id uuid, admin_id uuid, action text, target_type text, target_id text, details jsonb, reason text, created_at timestamptz, admin_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY
  SELECT a.id, a.admin_id, a.action, a.target_type, a.target_id, a.details, a.reason, a.created_at,
    COALESCE(p.name, 'Unknown') as admin_name
  FROM public.admin_audit_logs a
  LEFT JOIN public.profiles p ON p.user_id = a.admin_id
  ORDER BY a.created_at DESC
  LIMIT _limit OFFSET _offset;
END;
$$;

-- get_user_insight
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
    'blocks', (SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json) FROM public.user_blocks b WHERE b.user_id = _target_user_id ORDER BY b.created_at DESC),
    'roles', (SELECT COALESCE(json_agg(r.role), '[]'::json) FROM public.user_roles r WHERE r.user_id = _target_user_id)
  ) INTO result;
  RETURN result;
END;
$$;

-- admin_search_posts
CREATE OR REPLACE FUNCTION public.admin_search_posts(_query text, _limit integer DEFAULT 20)
RETURNS TABLE(id uuid, user_id uuid, content text, created_at timestamptz, is_pinned boolean, faculty text, semester integer, author_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY
  SELECT cp.id, cp.user_id, cp.content, cp.created_at, cp.is_pinned, cp.faculty::text, cp.semester,
    COALESCE(p.name, 'Unknown') as author_name
  FROM public.classroom_posts cp
  LEFT JOIN public.profiles p ON p.user_id = cp.user_id
  WHERE cp.content ILIKE '%' || _query || '%'
  ORDER BY cp.created_at DESC
  LIMIT _limit;
END;
$$;

-- Update get_user_role to include super_admin priority
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles
     WHERE user_id = _user_id
     ORDER BY CASE role
       WHEN 'super_admin' THEN 0
       WHEN 'admin' THEN 1
       WHEN 'cr' THEN 2
       WHEN 'student' THEN 3
     END
     LIMIT 1),
    'student'::app_role
  )
$$;
