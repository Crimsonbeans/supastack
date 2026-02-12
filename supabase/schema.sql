-- Create the prospects table
CREATE TABLE prospects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_name TEXT NOT NULL,
    company_domain TEXT NOT NULL,
    webscan_type TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_linkedin TEXT,
    status TEXT DEFAULT 'pending',
    report_html TEXT,
    confidence_score NUMERIC DEFAULT 66
);

-- Enable Row Level Security (RLS)
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to everyone (public for the report page)
-- In a real app, you might want to restrict this to only the specific ID or authenticated users
-- But for "Public-Facing Report", we need public read access to specific rows.
CREATE POLICY "Public read access" 
ON prospects FOR SELECT 
TO public 
USING (true);

-- Policy: Allow full access to authenticated users (admins)
-- Ideally this should check a role, but for this MVP, we'll assume any auth user is an admin
CREATE POLICY "Admins full access" 
ON prospects FOR ALL 
TO authenticated 
USING (true);

-- Create a bucket for storage if needed (optional, but good practice if we end up storing files)
-- insert into storage.buckets (id, name) values ('reports', 'reports');
