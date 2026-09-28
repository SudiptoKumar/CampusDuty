-- Add username format validation at database level
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format_check 
CHECK (username IS NULL OR (length(username) >= 3 AND length(username) <= 30 AND username ~ '^[a-z0-9_]+$'));