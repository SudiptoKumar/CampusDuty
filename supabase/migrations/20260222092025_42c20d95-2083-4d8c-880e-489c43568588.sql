
-- Add seller identity columns to marketplace_listings
ALTER TABLE public.marketplace_listings
  ADD COLUMN seller_name TEXT,
  ADD COLUMN seller_username TEXT,
  ADD COLUMN seller_faculty TEXT,
  ADD COLUMN seller_semester INTEGER;

-- Add tutor identity columns to tutor_profiles
ALTER TABLE public.tutor_profiles
  ADD COLUMN tutor_name TEXT,
  ADD COLUMN tutor_username TEXT,
  ADD COLUMN tutor_faculty TEXT,
  ADD COLUMN tutor_semester INTEGER;

-- Create direct_messages table
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  context_type TEXT NOT NULL DEFAULT 'marketplace',
  context_id UUID,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS: sender or receiver can read their messages
CREATE POLICY "Users can view own messages"
ON public.direct_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS: sender must be auth.uid()
CREATE POLICY "Users can send messages"
ON public.direct_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- RLS: receiver can mark as read
CREATE POLICY "Receiver can update messages"
ON public.direct_messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- RLS: sender or receiver can delete
CREATE POLICY "Users can delete own messages"
ON public.direct_messages FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Indexes
CREATE INDEX idx_dm_receiver ON public.direct_messages(receiver_id, is_read);
CREATE INDEX idx_dm_created ON public.direct_messages(created_at);
CREATE INDEX idx_dm_sender ON public.direct_messages(sender_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Cleanup function for 7-day auto-delete
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE deleted_count INTEGER;
BEGIN
  DELETE FROM public.direct_messages WHERE created_at < now() - interval '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
