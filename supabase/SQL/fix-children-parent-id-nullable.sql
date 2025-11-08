-- Fix children table to allow null parent_id
-- This allows creating child users without immediately assigning a parent

ALTER TABLE children 
ALTER COLUMN parent_id DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN children.parent_id IS 'Optional parent user ID - can be assigned later through admin dashboard';
