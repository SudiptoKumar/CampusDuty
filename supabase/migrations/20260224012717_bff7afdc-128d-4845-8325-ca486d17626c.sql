
-- Fix the overly permissive INSERT policy - only allow system triggers (service role) or the actor themselves
DROP POLICY "System can insert activity notifications" ON public.user_activity_notifications;

-- Only allow inserts via triggers (SECURITY DEFINER functions handle the actual inserts)
-- Regular users should not be able to insert directly
CREATE POLICY "No direct user inserts on activity notifications"
ON public.user_activity_notifications FOR INSERT
WITH CHECK (false);
