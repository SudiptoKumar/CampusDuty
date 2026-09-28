-- Create a table to store shared data links
CREATE TABLE public.shared_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  title text NOT NULL DEFAULT 'Shared Data',
  include_subjects boolean NOT NULL DEFAULT false,
  include_teachers boolean NOT NULL DEFAULT false,
  include_classes boolean NOT NULL DEFAULT false,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  view_count integer NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own links
CREATE POLICY "Users can view own shared links"
  ON public.shared_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create shared links"
  ON public.shared_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared links"
  ON public.shared_links FOR DELETE
  USING (auth.uid() = user_id);

-- Anyone can view shared links by token (for importing)
CREATE POLICY "Anyone can view shared links by token"
  ON public.shared_links FOR SELECT
  USING (true);

-- Create index for fast token lookups
CREATE INDEX idx_shared_links_token ON public.shared_links(token);