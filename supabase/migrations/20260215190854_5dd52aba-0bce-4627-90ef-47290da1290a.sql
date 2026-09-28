
-- Create polls table for Quick Poll app
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  share_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll_votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, voter_id)
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Users can create polls" ON public.polls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own polls" ON public.polls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own polls" ON public.polls
  FOR DELETE USING (auth.uid() = user_id);

-- Allow viewing polls by share_code (for voting)
CREATE POLICY "Anyone authenticated can view polls by share_code" ON public.polls
  FOR SELECT USING (share_code IS NOT NULL AND auth.uid() IS NOT NULL);

-- Poll votes policies
CREATE POLICY "Users can vote" ON public.poll_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can view votes on own polls" ON public.poll_votes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.polls WHERE polls.id = poll_votes.poll_id AND polls.user_id = auth.uid())
    OR auth.uid() = voter_id
    OR EXISTS (SELECT 1 FROM public.polls WHERE polls.id = poll_votes.poll_id AND polls.share_code IS NOT NULL)
  );

-- Generate share code trigger
CREATE OR REPLACE FUNCTION public.generate_poll_share_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := lpad(floor(random() * 1000000)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.polls WHERE share_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.share_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER set_poll_share_code
  BEFORE INSERT ON public.polls
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_poll_share_code();
