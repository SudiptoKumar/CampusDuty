-- Create app notifications table for system updates, feature announcements
CREATE TABLE public.app_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'update', -- 'update', 'feature', 'announcement', 'maintenance'
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

-- Everyone can view active notifications (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view active notifications"
ON public.app_notifications
FOR SELECT
TO authenticated
USING (is_active = true);

-- Only admins can create notifications
CREATE POLICY "Admins can create notifications"
ON public.app_notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update notifications
CREATE POLICY "Admins can update notifications"
ON public.app_notifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.app_notifications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create table to track read notifications per user
CREATE TABLE public.user_notification_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL REFERENCES public.app_notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- Enable RLS
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- Users can view their own read status
CREATE POLICY "Users can view own notification reads"
ON public.user_notification_reads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can mark notifications as read
CREATE POLICY "Users can mark notifications as read"
ON public.user_notification_reads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Function to promote user to CR (admin only)
CREATE OR REPLACE FUNCTION public.promote_to_cr(_target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;
  
  -- Insert CR role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, 'cr')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Function to demote user from CR (admin only)
CREATE OR REPLACE FUNCTION public.demote_from_cr(_target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can demote users';
  END IF;
  
  -- Remove CR role
  DELETE FROM public.user_roles 
  WHERE user_id = _target_user_id AND role = 'cr';
  
  RETURN TRUE;
END;
$$;

-- Function to get public profile info (for admin panel) - security definer to bypass RLS
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  role app_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.name,
    p.username,
    p.avatar_url,
    COALESCE(get_user_role(p.user_id), 'student'::app_role) as role
  FROM public.profiles p
  ORDER BY p.name;
$$;