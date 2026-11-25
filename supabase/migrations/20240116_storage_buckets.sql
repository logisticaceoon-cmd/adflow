-- Create storage buckets for campaign creatives, brand assets, and general creatives
-- These must exist before uploads work (otherwise Supabase returns 400)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('campaign-creatives', 'campaign-creatives', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']),
  ('brand-assets', 'brand-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']),
  ('creatives', 'creatives', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies: users can upload/read/delete their own files (path starts with their user id)

-- campaign-creatives
CREATE POLICY "Users upload own campaign creatives"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'campaign-creatives' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own campaign creatives"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-creatives' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own campaign creatives"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'campaign-creatives' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read campaign creatives"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-creatives');

-- brand-assets
CREATE POLICY "Users upload own brand assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own brand assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own brand assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- creatives
CREATE POLICY "Users upload own creatives"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'creatives' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own creatives"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'creatives' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own creatives"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'creatives' AND (storage.foldername(name))[1] = auth.uid()::text);
