-- ============================================
-- QUICK FIX: Disable RLS for attention_sessions
-- ============================================

-- This will temporarily disable RLS for attention_sessions table
-- to allow the attention tracking to work during development

-- Disable RLS
ALTER TABLE attention_sessions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled (should show 'f' for false)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'attention_sessions';

-- Show message
SELECT 'RLS disabled for attention_sessions table - attention tracking should work now!' as message;

-- ============================================
-- COMPLETE! 🎉
-- Your attention tracking should work now
-- ============================================
