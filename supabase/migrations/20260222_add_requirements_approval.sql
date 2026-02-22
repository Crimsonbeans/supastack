-- Add requirements approval and form status columns to customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS requirements_approved_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS requirements_approved_by TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS auto_approve_requirements BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requirements_form_status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS requirements_submitted_at TIMESTAMPTZ DEFAULT NULL;
