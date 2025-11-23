-- ============================================
-- MIGRATION: Make educator_id required and parent_id optional
-- ============================================
-- This script updates the children table to require educator_id
-- and make parent_id optional

-- Step 1: First, assign all children without an educator to the existing educator
DO $$
DECLARE
  v_educator_id UUID;
  v_unassigned_count INTEGER;
BEGIN
  -- Get the educator ID (John Maina)
  SELECT id INTO v_educator_id 
  FROM profiles 
  WHERE email = 'manassehmabuya@gmail.com' AND role = 'educator'
  LIMIT 1;
  
  IF v_educator_id IS NULL THEN
    RAISE EXCEPTION 'No educator found. Please ensure an educator account exists first.';
  END IF;
  
  -- Count children without educator
  SELECT COUNT(*) INTO v_unassigned_count
  FROM children
  WHERE educator_id IS NULL;
  
  RAISE NOTICE 'Found % children without educator assignment', v_unassigned_count;
  
  -- Assign all unassigned children to the educator
  UPDATE children 
  SET 
    educator_id = v_educator_id,
    updated_at = NOW()
  WHERE educator_id IS NULL;
  
  RAISE NOTICE 'Assigned % children to educator: %', v_unassigned_count, v_educator_id;
END $$;

-- Step 2: Verify all children now have an educator
DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_count
  FROM children
  WHERE educator_id IS NULL;
  
  IF v_null_count > 0 THEN
    RAISE EXCEPTION 'Still have % children without educator. Cannot proceed with migration.', v_null_count;
  END IF;
  
  RAISE NOTICE 'All children have educators assigned. Safe to proceed.';
END $$;

-- Step 3: Drop the old constraints
ALTER TABLE children 
  DROP CONSTRAINT IF EXISTS children_parent_id_fkey;

ALTER TABLE children
  DROP CONSTRAINT IF EXISTS children_educator_id_fkey;

-- Step 4: Make parent_id nullable and educator_id NOT NULL
ALTER TABLE children 
  ALTER COLUMN parent_id DROP NOT NULL;

ALTER TABLE children 
  ALTER COLUMN educator_id SET NOT NULL;

-- Step 5: Re-add the foreign key constraints
ALTER TABLE children 
  ADD CONSTRAINT children_parent_id_fkey 
  FOREIGN KEY (parent_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE children 
  ADD CONSTRAINT children_educator_id_fkey 
  FOREIGN KEY (educator_id) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

-- Step 6: Verify the changes
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Schema changes:';
  RAISE NOTICE '  - parent_id: NOW OPTIONAL (can be NULL)';
  RAISE NOTICE '  - educator_id: NOW REQUIRED (NOT NULL)';
  RAISE NOTICE '========================================';
END $$;

-- Step 7: Display current state
SELECT 
  c.id,
  c.name,
  c.age,
  CASE 
    WHEN c.parent_id IS NULL THEN '❌ No Parent'
    ELSE '✅ Has Parent'
  END as parent_status,
  p_parent.name as parent_name,
  CASE 
    WHEN c.educator_id IS NULL THEN '❌ No Educator'
    ELSE '✅ Has Educator'
  END as educator_status,
  p_educator.name as educator_name,
  p_educator.email as educator_email,
  c.created_at
FROM children c
LEFT JOIN profiles p_parent ON c.parent_id = p_parent.id
LEFT JOIN profiles p_educator ON c.educator_id = p_educator.id
ORDER BY c.created_at DESC;
