-- ============================================
-- ADD VIDEO SUPPORT TO LEARNING MODULES
-- ============================================

-- Add video_url column to learning_modules table
ALTER TABLE learning_modules 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN learning_modules.video_url IS 'URL or filename of uploaded video for this module';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'learning_modules' 
  AND column_name = 'video_url';

-- ============================================
-- OPTIONAL: Create storage bucket for videos
-- ============================================
-- Run this in Supabase SQL Editor if you want to store videos in Supabase Storage

-- Create a storage bucket for module videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('module-videos', 'module-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload videos
CREATE POLICY "Educators can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'module-videos');

-- Create policy to allow anyone to view videos
CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'module-videos');

-- Create policy to allow educators to delete their videos
CREATE POLICY "Educators can delete their videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'module-videos');

-- ============================================
-- COMPLETE! 🎉
-- The video_url column is now ready to store video references
-- You can now upload videos to Supabase Storage or store external URLs
-- ============================================
