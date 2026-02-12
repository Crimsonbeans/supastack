-- Add report_html_public column to prospects table
ALTER TABLE public.prospects
ADD COLUMN IF NOT EXISTS report_html_public TEXT;
