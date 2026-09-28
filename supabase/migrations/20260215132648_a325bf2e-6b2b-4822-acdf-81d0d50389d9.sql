
-- Fix: restore 6-digit numeric share code generation
CREATE OR REPLACE FUNCTION public.generate_unique_share_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Backfill existing rows with invalid codes
DO $$
DECLARE
  r record;
  new_code text;
  code_exists boolean;
BEGIN
  FOR r IN SELECT id FROM public.shared_links WHERE share_code IS NULL OR length(share_code) != 6 OR share_code !~ '^[0-9]+$' LOOP
    LOOP
      new_code := lpad(floor(random() * 1000000)::text, 6, '0');
      SELECT EXISTS(SELECT 1 FROM public.shared_links WHERE share_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE public.shared_links SET share_code = new_code WHERE id = r.id;
  END LOOP;
END;
$$;
