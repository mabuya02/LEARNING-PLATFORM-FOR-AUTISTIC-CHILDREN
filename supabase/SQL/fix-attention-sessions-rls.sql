-- ============================================
-- FIX: Attention Sessions RLS Policies
-- ============================================

-- First, check if the table exists and has RLS enabled
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attention_sessions') THEN
        RAISE NOTICE 'Table attention_sessions exists, proceeding with policy fixes...';
    ELSE
        RAISE NOTICE 'Table attention_sessions does not exist!';
    END IF;
END $$;

-- ============================================
-- Option 1: Disable RLS temporarily (recommended for development)
-- ============================================

-- Disable RLS for easier development and testing
ALTER TABLE attention_sessions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Option 2: Fix RLS Policies (if you want to keep RLS enabled)
-- ============================================

-- Uncomment the following if you want to keep RLS enabled:

/*
-- Enable RLS
ALTER TABLE attention_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow all authenticated users to insert sessions" ON attention_sessions;
DROP POLICY IF EXISTS "Allow all authenticated users to view sessions" ON attention_sessions;
DROP POLICY IF EXISTS "Allow all authenticated users to update sessions" ON attention_sessions;
DROP POLICY IF EXISTS "Allow service role full access" ON attention_sessions;

-- Create simple, working policies
CREATE POLICY "attention_sessions_select_policy" 
ON attention_sessions FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "attention_sessions_insert_policy" 
ON attention_sessions FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "attention_sessions_update_policy" 
ON attention_sessions FOR UPDATE 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "attention_sessions_delete_policy" 
ON attention_sessions FOR DELETE 
USING (auth.uid() IS NOT NULL);
*/

-- ============================================
-- Grant necessary permissions
-- ============================================

-- Ensure the authenticated role has the necessary permissions
GRANT ALL ON attention_sessions TO authenticated;
GRANT ALL ON attention_sessions TO service_role;

-- ============================================
-- Verify the setup
-- ============================================

-- Check if RLS is disabled (should return 'f' for false)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'attention_sessions';

-- List current policies (should be empty if RLS is disabled)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'attention_sessions';

-- ============================================
-- COMPLETE! 🎉
-- Note: RLS is disabled for attention_sessions during development
-- This allows all authenticated users to read/write attention data
-- ============================================