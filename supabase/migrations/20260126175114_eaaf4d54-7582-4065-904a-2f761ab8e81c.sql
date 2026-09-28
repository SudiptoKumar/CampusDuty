-- Add scheduled_at column to classroom_posts for scheduling
ALTER TABLE public.classroom_posts 
ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL;

-- Add is_published column to track if post is live
ALTER TABLE public.classroom_posts 
ADD COLUMN is_published boolean NOT NULL DEFAULT true;

-- Create index for efficient scheduled post queries
CREATE INDEX idx_classroom_posts_scheduled ON public.classroom_posts (scheduled_at, is_published) 
WHERE scheduled_at IS NOT NULL AND is_published = false;

-- Update the SELECT policy to only show published posts (or user's own scheduled posts)
DROP POLICY IF EXISTS "Authenticated users can view posts" ON public.classroom_posts;

CREATE POLICY "Authenticated users can view published posts" 
ON public.classroom_posts 
FOR SELECT 
USING (is_published = true OR user_id = auth.uid());

-- Create a function to publish scheduled posts (called by edge function)
CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  published_count integer;
BEGIN
  UPDATE public.classroom_posts
  SET is_published = true
  WHERE scheduled_at IS NOT NULL 
    AND scheduled_at <= now() 
    AND is_published = false;
  
  GET DIAGNOSTICS published_count = ROW_COUNT;
  RETURN published_count;
END;
$$;