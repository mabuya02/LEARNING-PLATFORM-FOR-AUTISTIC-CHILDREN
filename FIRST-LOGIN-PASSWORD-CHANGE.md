# First Login Password Change Implementation

## Overview
This feature forces new users to change their password on their first login, after receiving and clicking the confirmation email from Supabase Auth.

## How It Works

1. **Account Creation**: When an admin creates a new user account:
   - User receives a confirmation email from Supabase Auth
   - The `first_login` column in `profiles` table is set to `true`

2. **Email Confirmation**: User clicks the confirmation link in the email:
   - Supabase Auth verifies the email and redirects to the app
   - User is automatically logged in

3. **First Login Detection**: On login, the app checks:
   - If `profile.first_login === true`, show password reset modal
   - Modal cannot be dismissed - user MUST change password

4. **Password Change**: After user changes password:
   - New password is saved to Supabase Auth
   - `first_login` flag is set to `false` in profiles table
   - User can now access the dashboard

5. **Subsequent Logins**: 
   - `first_login === false`, so user logs in normally
   - No password reset modal appears

## Database Changes

### SQL Migration
Run this SQL in your Supabase SQL Editor:

```sql
-- Add first_login column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- Set existing users to false (they've already been using the system)
UPDATE profiles 
SET first_login = false 
WHERE created_at < NOW();
```

File: `add-first-login-column.sql`

## Code Changes Made

### 1. Profile Interface (`src/lib/supabase.ts`)
- Added `first_login: boolean` to Profile interface

### 2. Login Flow (`src/App.tsx`)
- Changed from checking `user_metadata.temp_password` to checking `profile.first_login`
- Shows password reset modal when `first_login === true`
- Blocks dashboard access until password is changed

### 3. Password Reset Modal (`src/components/PasswordResetModal.tsx`)
- After password change, updates `profiles.first_login = false`
- Updated dialog title and description for better UX
- Added logging for debugging

### 4. User Creation (`src/services/adminService.ts`)
- Sets `first_login: true` when creating new user profiles
- Ensures all new accounts require password change on first login

## Testing Instructions

1. **Run the SQL migration**:
   ```bash
   # In Supabase SQL Editor, run the contents of add-first-login-column.sql
   ```

2. **Create a test account**:
   - Log in as admin
   - Create a new user (any role)
   - Note the email and password

3. **Check email**:
   - Check the new user's email inbox
   - Find the Supabase confirmation email
   - Click "Confirm your mail" link

4. **First login**:
   - Should be automatically logged in after confirmation
   - Password reset modal should appear immediately
   - Try to close it - it shouldn't close
   - Enter current password and new password
   - Submit the form

5. **Verify**:
   - Modal should close
   - User should see their dashboard
   - Log out and log back in with NEW password
   - Should login normally without modal

6. **Database check**:
   ```sql
   SELECT id, name, email, first_login FROM profiles WHERE email = 'test@example.com';
   ```
   - Should show `first_login = false` after password change

## Important Notes

- **Existing Users**: All existing users have `first_login = false` set by the migration
- **New Users**: All newly created users have `first_login = true` by default
- **Email Confirmation**: Supabase Auth's email confirmation is required
- **Auto-login**: After email confirmation, users are auto-logged in
- **Modal Blocking**: Modal cannot be dismissed until password is changed
- **One-time Only**: Modal only appears once per user

## Supabase Auth Configuration

Make sure your Supabase project has:
1. Email confirmations enabled (Project Settings → Auth → Email Auth)
2. Confirmation email template configured
3. Redirect URL set to your app's login page

## Security Features

- Password must meet requirements:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (!@#$%^&*)
- Current password verification before change
- Password strength indicator
- Passwords must match confirmation
