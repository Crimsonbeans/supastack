# Phase 2 Document Processing Workflows - Deep Dive

## Overview

Phase 2 document processing consists of **4 chained n8n workflows** that form a pipeline:

```
[1] Document Processor ──> [2] Document Categorizer ──> [3] Parallel Processor (per doc) ──> [4] Dimension Analysis (per dimension)
```

**Execution flow:** The admin/customer submits documents via the form. The app triggers Workflow 1, which processes files, then automatically calls Workflow 2, which dispatches Workflow 3 per document, and finally dispatches Workflow 4 per dimension.

---

## Workflow Registry

| # | Name | n8n ID | Trigger | Role |
|---|------|--------|---------|------|
| 1 | Document Processor | `ig0YNPdQmYaQX9ds` | Webhook (form upload) | Extract text from uploaded files |
| 2 | Document Categorizer + Dimension Dispatch | `1ynOLUqzJRBweKUj` | Sub-workflow (called by #1) | Orchestrate categorization + dispatch analysis |
| 3 | Parallel Processor Document Categorizer | `anphyr0Am3ub4IiA` | Sub-workflow (called by #2) | AI-categorize single document against dimensions |
| 4 | Dimension Analysis (Document-Based) v3 | `4Zu1k5LxauFl7crW` | Sub-workflow (called by #2) | Deep AI analysis per dimension across all assigned docs |

---

## Pipeline Architecture

```
                                PHASE 2 DOCUMENT PROCESSING PIPELINE
                                =====================================

    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                     WORKFLOW 1: Document Processor                         │
    │                                                                           │
    │  Webhook ──> Initialize ──> Get Assessment ──> Version Management          │
    │                                                                           │
    │  ──> Classify Files ──> Loop Files ──> Unstructured.io API ──> Chunk      │
    │                                                                           │
    │  ──> Insert document_metadata ──> Insert document_content                  │
    │      Insert document_chunks                                               │
    │                                                                           │
    │  OUTPUT: All files extracted, chunked, stored in DB                        │
    └──────────────────────────────┬──────────────────────────────────────────────┘
                                   │ Calls sub-workflow
                                   ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │              WORKFLOW 2: Document Categorizer + Dimension Dispatch          │
    │                                                                           │
    │  ──> Get Assessment ──> Resolve Playbook ──> Extract Dimensions            │
    │                                                                           │
    │  ──> Get Documents ──> Filter Already-Processed ──> Batch (20/batch)       │
    │                                                                           │
    │  ──> Dispatch to WF3 (async, fire-and-forget) ──> Smart Wait              │
    │                                                                           │
    │  ──> Verify All Categorized ──> Split by Dimension ──> Dispatch to WF4    │
    └────────────┬───────────────────────────────────────┬────────────────────────┘
                 │ Per document (batches of 20)          │ Per dimension (6x parallel)
                 ▼                                       ▼
    ┌────────────────────────────┐    ┌──────────────────────────────────────────┐
    │  WORKFLOW 3: Parallel      │    │  WORKFLOW 4: Dimension Analysis v3       │
    │  Processor (Categorizer)   │    │                                          │
    │                            │    │  ──> Get Playbook ──> Get Prior Analysis  │
    │  ──> Get Chunks            │    │                                          │
    │  ──> Combine (12K budget)  │    │  ──> Get Assigned Documents              │
    │  ──> Claude Haiku 4.5      │    │  ──> Smart Batch (Sonnet/Opus split)     │
    │  ──> Parse JSON Output     │    │  ──> Loop Batches                        │
    │  ──> Insert Assignments    │    │      ──> Build Context + Prompt          │
    │                            │    │      ──> Claude Sonnet/Opus Agent        │
    │  WRITES TO:                │    │      ──> Parse + Store Analysis          │
    │  document_dimension_       │    │      ──> Compress Memory                 │
    │  assignments               │    │                                          │
    │                            │    │  ──> Final Score ──> Upsert dimension_   │
    │  MODEL: Claude Haiku 4.5   │    │      analyses                            │
    │  COST: ~$0.01/doc          │    │                                          │
    │                            │    │  MODELS: Sonnet 4.5 + Opus 4             │
    └────────────────────────────┘    │  COST: ~$0.15-$1.50/batch               │
                                      └──────────────────────────────────────────┘
```

---

## Workflow 1: Document Processor

**ID:** `ig0YNPdQmYaQX9ds` | **66KB** | **22 nodes**

### Purpose
Takes uploaded files (PDF, DOCX, XLSX, PPTX, CSV, images), extracts text using the Unstructured.io API, chunks the content semantically, and stores everything in the database.

### Trigger
**Webhook** - `n8n-nodes-base.formTrigger` ("Document Upload Form")
- Form with fields: `assessmentId`, `status`, `trigger_reason`, `documents_submitted`, `iteration`, `stage`
- Accepts binary file uploads

### Execution Flow

```
Document Upload Form (webhook)
  │
  ▼
Initialize
  │  Stores assessmentId, totalDocuments, processingStartedAt in global staticData
  │  Initializes processedDocuments = [], processingErrors = []
  ▼
Get Assessment (Supabase: assessments)
  │  Fetches assessment by ID to get organization_id
  ▼
Store Org ID
  │  Saves organizationId in staticData
  ▼
Get Latest Version (Supabase: stage_versions)
  │  Checks for existing version with same assessment_id + stage
  ▼
Prepare New Version
  │  Determines: create new version or reuse existing?
  │  Increments iteration number if existing version found
  ▼
Create or Use Existing? (IF)
  │
  ├── [New] ──> Create Stage Version (Supabase INSERT: stage_versions)
  │             ──> Store Version
  │
  └── [Existing] ──> Use Existing Version
  │
  ▼
Classify Files
  │  Iterates binary data keys, classifies each file by extension/MIME:
  │    pdf → pdf_extraction
  │    docx/doc → word_extraction
  │    csv → csv_extraction
  │    xlsx/xls → excel_extraction
  │    pptx/ppt → ppt_extraction
  │    txt → direct_text
  │    video → video_transcription
  │    image → image_ocr
  │  Outputs one item per file with metadata
  ▼
Loop Files (SplitInBatches)
  │
  ├── [Each file] ──> Select Extraction Strategy
  │                      │  fast: text, CSV, word, small PDFs (<1MB)
  │                      │  hi_res: everything else
  │                      ▼
  │                   Unstructured.io Extract (HTTP POST)
  │                      │  URL: https://api.unstructuredapp.io/general/v0/general
  │                      │  Sends file as multipart form data
  │                      ▼
  │                   Process Unstructured Output
  │                      │  Extracts text, counts elements/images/tables
  │                      ▼
  │                   Store Result
  │                      │  Semantic chunking: splits by element type (Title = new chunk)
  │                      │  Max 3000 chars/chunk, estimates tokens at chars/4
  │                      │  Appends to staticData.processedDocuments
  │                      ▼
  │                   Loop Files (back to next file)
  │
  └── [Done] ──> Prepare Metadata
                    │
                    ▼
                 Insert Document Metadata (Supabase: document_metadata)
                    │  One row per processed file
                    │
                    ├──> Prepare Content ──> Insert document content (Supabase: document_content)
                    │    Full extracted text per document
                    │
                    └──> Prepare Chunks ──> Insert Chunks (Supabase: document_chunks)
                         Individual semantic chunks with indices
                    │
                    ▼
                 Prepare Output (summary stats)
                    │
                    ▼
                 Call 'Phase 2 - Document Categorizer' (sub-workflow: 1ynOLUqzJRBweKUj)
```

### Database Operations

| Table | Operation | What |
|-------|-----------|------|
| `assessments` | SELECT | Get assessment + org_id |
| `stage_versions` | SELECT, INSERT | Version management |
| `document_metadata` | INSERT | File metadata (name, type, size, extraction method, word/page count) |
| `document_content` | INSERT | Full extracted text per document |
| `document_chunks` | INSERT | Semantic chunks (content, index, token count, page/slide ranges) |

### External APIs
- **Unstructured.io** - Document parsing API
  - URL: `https://api.unstructuredapp.io/general/v0/general`
  - API Key: `ym60Vm1px1im0HP0l8Lo9lFwGR5RSi`
  - Strategies: `fast` or `hi_res`

### Key Design Decisions
- **Semantic chunking**: Splits at Title elements and paragraph boundaries, max 3000 chars/chunk
- **Version management**: Supports re-processing (same assessment, incremented iteration)
- **Parallel DB writes**: document_content and document_chunks inserted in parallel after metadata
- **Rollback on failure**: If DB insert fails for metadata, processing continues with `onError: continueRegularOutput`

---

## Workflow 2: Document Categorizer + Dimension Dispatch

**ID:** `1ynOLUqzJRBweKUj` | **50KB** | **25 nodes**

### Purpose
Orchestrator workflow. Resolves the assessment playbook to extract dimensions, dispatches each document to the AI categorizer (WF3) in parallel, waits for completion, then dispatches per-dimension analysis (WF4).

### Trigger
**Sub-workflow call** from Workflow 1 (Document Processor).
- Input: `assessmentId`, `versionId`, `organizationId`, processing stats

### Execution Flow

```
From Document Processor (sub-workflow trigger)
  │
  ▼
Initialize
  │  Stores assessmentId, versionId, organizationId in staticData
  ▼
Get Assessment (Supabase: assessments)
  │  Fetches assessment with playbook references
  ▼
Check Variant
  │  Three-way routing based on playbook source:
  │    1. Cached content on assessment (playbook_content) → skip fetch
  │    2. Industry variant (playbook_variant_id) → fetch variant
  │    3. Base playbook → fetch default
  ▼
Skip Fetch? (IF)
  ├── [Cached] ──> Extract Dimensions (uses assessment.playbook_content)
  └── [Need fetch] ──> Use Variant? (IF)
                         ├── [Yes] ──> Get Variant (Supabase: playbook_industry_variants)
                         └── [No] ──> Get Base Playbook (Supabase: playbooks)
                         └──> Extract Dimensions
  │
  ▼
Extract Dimensions
  │  Parses playbook JSON, extracts dimension definitions:
  │  { key, name, weight, description } for each dimension
  │  Typically 6 dimensions (e.g., people_org, data_analytics, technology, etc.)
  ▼
Get Documents (Supabase: document_metadata WHERE version_id)
  ▼
Collect Doc IDs
  ▼
Get Existing Assignments (Supabase: document_dimension_assignments)
  │  Idempotency check: skip already-categorized documents
  ▼
Filter Unprocessed
  │  Outputs one item per unprocessed document
  │  Builds dimensionList string for AI prompts
  ▼
Check Skip (IF: all done?)
  ├── [All done] ──> Skip Output (END)
  └── [Have work] ──> Loop Documents (SplitInBatches, size=20)
                         │
                         ├── [Each batch] ──> Call Parallel Processor (WF3)
                         │                     Fire-and-forget (async, no wait)
                         │                   ──> Wait (30 seconds)
                         │                   ──> Loop Documents (next batch)
                         │
                         └── [All dispatched] ──> Wait for Categorization Complete
                                                    │  Smart wait: ceil(docs/20) * 6 + 10 seconds
                                                    ▼
                                                  Check Completion Status
                                                    │  Re-query document_dimension_assignments
                                                    ▼
                                                  Verify All Categorized
                                                    │  Compare categorized count vs expected
                                                    ▼
                                                  Split by Dimensions
                                                    │  Fan-out: 1 item per dimension
                                                    ▼
                                                  Check Skip Analysis (IF)
                                                    ├── [Skip] ──> END
                                                    └── [Go] ──> Call Dimension Analysis (WF4)
                                                                  Fire-and-forget per dimension
```

### Sub-Workflow Calls

| Target | Workflow ID | Mode | Wait? | Input |
|--------|------------|------|-------|-------|
| Parallel Processor (WF3) | `anphyr0Am3ub4IiA` | each | No (fire-and-forget) | `{documentId, versionId, assessmentId, dimensions[], dimensionList}` |
| Dimension Analysis (WF4) | `4Zu1k5LxauFl7crW` | each | No (fire-and-forget) | `{assessmentId, versionId, dimensionKey, dimensionName, dimensionWeight, dimensionOrder, totalDimensions}` |

### Key Design Decisions
- **Batched async dispatch**: Documents sent to categorizer in batches of 20, with 30s pause between batches
- **Smart wait**: Calculates expected processing time based on document count before checking results
- **Idempotent**: Filters out already-categorized documents before dispatching
- **Three-way playbook resolution**: Supports cached, variant, and base playbooks
- **Proceeds despite incomplete categorization**: If smart wait finishes and some docs aren't categorized, it continues anyway

---

## Workflow 3: Parallel Processor Document Categorizer

**ID:** `anphyr0Am3ub4IiA` | **36KB** | **9 nodes**

### Purpose
Categorizes a **single document** against all assessment dimensions using Claude Haiku 4.5. Determines which dimensions each document is relevant to with confidence scores.

### Trigger
**Sub-workflow call** from Workflow 2. Receives one document per execution.

### Execution Flow

```
Start (sub-workflow trigger)
  │  Input: { documentId, versionId, assessmentId, dimensions[], dimensionList }
  ▼
Get Chunks (Supabase: document_chunks WHERE document_id, ORDER BY chunk_index)
  │  Fetches all pre-chunked content for this document
  ▼
Combine Chunks
  │  Intelligent sampling for 12K token budget:
  │    Total <= 12K tokens: use ALL chunks (full strategy)
  │    Total > 12K tokens: sample first + last + 3-5 middle chunks
  │  Inserts "[... N chunk(s) omitted ...]" markers at gaps
  ▼
Categorization Agent (LangChain Agent)
  │  Model: Claude Haiku 4.5 (via OpenRouter)
  │  Prompt: "You are a document categorization specialist..."
  │  Task: For each dimension where confidence >= 60%:
  │    - Assign confidence_score (0.6-1.0)
  │    - Provide reasoning
  │    - Extract key_findings[]
  │    - Extract metrics_found[] (name, value, context)
  │    - Include relevant_quotes[] (max 3, max 100 chars each)
  │    - Classify document_type and document_summary
  │  Output format: Raw JSON only (no markdown)
  ▼
Parse Agent JSON
  │  Triple-fallback JSON extraction:
  │    1. Direct JSON.parse()
  │    2. Extract from ```json ... ``` code fences
  │    3. Find first { to last } and parse
  ▼
Parse AI Output
  │  Transforms into N items (one per relevant dimension)
  │  Each: { document_id, version_id, dimension_key, dimension_name,
  │          confidence_score, assignment_reasoning, extracted_insights,
  │          relevant_quotes, insight_count, assigned_by_model }
  ▼
Insert Assignments (Supabase INSERT: document_dimension_assignments)
  │  One row per dimension assignment
  ▼
Track Progress
  │  Returns: { documentId, dimensionsAssigned, status, assignments[] }
```

### AI Configuration
- **Model**: `anthropic/claude-haiku-4.5` via OpenRouter
- **Token budget**: 12K tokens (content sampling)
- **Cost**: ~$0.01 per document
- **Confidence threshold**: 0.6 (60%) minimum to assign a dimension

### Database Operations

| Table | Operation | What |
|-------|-----------|------|
| `document_chunks` | SELECT | Fetch all chunks for document |
| `document_dimension_assignments` | INSERT | One row per relevant dimension (confidence >= 60%) |

### Output Schema (per assignment row)
```json
{
  "document_id": "uuid",
  "version_id": "uuid",
  "dimension_key": "people_org",
  "dimension_name": "People & Organizational Readiness",
  "confidence_score": 0.85,
  "assignment_reasoning": "This document discusses...",
  "extracted_insights": "{\"key_findings\":[...],\"metrics_found\":[...],\"evidence\":[...]}",
  "relevant_quotes": ["quote 1", "quote 2"]
}
```

---

## Workflow 4: Dimension Analysis (Document-Based) v3

**ID:** `4Zu1k5LxauFl7crW` | **1.6MB** | **19 nodes**

### Purpose
The heavyweight analysis workflow. For a **single dimension**, analyzes ALL documents assigned to that dimension using Claude Sonnet 4.5 and/or Opus 4. Produces a detailed maturity score (0-100) with evidence-based analysis.

### Trigger
**Sub-workflow call** from Workflow 2. One execution per dimension (typically 6 parallel executions).

### Execution Flow

```
Dimension Analysis Trigger (sub-workflow)
  │  Input: { assessmentId, versionId, dimensionKey, dimensionName,
  │           dimensionWeight, dimensionOrder, totalDimensions }
  ▼
Initialize Session
  │  Creates unique session/memory keys
  │  Stores dimension metadata in staticData
  ▼
Get Assessment ──> Get Playbook (parallel)
  │  Fetches assessment details and playbook content
  ▼
Get Prior Analysis (Supabase: dimension_analyses)
  │  Check for existing analysis of this dimension
  ▼
Store Prior Analysis
  │  Stores prior scores + playbook dimension section in staticData
  │  Extracts dimension-specific questions from playbook
  ▼
Get Assigned Documents (Supabase: document_dimension_assignments)
  │  Fetch all documents categorized for THIS dimension
  │  Filter: dimension_key = currentDimension AND version_id = versionId
  ▼
Get Document Content (Supabase: document_content)
  │  Fetch full extracted text for each assigned document
  ▼
Assign Models
  │  Complexity-based model routing:
  │    - Opus 4: token_count > 50K OR complex financial/legal docs
  │    - Sonnet 4.5: everything else (default)
  │  Estimates cost per batch
  ▼
Smart Document Batcher
  │  Groups documents by model type, creates optimal batches:
  │    Sonnet: max 7 docs/batch, max 100K tokens/batch ($0.15/batch)
  │    Opus: max 3 docs/batch, max 150K tokens/batch ($1.50/batch)
  │  Splits docs > 80K tokens into 60K chunks with 2K overlap
  ▼
Loop Over Batches (SplitInBatches)
  │
  ├── [Each batch] ──> Check Existing Analysis (Supabase: document_content)
  │                      │  Skip documents already analyzed for this dimension
  │                      ▼
  │                   Build Prompt
  │                      │  Constructs mega-prompt with:
  │                      │    - Dimension definition from playbook
  │                      │    - Assessment questions for this dimension
  │                      │    - Scoring rubric (crawl/walk/run/fly framework)
  │                      │    - All document contents in batch
  │                      │    - Prior analysis context (if exists)
  │                      │    - Compressed memory from previous batches
  │                      │  Prompt size: 2000-5000+ tokens of instructions
  │                      ▼
  │                   Analysis Agent (LangChain Agent)
  │                      │  Model: Claude Sonnet 4.5 or Opus 4 (via OpenRouter)
  │                      │  Task: Score dimension maturity 0-100, provide:
  │                      │    - raw_score + confidence_score
  │                      │    - maturity_level (crawl/walk/run/fly)
  │                      │    - component_scores (sub-dimension breakdown)
  │                      │    - key_findings[], critical_gaps[], strengths[]
  │                      │    - metrics_found[], evidence_summary
  │                      │    - recommendations[]
  │                      │    - full_analysis (detailed narrative)
  │                      ▼
  │                   Parse Agent JSON
  │                      │  Same triple-fallback JSON parser as WF3
  │                      ▼
  │                   Store Analysis
  │                      │  Updates document_content.analysis_status
  │                      │  Stores results in staticData
  │                      ▼
  │                   Compress Memory
  │                      │  Compresses analysis into running summary:
  │                      │    - Cumulative score (rolling average)
  │                      │    - Key findings, gaps, strengths (appended)
  │                      │    - Metrics found (accumulated)
  │                      │    - Evidence summary (compressed)
  │                      │  This compressed memory feeds into the next batch's prompt
  │                      ▼
  │                   Loop Over Batches (next batch)
  │
  └── [All done] ──> Final Score Calculation
                        │  Computes final raw_score, confidence_score
                        │  Determines maturity_level
                        │  Compiles full analysis narrative
                        ▼
                     Upsert Dimension Analysis (Supabase: dimension_analyses)
                        │  UPSERT on (assessment_id, dimension_key)
                        │  Writes final scores, analysis, evidence
```

### AI Configuration

| Model | Provider | Usage | Batch Limits | Cost |
|-------|----------|-------|--------------|------|
| Claude Sonnet 4.5 | OpenRouter | Default analysis model | 7 docs, 100K tokens/batch | ~$0.15/batch |
| Claude Opus 4 | OpenRouter | Complex/large documents | 3 docs, 150K tokens/batch | ~$1.50/batch |

### Scoring Framework

| Level | Score Range | Meaning |
|-------|------------|---------|
| Crawl | 0-25 | Early stage, significant gaps |
| Walk | 26-50 | Developing, basic capabilities |
| Run | 51-75 | Mature, well-established |
| Fly | 76-100 | Industry-leading, innovative |

### Database Operations

| Table | Operation | What |
|-------|-----------|------|
| `assessments` | SELECT | Get assessment details |
| `playbooks` / `playbook_industry_variants` | SELECT | Get scoring playbook |
| `dimension_analyses` | SELECT, UPSERT | Prior analysis + final results |
| `document_dimension_assignments` | SELECT | Get docs assigned to this dimension |
| `document_content` | SELECT, UPDATE | Get full text, update analysis_status |

### Memory System
The workflow uses a **compressed memory** system to maintain context across batches:
- After each batch, findings are compressed into a summary
- The summary feeds into the next batch's prompt as "prior context"
- This allows the AI to build cumulative understanding across many documents
- Memory keys: `dimension_{versionId}_{dimensionKey}`
- Tracks: documents processed, cumulative score, maturity level, key findings, critical gaps, strengths, metrics, evidence

---

## Database Schema (Phase 2 Document Tables)

```
stage_versions
  ├── id (UUID PK)
  ├── assessment_id (FK)
  ├── stage (text)
  ├── iteration (int)
  ├── status, trigger_reason, documents_submitted
  └── version_number, version_type

document_metadata
  ├── id (UUID PK)
  ├── assessment_id (FK)
  ├── version_id (FK → stage_versions)
  ├── original_filename, file_type, file_size_bytes
  ├── processing_status
  ├── word_count, page_count, row_count, sheet_count
  ├── token_count, extraction_model
  └── processing_started_at

document_content
  ├── id (UUID PK)
  ├── organization_id, assessment_id, version_id, document_id (FKs)
  ├── extracted_content (TEXT - full document text)
  ├── char_count, word_count, token_count
  ├── extraction_method
  └── analysis_status

document_chunks
  ├── id (UUID PK)
  ├── organization_id, assessment_id, version_id, document_id (FKs)
  ├── chunk_index, total_chunks
  ├── content_text
  ├── char_count, token_count
  ├── page_range, slide_range, row_range, sheet_name
  └── processing_status

document_dimension_assignments
  ├── id (UUID PK)
  ├── assessment_id, document_id, version_id (FKs)
  ├── dimension_key, dimension_name
  ├── confidence_score (0.6-1.0)
  ├── assignment_reasoning
  ├── extracted_insights (JSONB)
  └── relevant_quotes (TEXT[])

dimension_analyses
  ├── id (UUID PK)
  ├── assessment_id (FK)
  ├── dimension_key, dimension_name
  ├── raw_score (0-100), confidence_score
  ├── maturity_level (crawl/walk/run/fly)
  ├── component_scores (JSONB)
  ├── key_findings, critical_gaps, strengths (TEXT[])
  ├── metrics_found (JSONB)
  ├── evidence_summary, full_analysis (TEXT)
  └── recommendations (JSONB)
```

---

## External Services & Credentials

| Service | Purpose | Credential |
|---------|---------|------------|
| Supabase (SupaStack) | Database + Auth | Credential ID: `FTSugGkqwnuu6irz` |
| OpenRouter | LLM API gateway | Credential ID: `DPnbXJEN5OpXBJeM` |
| Unstructured.io | Document parsing | API Key: `ym60Vm1px1...` |

### Models Used

| Model | Where | Purpose |
|-------|-------|---------|
| Claude Haiku 4.5 | WF3 (Categorizer) | Fast, cheap document categorization |
| Claude Sonnet 4.5 | WF4 (Analysis, default) | Standard dimension analysis |
| Claude Opus 4 | WF4 (Analysis, complex docs) | Deep analysis for large/complex docs |

---

## Cost Estimates (per assessment)

| Stage | Model | Estimated Cost |
|-------|-------|---------------|
| Document extraction | Unstructured.io | ~$0.05-0.10 |
| Categorization (per doc) | Haiku 4.5 | ~$0.01/doc |
| Dimension analysis (Sonnet) | Sonnet 4.5 | ~$0.15/batch |
| Dimension analysis (Opus) | Opus 4 | ~$1.50/batch |
| **Total (20 docs, 6 dims)** | | **~$1.50-5.00** |

---

## Known Issues & Notes

1. **Model mismatch in WF3**: `assigned_by_model` is hardcoded to `'claude-sonnet-4'` but actual model is `claude-haiku-4.5`
2. **Skip flag not checked in WF3**: `_skipInsert` flag is set in Parse AI Output but never checked before Insert Assignments node
3. **Incomplete categorization tolerance in WF2**: If smart wait finishes and categorization is incomplete, dimension analysis proceeds anyway
4. **No retry logic**: None of the workflows have explicit retry branches on AI or DB failures
5. **Static data persistence**: WF4 uses n8n global static data for memory across batches - this persists between executions and could cause issues if not properly reset
6. **Unstructured.io API key** is hardcoded in the HTTP Request node headers (should be moved to credentials)
