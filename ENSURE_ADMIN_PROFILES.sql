-- ======================================================
-- SECURITY SYNC: ENSURE ADMINS IN PROFILES TABLE
-- ======================================================
-- This script ensures that everyone in the admin_allowlist 
-- is also present in the profiles table with the 'admin' role.
-- This satisfies RLS policies and backend permission checks.

INSERT INTO profiles (id, email, role, full_name)
SELECT 
    au.id, 
    au.email, 
    'admin' as role,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Administrator') as full_name
FROM auth.users au
JOIN admin_allowlist al ON au.email ILIKE al.email
ON CONFLICT (id) DO UPDATE 
SET role = 'admin';

-- VERIFICATION
SELECT email, role, full_name FROM profiles WHERE role = 'admin';
