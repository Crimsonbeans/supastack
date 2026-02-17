-- Check if there are any column-level RLS policies
-- Run this in Supabase SQL Editor

SELECT 
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'prospects';

-- Also check if UPDATE is allowed for all columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prospects' 
ORDER BY ordinal_position;
