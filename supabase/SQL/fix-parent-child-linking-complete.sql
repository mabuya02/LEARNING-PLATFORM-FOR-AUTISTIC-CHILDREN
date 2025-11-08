-- ============================================
-- COMPLETE FIX FOR PARENT-CHILD LINKING
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Step 1: Make parent_id nullable (allows creating children without parents)
ALTER TABLE children 
ALTER COLUMN parent_id DROP NOT NULL;

-- Step 2: Create child records for all existing child users
-- This inserts records for child-role profiles that don't have child records yet
INSERT INTO children (id, name, age, parent_id, profile_settings, unlocked_difficulties, total_stars)
SELECT 
  p.id,
  p.name,
  5, -- default age
  NULL, -- no parent assigned yet
  '{}'::jsonb,
  ARRAY['easy']::text[],
  0
FROM profiles p
LEFT JOIN children c ON p.id = c.id
WHERE p.role = 'child' 
  AND c.id IS NULL;

-- Step 3: Verify the fix worked
SELECT 
  'Total child records: ' || COUNT(*)::text as result
FROM children;

SELECT 
  c.id,
  c.name as child_name,
  c.parent_id,
  CASE 
    WHEN c.parent_id IS NULL THEN 'No parent assigned yet'
    ELSE p_parent.name
  END as parent_name,
  c.age,
  c.total_stars
FROM children c
LEFT JOIN profiles p_parent ON c.parent_id = p_parent.id
ORDER BY c.created_at DESC;
