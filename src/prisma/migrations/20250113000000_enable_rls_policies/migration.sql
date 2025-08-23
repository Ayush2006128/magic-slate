-- Enable Row Level Security on UserCredits table
ALTER TABLE "UserCredits" ENABLE ROW LEVEL SECURITY;

-- Policy to ensure only authenticated users can access the table
CREATE POLICY "No anonymous access" ON "UserCredits"
  FOR ALL USING (auth.role() = 'authenticated');

-- Policy to ensure users can only access their own credits
CREATE POLICY "Users can only access their own credits" ON "UserCredits"
  FOR ALL USING (auth.uid()::text = "userId");

-- Policy to prevent users from accessing other users' credits
CREATE POLICY "Prevent cross-user access" ON "UserCredits"
  FOR ALL USING (auth.uid()::text = "userId");

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON "UserCredits" TO authenticated;
GRANT USAGE ON SEQUENCE "UserCredits_id_seq" TO authenticated;
