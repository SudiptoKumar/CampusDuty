
-- 1. Add share_code column to shared_links
ALTER TABLE public.shared_links ADD COLUMN share_code text UNIQUE;

-- 2. Function to generate unique 6-digit code
CREATE OR REPLACE FUNCTION public.generate_unique_share_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := lpad(floor(random() * 1000000)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.shared_links WHERE share_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.share_code := new_code;
  RETURN NEW;
END;
$$;

-- 3. Trigger to auto-generate code on insert
CREATE TRIGGER set_share_code_on_insert
BEFORE INSERT ON public.shared_links
FOR EACH ROW
WHEN (NEW.share_code IS NULL)
EXECUTE FUNCTION public.generate_unique_share_code();

-- 4. Backfill existing rows with unique codes
DO $$
DECLARE
  r RECORD;
  new_code text;
  code_exists boolean;
BEGIN
  FOR r IN SELECT id FROM public.shared_links WHERE share_code IS NULL LOOP
    LOOP
      new_code := lpad(floor(random() * 1000000)::text, 6, '0');
      SELECT EXISTS(SELECT 1 FROM public.shared_links WHERE share_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE public.shared_links SET share_code = new_code WHERE id = r.id;
  END LOOP;
END;
$$;

-- 5. RPC to look up shared link by code
CREATE OR REPLACE FUNCTION public.get_shared_link_by_code(_code text)
RETURNS SETOF shared_links
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT *
  FROM public.shared_links
  WHERE share_code = _code
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

-- 6. Create import_history table
CREATE TABLE public.import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shared_link_id uuid NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, shared_link_id)
);

ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import history"
ON public.import_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import history"
ON public.import_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);
