-- Create storage bucket for assessment documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('assessment-documents', 'assessment-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create document_uploads table
CREATE TABLE IF NOT EXISTS document_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assessment_id UUID NOT NULL,
  document_request_id UUID REFERENCES document_requests(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  uploaded_by TEXT NOT NULL DEFAULT 'customer',
  slot_key TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_doc_uploads_assessment ON document_uploads(assessment_id);
CREATE INDEX IF NOT EXISTS idx_doc_uploads_slot ON document_uploads(assessment_id, slot_key);
