-- Migration to update scan types
UPDATE prospects 
SET webscan_type = 'GTM AI Readiness'
WHERE webscan_type IN ('Basic', 'Deep', 'AI');

-- Verify if any others exist and update them too just in case
UPDATE prospects 
SET webscan_type = 'GTM AI Readiness'
WHERE webscan_type NOT IN ('GTM AI Readiness', 'Partnership Readiness');
