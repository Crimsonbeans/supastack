-- Rename table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'temp_admin_user') THEN
    ALTER TABLE temp_admin_user RENAME TO admin_user;
  END IF;
END $$;

-- Create table if it didn't exist (e.g. fresh start)
CREATE TABLE IF NOT EXISTS admin_user (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- Add new columns
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT 'Laksh';
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the default admin user with encrypted password
-- Password is 'testadmin@123'
UPDATE admin_user 
SET password = '774e9f7afb37100e16b96439bb16fa9c:047eba99fd6f349c1d70d31eccad8a26b03094b7c8814ffec1c1b1d7d9cdecf45d5d1c97af0da448f12f3198432250899a74332ee2a7fbbd5492c53c0f82cd18',
    full_name = 'Laksh',
    last_updated = NOW()
WHERE username = 'admin';

-- Insert admin if it doesn't exist
INSERT INTO admin_user (username, password, full_name, last_updated)
VALUES ('admin', '774e9f7afb37100e16b96439bb16fa9c:047eba99fd6f349c1d70d31eccad8a26b03094b7c8814ffec1c1b1d7d9cdecf45d5d1c97af0da448f12f3198432250899a74332ee2a7fbbd5492c53c0f82cd18', 'Laksh', NOW())
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password,
    full_name = EXCLUDED.full_name,
    last_updated = EXCLUDED.last_updated;

-- Enable RLS
ALTER TABLE admin_user ENABLE ROW LEVEL SECURITY;

-- Policy for login
DROP POLICY IF EXISTS "Allow public read for login check" ON admin_user;
DROP POLICY IF EXISTS "Allow public read for login" ON admin_user;

CREATE POLICY "Allow public read for login" 
ON admin_user FOR SELECT 
TO public 
USING (true);
