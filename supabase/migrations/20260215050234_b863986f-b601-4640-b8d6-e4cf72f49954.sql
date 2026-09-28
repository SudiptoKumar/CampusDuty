-- Add recurrence_rule column to tasks table for recurring tasks
ALTER TABLE public.tasks ADD COLUMN recurrence_rule text DEFAULT NULL;

-- Add submission_status enum and column for assignment tracking (Phase 2 item 6)
DO $$ BEGIN
  CREATE TYPE public.submission_status AS ENUM ('pending', 'submitted', 'graded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.tasks ADD COLUMN submission_status public.submission_status DEFAULT 'pending';
