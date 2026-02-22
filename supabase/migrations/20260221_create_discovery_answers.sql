-- Discovery Answers: stores customer/admin responses to AI-generated discovery questions
CREATE TABLE IF NOT EXISTS discovery_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discovery_question_id UUID NOT NULL REFERENCES discovery_questions(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL,
  answered_by TEXT NOT NULL DEFAULT 'admin',
  answer_text TEXT,
  answer_json JSONB,
  UNIQUE(discovery_question_id)
);

-- Index for fast lookups by assessment
CREATE INDEX IF NOT EXISTS idx_discovery_answers_assessment ON discovery_answers(assessment_id);
