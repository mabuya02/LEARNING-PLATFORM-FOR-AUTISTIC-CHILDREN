-- Add questions column to learning_modules table
ALTER TABLE learning_modules 
ADD COLUMN questions JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN learning_modules.questions IS 'Array of question objects: { id, text, options: [], correctOptionIndex }';
