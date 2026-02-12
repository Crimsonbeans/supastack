-- Add report_html_public to assessment_results table
ALTER TABLE assessment_results 
ADD COLUMN IF NOT EXISTS report_html_public TEXT;
