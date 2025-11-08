-- Step 1: Check which child users exist in profiles but NOT in children table
-- This will show us which child accounts need child records created

SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  CASE 
    WHEN c.id IS NULL THEN 'Missing child record ❌'
    ELSE 'Has child record ✅'
  END as status
FROM profiles p
LEFT JOIN children c ON p.id = c.id
WHERE p.role = 'child'
ORDER BY p.created_at DESC;

-- Step 2: Create missing child records for existing child users
-- This inserts child records for all child-role profiles that don't have them yet

INSERT INTO children (id, name, age, parent_id, profile_settings, unlocked_difficulties, total_stars)
SELECT 
  p.id,
  p.name,
  5, -- default age
  NULL, -- parent_id is now nullable, can be assigned later
  '{}'::jsonb, -- default profile settings
  ARRAY['easy']::text[], -- default unlocked difficulties
  0 -- default stars
FROM profiles p
LEFT JOIN children c ON p.id = c.id
WHERE p.role = 'child' 
  AND c.id IS NULL; -- Only insert if child record doesn't exist

-- Step 3: Verify the fix
-- This should now show all child records

SELECT 
  c.id,
  c.name as child_name,
  c.parent_id,
  p_parent.name as parent_name,
  c.age,
  c.total_stars
FROM children c
LEFT JOIN profiles p_parent ON c.parent_id = p_parent.id
ORDER BY c.created_at DESC;
