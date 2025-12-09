-- Storage policies for Supabase Storage buckets
-- Execute this after creating the buckets in Supabase Dashboard

-- Bucket: attachments
-- Create bucket if it doesn't exist (run in Supabase Dashboard first)
-- Storage > New bucket > Name: attachments > Public: true

-- Policy: Users can upload attachments for their events
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own attachments
CREATE POLICY "Users can view their attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete their attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Bucket: secure_files (Premium)
-- Create bucket if it doesn't exist (run in Supabase Dashboard first)
-- Storage > New bucket > Name: secure_files > Public: false

-- Policy: Premium users can upload secure files
CREATE POLICY "Premium users can upload secure files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'secure_files' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  EXISTS (
    SELECT 1 FROM public.premium_subscriptions
    WHERE user_id = auth.uid()
      AND is_active = true
      AND (end_at IS NULL OR end_at > now())
  )
);

-- Policy: Premium users can view their secure files
CREATE POLICY "Premium users can view their secure files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'secure_files' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  EXISTS (
    SELECT 1 FROM public.premium_subscriptions
    WHERE user_id = auth.uid()
      AND is_active = true
      AND (end_at IS NULL OR end_at > now())
  )
);

-- Policy: Premium users can delete their secure files
CREATE POLICY "Premium users can delete their secure files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'secure_files' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  EXISTS (
    SELECT 1 FROM public.premium_subscriptions
    WHERE user_id = auth.uid()
      AND is_active = true
      AND (end_at IS NULL OR end_at > now())
  )
);

