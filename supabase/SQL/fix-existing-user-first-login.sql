-- ============================================
-- FIX: Update first_login flag for existing users
-- ============================================

-- Update the specific user who is stuck in the password reset modal
-- User ID: 0fd29e8d-0bb9-4120-9f64-c19ee1733803
UPDATE profiles 
SET first_login = false 
WHERE id = '0fd29e8d-0bb9-4120-9f64-c19ee1733803';

-- Optional: Set all existing users to first_login = false
-- (Uncomment the line below if you want to reset ALL users)
-- UPDATE profiles SET first_login = false WHERE first_login = true;

-- Verify the update
SELECT email, first_login FROM profiles WHERE id = '0fd29e8d-0bb9-4120-9f64-c19ee1733803';
