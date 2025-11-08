-- Create admin user
-- This script creates an admin user for the AdminDashboard

-- Admin user has been created in Supabase Authentication
-- Email: mainamanasseh02@gmail.com
-- Password: MainAdmin123!
-- UUID: 2ba79ae3-5f80-40e4-b37b-fb3638a0ecd5

INSERT INTO profiles (id, email, name, role, created_at, updated_at)
VALUES (
  '2ba79ae3-5f80-40e4-b37b-fb3638a0ecd5',
  'mainamanasseh02@gmail.com',
  'Maina Manasseh',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verify the admin user was created
SELECT * FROM profiles WHERE role = 'admin';

