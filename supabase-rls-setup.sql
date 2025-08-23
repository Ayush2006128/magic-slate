-- Supabase RLS Setup for UserCredits table
-- Run these commands in your Supabase SQL editor

-- 1. Enable Row Level Security on the UserCredits table
ALTER TABLE "UserCredits" ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to ensure only authenticated users can access the table
CREATE POLICY "No anonymous access" ON "UserCredits"
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. Create policy to ensure users can only access their own credits
CREATE POLICY "Users can only access their own credits" ON "UserCredits"
  FOR ALL USING (auth.uid()::text = "userId");

-- 4. Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON "UserCredits" TO authenticated;

-- 5. Grant usage on the sequence for ID generation
GRANT USAGE ON SEQUENCE "UserCredits_id_seq" TO authenticated;

-- 6. Verify the policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'UserCredits';

-- 7. Test the RLS is working (optional - run as authenticated user)
-- SELECT * FROM "UserCredits" WHERE "userId" = auth.uid()::text;
