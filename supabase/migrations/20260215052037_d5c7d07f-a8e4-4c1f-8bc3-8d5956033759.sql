-- Add attachments column to classroom_posts
ALTER TABLE public.classroom_posts
ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Create classroom-files storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('classroom-files', 'classroom-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload
CREATE POLICY "Authenticated users can upload classroom files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'classroom-files' AND auth.uid() IS NOT NULL);

-- Anyone authenticated can read
CREATE POLICY "Authenticated users can read classroom files"
ON storage.objects FOR SELECT
USING (bucket_id = 'classroom-files' AND auth.uid() IS NOT NULL);

-- Uploaders can delete their own files
CREATE POLICY "Users can delete own classroom files"
ON storage.objects FOR DELETE
USING (bucket_id = 'classroom-files' AND auth.uid()::text = (storage.foldername(name))[1]);