-- Check all accounts in the system

-- 1. Check all profiles (users)
SELECT 
    'PROFILES' as table_name,
    id,
    name,
    email,
    role,
    child_id,
    created_at
FROM profiles
ORDER BY role, created_at DESC;

-- 2. Check all children records
SELECT 
    'CHILDREN' as table_name,
    id,
    name,
    age,
    parent_id,
    educator_id,
    created_at
FROM children
ORDER BY created_at DESC;

-- 3. Check auth.users metadata (temp_password flags)
SELECT 
    'AUTH_USERS' as table_name,
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 4. Count by role
SELECT 
    'ROLE_COUNTS' as report,
    role,
    COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;

-- 5. Check for orphaned profiles (child role without children record)
SELECT 
    'ORPHANED_CHILD_PROFILES' as report,
    p.id,
    p.name,
    p.email,
    p.role
FROM profiles p
LEFT JOIN children c ON p.id = c.id
WHERE p.role = 'child' AND c.id IS NULL;

-- 6. Check for profiles with temp_password flag
SELECT 
    'TEMP_PASSWORD_USERS' as report,
    au.id,
    au.email,
    p.name,
    p.role,
    au.raw_user_meta_data->>'temp_password' as temp_password_flag
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.raw_user_meta_data->>'temp_password' = 'true'
ORDER BY au.created_at DESC;
