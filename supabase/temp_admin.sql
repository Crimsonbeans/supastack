-- Create a temporary admin user table
CREATE TABLE temp_admin_user (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- Insert the default admin user
INSERT INTO temp_admin_user (username, password)
VALUES ('admin', 'testadmin@123');

-- Enable RLS but allow public read for now to simplify the login check (or just use service role in code)
-- Actually, better to keep it secure-ish. We'll use standard select.
ALTER TABLE temp_admin_user ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for login check" 
ON temp_admin_user FOR SELECT 
TO public 
USING (true);
