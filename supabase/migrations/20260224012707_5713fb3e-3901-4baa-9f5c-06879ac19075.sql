
-- 1. Add share_slug to classroom_posts
ALTER TABLE public.classroom_posts ADD COLUMN share_slug text UNIQUE;

-- 2. Function to generate 6-char alphanumeric slug
CREATE OR REPLACE FUNCTION public.generate_post_share_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_slug text;
  slug_exists boolean;
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i integer;
BEGIN
  LOOP
    new_slug := '';
    FOR i IN 1..6 LOOP
      new_slug := new_slug || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.classroom_posts WHERE share_slug = new_slug) INTO slug_exists;
    EXIT WHEN NOT slug_exists;
  END LOOP;
  NEW.share_slug := new_slug;
  RETURN NEW;
END;
$$;

-- 3. Trigger to auto-generate slug on insert
CREATE TRIGGER generate_post_slug
BEFORE INSERT ON public.classroom_posts
FOR EACH ROW
EXECUTE FUNCTION public.generate_post_share_slug();

-- 4. Backfill existing posts with slugs
DO $$
DECLARE
  r RECORD;
  new_slug text;
  slug_exists boolean;
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i integer;
BEGIN
  FOR r IN SELECT id FROM public.classroom_posts WHERE share_slug IS NULL LOOP
    LOOP
      new_slug := '';
      FOR i IN 1..6 LOOP
        new_slug := new_slug || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      SELECT EXISTS(SELECT 1 FROM public.classroom_posts WHERE share_slug = new_slug) INTO slug_exists;
      EXIT WHEN NOT slug_exists;
    END LOOP;
    UPDATE public.classroom_posts SET share_slug = new_slug WHERE id = r.id;
  END LOOP;
END;
$$;

-- 5. RPC to get public post by slug (no auth required)
CREATE OR REPLACE FUNCTION public.get_public_post_by_slug(_slug text)
RETURNS TABLE(
  id uuid, user_id uuid, content text, created_at timestamptz, is_pinned boolean,
  faculty text, semester integer, tags text[], attachments jsonb, share_slug text,
  author_name text, author_username text, author_avatar_url text, author_role app_role, author_headline text,
  reaction_count bigint, comment_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _slug IS NULL OR length(_slug) != 6 THEN
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
$$;

-- 6. Create user_activity_notifications table
CREATE TABLE public.user_activity_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  type text NOT NULL,
  reference_id text,
  content text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity notifications"
ON public.user_activity_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own activity notifications"
ON public.user_activity_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity notifications"
ON public.user_activity_notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_notifications;

-- 7. Trigger: notify on new direct message
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity_notifications (user_id, actor_id, type, reference_id, content)
  VALUES (NEW.receiver_id, NEW.sender_id, 'message', NEW.id::text, left(NEW.content, 100));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
AFTER INSERT ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_message();

-- 8. Trigger: notify on new reaction
CREATE OR REPLACE FUNCTION public.notify_on_new_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner uuid;
BEGIN
  SELECT user_id INTO post_owner FROM public.classroom_posts WHERE id = NEW.post_id;
  IF post_owner IS NOT NULL AND post_owner != NEW.user_id THEN
    INSERT INTO public.user_activity_notifications (user_id, actor_id, type, reference_id, content)
    VALUES (post_owner, NEW.user_id, 'reaction', NEW.post_id::text, NEW.emoji);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_reaction
AFTER INSERT ON public.post_reactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_reaction();

-- 9. Trigger: notify on new comment
CREATE OR REPLACE FUNCTION public.notify_on_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner uuid;
BEGIN
  SELECT user_id INTO post_owner FROM public.classroom_posts WHERE id = NEW.post_id;
  IF post_owner IS NOT NULL AND post_owner != NEW.user_id THEN
    INSERT INTO public.user_activity_notifications (user_id, actor_id, type, reference_id, content)
    VALUES (post_owner, NEW.user_id, 'comment', NEW.post_id::text, left(NEW.content, 100));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_comment
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_comment();

-- Index for fast lookups
CREATE INDEX idx_activity_notifications_user ON public.user_activity_notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_classroom_posts_share_slug ON public.classroom_posts(share_slug);
