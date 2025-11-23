-- ============================================
-- QUICK FIX: Assign Children to Educator
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Verify educator exists
DO $$
DECLARE
  v_educator_id UUID;
  v_children_count INTEGER;
BEGIN
  -- Get educator ID for John Maina
  SELECT id INTO v_educator_id 
  FROM profiles 
  WHERE email = 'manassehmabuya@gmail.com' AND role = 'educator';
  
  IF v_educator_id IS NULL THEN
    RAISE EXCEPTION 'Educator not found with email: manassehmabuya@gmail.com';
  END IF;
  
  RAISE NOTICE 'Found educator ID: %', v_educator_id;
  
  -- Count existing children without educator
  SELECT COUNT(*) INTO v_children_count
  FROM children
  WHERE educator_id IS NULL;
  
  RAISE NOTICE 'Found % children without an educator', v_children_count;
  
  -- Assign all unassigned children to this educator
  UPDATE children 
  SET 
    educator_id = v_educator_id,
    updated_at = NOW()
  WHERE educator_id IS NULL;
  
  RAISE NOTICE 'Successfully assigned % children to educator', v_children_count;
  
  -- Show the assignments
  RAISE NOTICE '------- Assigned Children -------';
  FOR rec IN 
    SELECT c.name, c.age, c.id
    FROM children c
    WHERE c.educator_id = v_educator_id
  LOOP
    RAISE NOTICE 'Child: % (Age: %, ID: %)', rec.name, rec.age, rec.id;
  END LOOP;
  
END $$;

-- Verify the assignments
SELECT 
  c.id as child_id,
  c.name as child_name,
  c.age,
  p_parent.name as parent_name,
  p_educator.name as educator_name,
  p_educator.email as educator_email,
  COUNT(pr.id) as progress_records
FROM children c
LEFT JOIN profiles p_parent ON c.parent_id = p_parent.id
LEFT JOIN profiles p_educator ON c.educator_id = p_educator.id
LEFT JOIN progress pr ON c.id = pr.child_id
WHERE p_educator.email = 'manassehmabuya@gmail.com'
GROUP BY c.id, c.name, c.age, p_parent.name, p_educator.name, p_educator.email
ORDER BY c.created_at DESC;
