-- Check current RLS policies on prospects table
-- Run this in your Supabase SQL Editor to see all policies

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'prospects';
