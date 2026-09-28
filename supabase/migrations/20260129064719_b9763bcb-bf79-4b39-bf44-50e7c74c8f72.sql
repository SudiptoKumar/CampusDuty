-- Add UNIQUE constraint on profiles.user_id to prevent duplicates
-- This ensures maybeSingle() works reliably and prevents weird loading issues
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);