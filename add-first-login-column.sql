-- Add first_login column to profiles table
-- This tracks whether a user needs to change their password on first login

-- Add the column with default value of true (1)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- Set existing users to false (they've already been using the system)
UPDATE profiles 
SET first_login = false 
WHERE created_at < NOW();

-- Add a comment to document the column
COMMENT ON COLUMN profiles.first_login IS 'Tracks if user needs to change password on first login. Set to false after initial password change.';

-- Verify the changes
SELECT 
    id,
    name,
    email,
    role,
    first_login,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
