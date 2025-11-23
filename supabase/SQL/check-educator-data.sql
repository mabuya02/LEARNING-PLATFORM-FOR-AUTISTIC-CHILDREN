-- ============================================
-- CHECK EDUCATOR DASHBOARD DATA
-- Quick diagnostic queries for educator issues
-- ============================================

-- 1. Check if educator exists and their details
SELECT 
  id,
  name,
  email,
  role,
  created_at
FROM profiles 
WHERE email = 'manassehmabuya@gmail.com';

-- 2. Check all children in the database
SELECT 
  c.id,
  c.name,
  c.age,
  c.educator_id,
  p_parent.name as parent_name,
  p_parent.email as parent_email,
  c.created_at
FROM children c
LEFT JOIN profiles p_parent ON c.parent_id = p_parent.id
ORDER BY c.created_at DESC;

-- 3. Check children assigned to this educator
SELECT 
  c.id,
  c.name,
  c.age,
  p.name as educator_name,
  p.email as educator_email
FROM children c
JOIN profiles p ON c.educator_id = p.id
WHERE p.email = 'manassehmabuya@gmail.com';

-- 4. Check all progress records
SELECT 
  p.id,
  p.child_id,
  c.name as child_name,
  p.module_name,
  p.score,
  p.time_spent,
  p.completed_at
FROM progress p
LEFT JOIN children c ON p.child_id = c.id
ORDER BY p.completed_at DESC
LIMIT 20;

-- 5. Count summary
SELECT 
  'Total Profiles' as metric,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
  'Total Educators',
  COUNT(*)
FROM profiles
WHERE role = 'educator'
UNION ALL
SELECT 
  'Total Children',
  COUNT(*)
FROM children
UNION ALL
SELECT 
  'Children with Educators',
  COUNT(*)
FROM children
WHERE educator_id IS NOT NULL
UNION ALL
SELECT 
  'Children without Educators',
  COUNT(*)
FROM children
WHERE educator_id IS NULL
UNION ALL
SELECT 
  'Total Progress Records',
  COUNT(*)
FROM progress;

-- 6. If you need to create a test child for the educator:
/*
DO $$
DECLARE
  v_educator_id UUID;
  v_parent_id UUID;
  v_child_id UUID;
BEGIN
  -- Get educator ID
  SELECT id INTO v_educator_id 
  FROM profiles 
  WHERE email = 'manassehmabuya@gmail.com' AND role = 'educator';
  
  -- Get or create a parent
  SELECT id INTO v_parent_id 
  FROM profiles 
  WHERE role = 'parent' 
  LIMIT 1;
  
  IF v_parent_id IS NULL THEN
    RAISE NOTICE 'No parent found. Please create a parent account first.';
  ELSIF v_educator_id IS NOT NULL THEN
    -- Create test child
    INSERT INTO children (name, age, parent_id, educator_id, profile_settings)
    VALUES ('Test Child', 6, v_parent_id, v_educator_id, '{}')
    RETURNING id INTO v_child_id;
    
    RAISE NOTICE 'Created test child with ID: %', v_child_id;
  END IF;
END $$;
*/
