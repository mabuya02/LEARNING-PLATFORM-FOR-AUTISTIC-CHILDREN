-- Disable RLS on children table to fix infinite recursion
-- This is temporary for development

ALTER TABLE children DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on progress table since it references children
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'learning_modules', 'children', 'progress')
ORDER BY tablename;
