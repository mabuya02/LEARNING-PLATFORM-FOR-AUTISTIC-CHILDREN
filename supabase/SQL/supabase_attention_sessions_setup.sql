-- ============================================
-- Attention Sessions Table Setup for Supabase
-- ============================================
-- Run this in your Supabase SQL Editor

-- 1. Create the table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS attention_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    video_url TEXT,
    session_start TIMESTAMPTZ DEFAULT now(),
    session_end TIMESTAMPTZ,
    video_duration_seconds INTEGER,
    total_frames_analyzed INTEGER DEFAULT 0,
    attentive_frames INTEGER DEFAULT 0,
    attention_score DECIMAL(5, 2),
    avg_eye_aspect_ratio DECIMAL(5, 4),
    avg_head_tilt_degrees DECIMAL(6, 2),
    engagement_level TEXT CHECK (engagement_level IN ('high', 'medium', 'low')),
    attention_breaks INTEGER DEFAULT 0,
    longest_attention_span_seconds INTEGER DEFAULT 0,
    average_attention_span_seconds DECIMAL(10, 2),
    frames_with_face INTEGER DEFAULT 0,
    frames_without_face INTEGER DEFAULT 0,
    camera_quality_score INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attention_child ON attention_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_attention_module ON attention_sessions(module_id);
CREATE INDEX IF NOT EXISTS idx_attention_start ON attention_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_attention_engagement ON attention_sessions(engagement_level);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE attention_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all authenticated users to insert sessions" ON attention_sessions;
DROP POLICY IF EXISTS "Allow all authenticated users to view sessions" ON attention_sessions;
DROP POLICY IF EXISTS "Allow all authenticated users to update sessions" ON attention_sessions;
DROP POLICY IF EXISTS "Allow service role full access" ON attention_sessions;

-- 5. Create RLS Policies

-- Policy 1: Allow authenticated users to INSERT their own sessions
CREATE POLICY "Allow all authenticated users to insert sessions"
ON attention_sessions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 2: Allow authenticated users to SELECT all sessions
-- (Educators and parents need to see children's data)
CREATE POLICY "Allow all authenticated users to view sessions"
ON attention_sessions
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow authenticated users to UPDATE sessions
CREATE POLICY "Allow all authenticated users to update sessions"
ON attention_sessions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow service role full access (for backend operations)
CREATE POLICY "Allow service role full access"
ON attention_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Grant permissions
GRANT ALL ON attention_sessions TO authenticated;
GRANT ALL ON attention_sessions TO service_role;

-- 7. Add comment for documentation
COMMENT ON TABLE attention_sessions IS 'Stores real-time attention tracking data from video learning sessions using computer vision and facial landmark detection';

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this after the above to verify everything worked:

SELECT 
    schemaname,
    tablename,
    tableowner,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'attention_sessions';

-- Check policies:
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'attention_sessions';

-- ============================================
-- SUCCESS!
-- ============================================
-- If you see the table and 4 policies listed above,
-- your attention tracking database is ready! 🎉
