# Security Setup for Magic Slate

This document explains how to set up Row Level Security (RLS) and authentication policies in Supabase to resolve the "RLS Disabled in Public" security warnings.

## Overview

The application uses Clerk for authentication and Supabase for the database. To ensure security, we need to:

1. Enable Row Level Security (RLS) on the `UserCredits` table
2. Create policies that only allow authenticated users to access their own data
3. Prevent unauthenticated access to sensitive data

## Steps to Apply Security Changes

### 1. Run the RLS Setup SQL

Go to your Supabase dashboard → SQL Editor and run the contents of `supabase-rls-setup.sql`:

```sql
-- Enable RLS
ALTER TABLE "UserCredits" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "No anonymous access" ON "UserCredits"
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can only access their own credits" ON "UserCredits"
  FOR ALL USING (auth.uid()::text = "userId");

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON "UserCredits" TO authenticated;
GRANT USAGE ON SEQUENCE "UserCredits_id_seq" TO authenticated;
```

### 2. Verify the Changes

After running the SQL, you can verify the policies are in place:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'UserCredits';
```

You should see 2 policies:
- "No anonymous access"
- "Users can only access their own credits"

### 3. Test the Security

The policies ensure:
- Only authenticated users can access the `UserCredits` table
- Users can only see and modify their own credit records
- Unauthenticated requests are blocked
- Cross-user access is prevented

## Code Changes Made

### Prisma Schema Updates
- Added `@@map("UserCredits")` for proper table naming
- Added RLS policy comments for reference

### Credit Service Updates
- Added `validateAuth()` function to verify user authentication
- All credit functions now validate authentication before proceeding
- Proper error handling for unauthorized access

### Inngest Functions Updates
- Added try-catch blocks for better error handling
- Authentication error detection and handling
- Input validation for required parameters

## Security Benefits

1. **Data Isolation**: Users can only access their own credit data
2. **Authentication Required**: All credit operations require valid authentication
3. **Prevents Unauthorized Access**: Unauthenticated users cannot access credit data
4. **Audit Trail**: All access is logged through Supabase's built-in logging

## Troubleshooting

If you encounter issues after applying these changes:

1. **Check RLS Status**: Verify RLS is enabled on the table
2. **Verify Policies**: Ensure both policies are created and active
3. **Test Authentication**: Make sure your Clerk authentication is working properly
4. **Check Permissions**: Verify the authenticated role has proper permissions

## Monitoring

After implementation, monitor:
- Security Advisor warnings in Supabase (should show 0 errors)
- Application logs for authentication errors
- User access patterns to ensure proper isolation
