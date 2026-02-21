# n8n Workflows

## Workflow Management Rules ⚠️

**CRITICAL - NO EXCEPTIONS:**

1. **FIRST**: Update the JSON file in this folder
2. **THEN**: Publish or modify in n8n
3. **NEVER** modify n8n directly without updating the local JSON first

This ensures:
- Version control for all workflows
- Local backup of workflow configurations
- Ability to track changes via git
- Single source of truth in the codebase

---

## Project Structure

```
workflows/
├── phase1-completed/    # ✅ Phase 1 - Delivered & Complete
│   ├── XltKceTO8rGqvP4j.json (100KB)
│   ├── 242d7QieSdQcAsfd.json (89KB)
│   └── c8V9tx3p92KyA5mD.json (89KB)
└── phase2/              # 🚧 Phase 2 - In Development
    ├── eJQAcBlb45pMvMFw.json (55KB)  - Requirements Generator
    ├── ig0YNPdQmYaQX9ds.json (44KB)  - Document Processor
    ├── 1ynOLUqzJRBweKUj.json (37KB)  - Document Categorizer + Dispatch
    └── 4Zu1k5LxauFl7crW.json (1.8MB) - Dimension Analysis (Document-Based)
```

---

## Phase 1 Workflows (COMPLETED ✅)

### 1. Search Analysis - Dimension Workflow - Integration
**File:** `phase1-completed/XltKceTO8rGqvP4j.json` (100KB)
**ID:** XltKceTO8rGqvP4j
**Status:** ✅ Delivered
**Description:** Dimension-level analysis workflow that generates targeted search queries, executes web searches via Tavily, analyzes results using Claude Sonnet 4.5, and stores dimension analysis in Supabase.

**Key Features:**
- AI-powered search query generation
- Batch processing with rate limiting
- Comprehensive dimension analysis
- Automatic report trigger when all dimensions complete

---

### 2. Report Generator - Webscan (Phase 1) - Integrationv2
**File:** `phase1-completed/242d7QieSdQcAsfd.json` (89KB)
**ID:** 242d7QieSdQcAsfd
**Status:** ✅ Delivered
**Description:** Report generation workflow that aggregates dimension analyses and creates comprehensive GTM readiness reports.

---

### 3. Web Scan and Playbook Creator Phase 1 - integrationV2
**File:** `phase1-completed/c8V9tx3p92KyA5mD.json` (89KB)
**ID:** c8V9tx3p92KyA5mD
**Status:** ✅ Delivered
**Description:** Initial web scan workflow that creates assessment playbooks and triggers dimension analysis workflows.

---

## Phase 2 Workflows (IN DEVELOPMENT 🚧)

### 1. Phase 2 - Requirements Generator ANKITUSE
**File:** `phase2/eJQAcBlb45pMvMFw.json` (55KB)
**ID:** eJQAcBlb45pMvMFw
**Description:** Generates requirements and interview questions for Phase 2 deep-dive assessments.

---

### 2. Phase 2 - Document Processor ANKITUSE
**File:** `phase2/ig0YNPdQmYaQX9ds.json` (44KB)
**ID:** ig0YNPdQmYaQX9ds
**Description:** Processes uploaded customer documents for analysis.

---

### 3. Phase 2 - Document Categorizer + Dimension Dispatch ANKITUSE
**File:** `phase2/1ynOLUqzJRBweKUj.json` (37KB)
**ID:** 1ynOLUqzJRBweKUj
**Description:** Categorizes documents and dispatches them to relevant dimension analysis workflows.

---

### 4. Phase 2 - Dimension Analysis (Document-Based) v3 ANKITUSE
**File:** `phase2/4Zu1k5LxauFl7crW.json` (1.8MB)
**ID:** 4Zu1k5LxauFl7crW
**Description:** Deep-dive dimension analysis using customer-provided documents (Phase 2 iteration).

**Note:** This is a large workflow with extensive document processing capabilities.

---

## Workflow Update Process

### To Modify a Workflow:

1. **Edit local JSON file**
   ```bash
   # Edit the workflow JSON in this folder
   code workflows/XltKceTO8rGqvP4j.json
   ```

2. **Test and validate JSON**
   ```bash
   # Ensure JSON is valid
   jq '.' workflows/XltKceTO8rGqvP4j.json
   ```

3. **Update in n8n**
   ```bash
   # Use n8n API to update the workflow
   curl -X PUT \
     -H "X-N8N-API-KEY: $N8N_API_KEY" \
     -H "Content-Type: application/json" \
     -d @workflows/XltKceTO8rGqvP4j.json \
     "$N8N_API_URL/api/v1/workflows/XltKceTO8rGqvP4j"
   ```

4. **Commit changes**
   ```bash
   git add workflows/
   git commit -m "Update workflow: XltKceTO8rGqvP4j"
   ```

---

## Downloading Workflows from n8n

```bash
# Download a specific workflow
curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_API_URL/api/v1/workflows/WORKFLOW_ID" | \
  jq '.' > workflows/WORKFLOW_ID.json

# Download all 3 active workflows
curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_API_URL/api/v1/workflows/XltKceTO8rGqvP4j" > workflows/XltKceTO8rGqvP4j.json

curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_API_URL/api/v1/workflows/242d7QieSdQcAsfd" > workflows/242d7QieSdQcAsfd.json

curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_API_URL/api/v1/workflows/c8V9tx3p92KyA5mD" > workflows/c8V9tx3p92KyA5mD.json
```

---

## Environment Variables

Ensure these are set in `.env.local`:

```bash
N8N_API_URL=https://n8n.srv957266.hstgr.cloud
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
N8N_WEBHOOK_URL=https://n8n.srv957266.hstgr.cloud/webhook/phase1-scanv2
```

---

## Last Updated

**Date:** 2026-02-21
**Downloaded from:** n8n.srv957266.hstgr.cloud
**Project:** DVYglwqlfMJuM9zT
