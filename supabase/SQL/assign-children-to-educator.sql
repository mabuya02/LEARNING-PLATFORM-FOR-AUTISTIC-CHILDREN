-- ============================================
-- ASSIGN CHILDREN TO EDUCATOR
-- ============================================
-- This script helps assign existing children to an educator
-- Replace the educator_id and child_ids with actual values

-- Example: Find your educator ID
-- SELECT id, name, email, role FROM profiles WHERE role = 'educator';

-- Example: Find available children
-- SELECT id, name, age, parent_id, educator_id FROM children;

-- Method 1: Assign children to educator by updating the children table
-- Replace 'YOUR_EDUCATOR_ID' with the actual educator UUID
UPDATE children 
SET educator_id = 'YOUR_EDUCATOR_ID'
WHERE id IN (
  -- Replace these with actual child IDs you want to assign
  'CHILD_ID_1',
  'CHILD_ID_2'
);

-- Method 2: Assign ALL children without an educator to a specific educator
-- Uncomment the following to use this approach:
/*
UPDATE children 
SET educator_id = 'YOUR_EDUCATOR_ID'
WHERE educator_id IS NULL;
*/

-- Method 3: View current assignments
SELECT 
  c.id as child_id,
  c.name as child_name,
  c.age,
  p_parent.name as parent_name,
  p_educator.name as educator_name,
  p_educator.email as educator_email
FROM children c
LEFT JOIN profiles p_parent ON c.parent_id = p_parent.id
LEFT JOIN profiles p_educator ON c.educator_id = p_educator.id
ORDER BY c.created_at DESC;

-- Method 4: For the current educator (John Maina - manassehmabuya@gmail.com)
-- Find the educator ID first, then assign children
DO $$
DECLARE
  v_educator_id UUID;
BEGIN
  -- Get educator ID for John Maina
  SELECT id INTO v_educator_id 
  FROM profiles 
  WHERE email = 'manassehmabuya@gmail.com' AND role = 'educator';
  
  IF v_educator_id IS NOT NULL THEN
    -- Assign all unassigned children to this educator
    UPDATE children 
    SET educator_id = v_educator_id,
        updated_at = NOW()
    WHERE educator_id IS NULL;
    
    RAISE NOTICE 'Assigned children to educator: %', v_educator_id;
  ELSE
    RAISE NOTICE 'Educator not found with email: manassehmabuya@gmail.com';
  END IF;
END $$;

-- Verify the assignments
SELECT 
  c.name as child_name,
  c.age,
  p.name as educator_name,
  p.email as educator_email
FROM children c
JOIN profiles p ON c.educator_id = p.id
WHERE p.email = 'manassehmabuya@gmail.com';
