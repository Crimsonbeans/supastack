-- Add INSERT policy for authenticated users
-- Run this in your Supabase SQL Editor

CREATE POLICY "Authenticated users can insert" 
ON prospects FOR INSERT 
TO authenticated 
WITH CHECK (true);
