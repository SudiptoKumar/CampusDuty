-- Add missing columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS location text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS show_headline boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_location boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_skills boolean NOT NULL DEFAULT true;
