-- Create classroom_posts table for CR announcements
CREATE TABLE public.classroom_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_reactions table for emoji reactions
CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.classroom_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL CHECK (emoji IN ('🔥', '👍', '🤡', '❤️', '😢')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- Create post_comments table for threaded replies
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.classroom_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.classroom_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for classroom_posts
-- Everyone can view posts (authenticated users)
CREATE POLICY "Authenticated users can view posts"
ON public.classroom_posts FOR SELECT
TO authenticated
USING (true);

-- Only CR/Admin can create posts
CREATE POLICY "CRs and Admins can create posts"
ON public.classroom_posts FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'cr') OR public.has_role(auth.uid(), 'admin')
);

-- Only post owner or admin can update
CREATE POLICY "Post owners and admins can update"
ON public.classroom_posts FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

-- Only post owner or admin can delete
CREATE POLICY "Post owners and admins can delete"
ON public.classroom_posts FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

-- RLS policies for post_reactions
-- Everyone can view reactions
CREATE POLICY "Authenticated users can view reactions"
ON public.post_reactions FOR SELECT
TO authenticated
USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add reactions"
ON public.post_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
ON public.post_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS policies for post_comments
-- Everyone can view comments
CREATE POLICY "Authenticated users can view comments"
ON public.post_comments FOR SELECT
TO authenticated
USING (true);

-- Users can add comments
CREATE POLICY "Users can add comments"
ON public.post_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update own comments
CREATE POLICY "Users can update own comments"
ON public.post_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete own comments
CREATE POLICY "Users can delete own comments"
ON public.post_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- Add updated_at triggers
CREATE TRIGGER update_classroom_posts_updated_at
  BEFORE UPDATE ON public.classroom_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();