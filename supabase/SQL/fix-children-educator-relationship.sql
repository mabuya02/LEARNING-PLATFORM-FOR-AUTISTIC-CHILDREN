-- ============================================
-- FIX CHILDREN-EDUCATOR RELATIONSHIPS
-- ============================================
-- This script makes educator_id required and parent_id optional
-- Run this in Supabase SQL Editor after the initial schema

-- ========================================
-- PART 1: ASSIGN ALL CHILDREN TO EDUCATOR
-- ========================================

-- Find and assign all children to the educator (John Maina)
DO $$
DECLARE
  v_educator_id UUID;
  v_assigned_count INTEGER := 0;
BEGIN
  -- Get the educator ID
  SELECT id INTO v_educator_id 
  FROM profiles 
  WHERE email = 'manassehmabuya@gmail.com' AND role = 'educator'
  LIMIT 1;
  
  IF v_educator_id IS NULL THEN
    -- If John Maina doesn't exist, get any educator
    SELECT id INTO v_educator_id 
    FROM profiles 
    WHERE role = 'educator'
    LIMIT 1;
  END IF;
  
  IF v_educator_id IS NULL THEN
    RAISE EXCEPTION 'No educator found in the system. Please create an educator account first.';
  END IF;
  
  RAISE NOTICE '📋 Using educator ID: %', v_educator_id;
  
  -- Assign all children without an educator
  UPDATE children 
  SET 
    educator_id = v_educator_id,
    updated_at = NOW()
  WHERE educator_id IS NULL;
  
  GET DIAGNOSTICS v_assigned_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Assigned % children to educator', v_assigned_count;
END $$;

-- ========================================
-- PART 2: ALTER TABLE CONSTRAINTS
-- ========================================

-- Drop existing foreign key constraints
ALTER TABLE children 
  DROP CONSTRAINT IF EXISTS children_parent_id_fkey,
  DROP CONSTRAINT IF EXISTS children_educator_id_fkey;

-- Make parent_id optional (nullable)
ALTER TABLE children 
  ALTER COLUMN parent_id DROP NOT NULL;

-- Make educator_id required (not null)
-- First check if any children still don't have an educator
DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_count
  FROM children
  WHERE educator_id IS NULL;
  
  IF v_null_count > 0 THEN
    RAISE EXCEPTION 'Cannot proceed: % children still have NULL educator_id', v_null_count;
  END IF;
END $$;

-- Now make educator_id NOT NULL
ALTER TABLE children 
  ALTER COLUMN educator_id SET NOT NULL;

-- Re-add foreign key constraints with new rules
ALTER TABLE children 
  ADD CONSTRAINT children_parent_id_fkey 
  FOREIGN KEY (parent_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE children 
  ADD CONSTRAINT children_educator_id_fkey 
  FOREIGN KEY (educator_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- ========================================
-- PART 3: VERIFICATION
-- ========================================

-- Display summary
DO $$
DECLARE
  v_total_children INTEGER;
  v_with_parent INTEGER;
  v_without_parent INTEGER;
  v_with_educator INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_children FROM children;
  SELECT COUNT(*) INTO v_with_parent FROM children WHERE parent_id IS NOT NULL;
  SELECT COUNT(*) INTO v_without_parent FROM children WHERE parent_id IS NULL;
  SELECT COUNT(*) INTO v_with_educator FROM children WHERE educator_id IS NOT NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Children: %', v_total_children;
  RAISE NOTICE 'With Parent: %', v_with_parent;
  RAISE NOTICE 'Without Parent: %', v_without_parent;
  RAISE NOTICE 'With Educator: % (Required)', v_with_educator;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Schema Changes:';
  RAISE NOTICE '  ✓ parent_id: NOW OPTIONAL';
  RAISE NOTICE '  ✓ educator_id: NOW REQUIRED';
  RAISE NOTICE '========================================';
END $$;

-- Display children with their assignments
SELECT 
  c.id,
  c.name,
  c.age,
  CASE 
    WHEN c.parent_id IS NOT NULL THEN '✅ ' || p_parent.name
    ELSE '➖ No Parent'
  END as parent_info,
  '✅ ' || p_educator.name as educator_info,
  p_educator.email as educator_email,
  c.created_at
FROM children c
LEFT JOIN profiles p_parent ON c.parent_id = p_parent.id
INNER JOIN profiles p_educator ON c.educator_id = p_educator.id
ORDER BY c.created_at DESC;
