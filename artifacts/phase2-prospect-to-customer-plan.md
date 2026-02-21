# Phase 2: Prospect to Customer Conversion Plan

**Created:** 2026-02-21
**Status:** Draft - Awaiting Review
**Project:** DVYglwqlfMJuM9zT

---

## 🎯 Objective

Convert qualified prospects (with completed Phase 1 reports) into customers after offline contract signing, while retaining all Phase 1 assessment data for Phase 2 analysis.

---

## 📊 Current Database Structure

### Existing Tables (Phase 1)

```sql
prospects
├── id (UUID, PK)
├── created_at (TIMESTAMPTZ)
├── company_name (TEXT)
├── company_domain (TEXT)
├── webscan_type (TEXT)
├── contact_name (TEXT)
├── contact_email (TEXT)
├── contact_linkedin (TEXT)
├── status (TEXT) -- 'pending', 'processing', 'completed', 'new_inquiry'
├── source (TEXT) -- 'inbound', 'outbound'
├── qualified_at (TIMESTAMPTZ) -- When user signed up
├── organization_id (UUID, FK → organizations)
├── report_html (TEXT) -- Full internal report (Phase 1)
├── report_html_public (TEXT) -- Obscured public report (Phase 1)
└── confidence_score (NUMERIC)

organizations
├── id (UUID, PK)
├── created_at (TIMESTAMPTZ)
├── name (TEXT)
├── domain (TEXT, UNIQUE)
└── org_type (TEXT) -- 'customer', 'prospect'

assessments
├── id (UUID, PK)
├── organization_id (UUID, FK)
├── playbook_id (UUID, FK)
├── type (TEXT) -- 'gtm_readiness'
├── status (TEXT)
└── [timestamps]

assessment_versions
├── id (UUID, PK)
├── assessment_id (UUID, FK)
├── version_number (INTEGER)
├── stage (TEXT) -- 'web_scan', 'interview', etc.
└── [data fields]

dimension_analyses
├── id (UUID, PK)
├── assessment_id (UUID, FK)
├── version_id (UUID, FK)
├── dimension_key (TEXT)
├── dimension_name (TEXT)
├── stage (TEXT) -- 'web_scan'
├── iteration (INTEGER)
├── raw_score (INTEGER 0-100)
├── confidence_score (INTEGER 0-100)
├── full_analysis (JSONB) -- AI analysis with evidence
├── analysis_summary (TEXT)
└── [timestamps]

assessment_results
├── id (UUID, PK)
├── assessment_version_id (UUID, FK)
├── report_html (TEXT) -- Full internal report
├── report_html_public (TEXT) -- Obscured public report
└── [timestamps]

company_profiles
├── id (UUID, PK)
├── organization_id (UUID, FK)
├── industry_primary (TEXT)
├── industry_vertical (TEXT)
├── classification (JSONB)
└── [timestamps]
```

---

## 🚨 Critical Business Rules

### Hard Requirements

1. **Report Prerequisite**
   ✅ A prospect can ONLY be converted to customer if they have a completed Phase 1 report
   - Check: `prospects.status = 'completed'`
   - Check: `prospects.report_html IS NOT NULL`
   - Check: Associated `assessment_results` record exists

2. **Data Retention**
   ✅ Phase 1 reports MUST be retained and accessible for Phase 2
   - Full report (internal view)
   - Public report (obscured view)
   - All dimension analyses
   - Company classification data

3. **No Status Change**
   ✅ This is NOT a simple status update - it's a proper table switch
   - Move prospect → customers table
   - Maintain FK relationships to assessments
   - Preserve audit trail

---

## 🏗️ Proposed Solution

### Option A: New `customers` Table (RECOMMENDED ✅)

**Rationale:** Clean separation, better data model, allows prospect recycling

```sql
-- New customers table
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    converted_at TIMESTAMPTZ DEFAULT NOW(),

    -- Original prospect reference
    prospect_id UUID REFERENCES prospects(id) NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,

    -- Contract information
    contract_signed_at TIMESTAMPTZ NOT NULL,
    contract_type TEXT, -- 'phase1_only', 'phase1_and_2', 'enterprise'

    -- Account details
    account_manager TEXT,
    billing_contact_email TEXT,
    billing_contact_name TEXT,

    -- Phase 1 report references (for quick access)
    phase1_assessment_id UUID REFERENCES assessments(id),
    phase1_report_version_id UUID REFERENCES assessment_versions(id),

    -- Customer status
    status TEXT DEFAULT 'active', -- 'active', 'churned', 'paused'
    phase TEXT DEFAULT 'phase1_delivered', -- 'phase1_delivered', 'phase2_in_progress', 'phase2_delivered'

    -- Metadata
    notes TEXT,
    tags TEXT[],

    CONSTRAINT customers_unique_prospect UNIQUE(prospect_id),
    CONSTRAINT customers_valid_status CHECK (status IN ('active', 'churned', 'paused')),
    CONSTRAINT customers_valid_phase CHECK (phase IN ('phase1_delivered', 'phase2_in_progress', 'phase2_delivered'))
);

-- Index for fast lookups
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_phase ON customers(phase);
CREATE INDEX idx_customers_prospect ON customers(prospect_id);

-- RLS Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on customers"
ON customers FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Customers can view own data"
ON customers FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
);
```

**Advantages:**
- ✅ Clean data model - customers are distinct entities
- ✅ Prospect record preserved for audit trail
- ✅ Can track conversion metrics (time to convert, etc.)
- ✅ Future: Can re-engage churned customers
- ✅ Clear FK relationships to assessments

**Disadvantages:**
- ⚠️ Requires updating queries to join customers + prospects
- ⚠️ Need to decide: which table owns the org relationship?

---

### Option B: Add `customer_record_id` to Prospects (Alternative)

**Rationale:** Keep prospects as source of truth, link to customer metadata

```sql
-- Add customer link to prospects
ALTER TABLE prospects ADD COLUMN customer_record_id UUID REFERENCES customers(id);
ALTER TABLE prospects ADD COLUMN is_customer BOOLEAN DEFAULT FALSE;
ALTER TABLE prospects ADD COLUMN converted_to_customer_at TIMESTAMPTZ;

-- Simpler customers table (metadata only)
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    contract_signed_at TIMESTAMPTZ NOT NULL,
    contract_type TEXT,
    account_manager TEXT,
    status TEXT DEFAULT 'active',
    phase TEXT DEFAULT 'phase1_delivered'
);
```

**Advantages:**
- ✅ Prospects remain central source
- ✅ Simpler queries (no joins needed for prospect data)
- ✅ Easier migration

**Disadvantages:**
- ❌ Prospect table becomes bloated over time
- ❌ Less clear separation of concerns
- ❌ Harder to query "all customers" efficiently

---

## 📝 Recommended Approach: **Option A**

### Why Option A is Better for Phase 2:

1. **Scalability:** As customer base grows, separating customers from prospects keeps queries fast
2. **Phase 2 Scope:** Phase 2 will involve deep-dive assessments, interviews, custom playbooks - these are customer-specific features
3. **Reporting:** Easier to generate customer-only metrics, ARR tracking, churn analysis
4. **Data Integrity:** Clear ownership - customers table owns active relationships, prospects table is lead pipeline

---

## 🔄 Conversion Workflow

### Process Flow

```
Qualified Prospect (with Phase 1 Report)
    ↓
Offline Contract Signed
    ↓
Admin Action: "Convert to Customer"
    ↓
1. Validate Prerequisites
    - Check prospect.status = 'completed'
    - Check prospect.report_html IS NOT NULL
    - Check assessment_results exists
    ↓
2. Create Customer Record
    - INSERT INTO customers
    - Link prospect_id
    - Link organization_id
    - Link phase1_assessment_id
    - Set contract_signed_at
    - Set status = 'active'
    - Set phase = 'phase1_delivered'
    ↓
3. Update Related Records
    - Update organizations.org_type = 'customer'
    - Keep prospect record intact (for audit)
    ↓
4. Grant Customer Portal Access
    - Update user permissions
    - Enable Phase 2 features
    ↓
Customer Record Created ✅
```

---

## 🛠️ Implementation Steps

### Step 1: Database Migration

**File:** `supabase/migrations/20260221_create_customers_table.sql`

```sql
-- Create customers table
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    converted_at TIMESTAMPTZ DEFAULT NOW(),

    prospect_id UUID REFERENCES prospects(id) NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,

    contract_signed_at TIMESTAMPTZ NOT NULL,
    contract_type TEXT,
    account_manager TEXT,
    billing_contact_email TEXT,
    billing_contact_name TEXT,

    phase1_assessment_id UUID REFERENCES assessments(id),
    phase1_report_version_id UUID REFERENCES assessment_versions(id),

    status TEXT DEFAULT 'active',
    phase TEXT DEFAULT 'phase1_delivered',

    notes TEXT,
    tags TEXT[],

    CONSTRAINT customers_unique_prospect UNIQUE(prospect_id),
    CONSTRAINT customers_valid_status CHECK (status IN ('active', 'churned', 'paused')),
    CONSTRAINT customers_valid_phase CHECK (phase IN ('phase1_delivered', 'phase2_in_progress', 'phase2_delivered'))
);

-- Indexes
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_phase ON customers(phase);
CREATE INDEX idx_customers_prospect ON customers(prospect_id);
CREATE INDEX idx_customers_phase1_assessment ON customers(phase1_assessment_id);

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on customers"
ON customers FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Customers can view own data"
ON customers FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
);

-- Update organizations type options if needed
-- (Already supports 'customer' per existing code)
```

---

### Step 2: API Endpoint

**File:** `src/app/api/admin/convert-to-customer/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    try {
        const { prospect_id, contract_details } = await request.json()

        // 1. Validate Prerequisites
        const { data: prospect, error: prospectError } = await supabase
            .from('prospects')
            .select(`
                id,
                status,
                organization_id,
                company_name,
                company_domain,
                report_html,
                contact_email,
                contact_name
            `)
            .eq('id', prospect_id)
            .single()

        if (prospectError || !prospect) {
            return NextResponse.json(
                { error: 'Prospect not found' },
                { status: 404 }
            )
        }

        // HARD RULE: Must have completed Phase 1 report
        if (prospect.status !== 'completed' || !prospect.report_html) {
            return NextResponse.json(
                {
                    error: 'Cannot convert prospect without completed Phase 1 report',
                    requirement: 'Prospect must have status=completed and report_html must exist'
                },
                { status: 400 }
            )
        }

        // 2. Find Phase 1 Assessment
        const { data: assessment } = await supabase
            .from('assessments')
            .select('id, (assessment_versions(id))')
            .eq('organization_id', prospect.organization_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        // 3. Create Customer Record
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .insert({
                prospect_id: prospect.id,
                organization_id: prospect.organization_id,
                contract_signed_at: contract_details.signed_at || new Date().toISOString(),
                contract_type: contract_details.type || 'phase1_only',
                account_manager: contract_details.account_manager,
                billing_contact_email: prospect.contact_email,
                billing_contact_name: prospect.contact_name,
                phase1_assessment_id: assessment?.id || null,
                phase1_report_version_id: assessment?.assessment_versions?.[0]?.id || null,
                status: 'active',
                phase: 'phase1_delivered',
                notes: contract_details.notes
            })
            .select()
            .single()

        if (customerError) {
            return NextResponse.json(
                { error: 'Failed to create customer record', details: customerError },
                { status: 500 }
            )
        }

        // 4. Update Organization Type
        await supabase
            .from('organizations')
            .update({ org_type: 'customer' })
            .eq('id', prospect.organization_id)

        return NextResponse.json({
            success: true,
            customer_id: customer.id,
            message: `${prospect.company_name} converted to customer`,
            phase1_report_retained: true
        })

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
```

---

### Step 3: Admin UI Component

**File:** `src/components/admin/ConvertToCustomerButton.tsx`

```typescript
'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'

interface ConvertToCustomerButtonProps {
    prospect: {
        id: string
        company_name: string
        status: string
        report_html: string | null
    }
    onSuccess?: () => void
}

export default function ConvertToCustomerButton({
    prospect,
    onSuccess
}: ConvertToCustomerButtonProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showDialog, setShowDialog] = useState(false)

    const canConvert = prospect.status === 'completed' && prospect.report_html

    const handleConvert = async (contractDetails: any) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/admin/convert-to-customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prospect_id: prospect.id,
                    contract_details: contractDetails
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Conversion failed')
            }

            setShowDialog(false)
            onSuccess?.()

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!canConvert) {
        return (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Requires completed Phase 1 report</span>
            </div>
        )
    }

    return (
        <>
            <button
                onClick={() => setShowDialog(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <CheckCircle className="w-4 h-4" />
                )}
                Convert to Customer
            </button>

            {showDialog && (
                <ContractDetailsDialog
                    prospectName={prospect.company_name}
                    onSubmit={handleConvert}
                    onCancel={() => setShowDialog(false)}
                    loading={loading}
                    error={error}
                />
            )}
        </>
    )
}

// Contract details dialog component
function ContractDetailsDialog({ prospectName, onSubmit, onCancel, loading, error }: any) {
    const [formData, setFormData] = useState({
        signed_at: new Date().toISOString().split('T')[0],
        type: 'phase1_only',
        account_manager: '',
        notes: ''
    })

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
                <h3 className="text-xl font-bold">Convert {prospectName} to Customer</h3>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Contract Signed Date</label>
                        <input
                            type="date"
                            value={formData.signed_at}
                            onChange={(e) => setFormData({...formData, signed_at: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Contract Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            <option value="phase1_only">Phase 1 Only</option>
                            <option value="phase1_and_2">Phase 1 + Phase 2</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Account Manager (optional)</label>
                        <input
                            type="text"
                            value={formData.account_manager}
                            onChange={(e) => setFormData({...formData, account_manager: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Name or email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2"
                            rows={3}
                            placeholder="Contract details, special terms, etc."
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <button
                        onClick={() => onSubmit(formData)}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                        {loading ? 'Converting...' : 'Confirm Conversion'}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
```

---

### Step 4: Admin Page Integration

**File:** `src/app/admin/leads/qualified/page.tsx`

Update to show conversion button for qualified prospects:

```typescript
import ConvertToCustomerButton from '@/components/admin/ConvertToCustomerButton'

// In the DashboardClient component, add conversion button to each row
{prospect.status === 'completed' && prospect.report_html && (
    <ConvertToCustomerButton
        prospect={prospect}
        onSuccess={() => router.refresh()}
    />
)}
```

---

### Step 5: New Customers Admin Page

**File:** `src/app/admin/customers/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function CustomersPage() {
    const supabase = await createClient()

    const { data: customers } = await supabase
        .from('customers')
        .select(`
            *,
            organization:organizations(name, domain),
            prospect:prospects(company_name, contact_name, contact_email)
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Customers</h1>

            <div className="grid gap-4">
                {customers?.map(customer => (
                    <CustomerCard key={customer.id} customer={customer} />
                ))}
            </div>
        </div>
    )
}
```

---

## 📊 Phase 1 Report Retention Strategy

### Where Reports Are Stored

| Data Type | Table | Column | Format | Usage |
|-----------|-------|--------|--------|-------|
| Full Internal Report | `prospects` | `report_html` | HTML | Admin view, internal analysis |
| Public Report | `prospects` | `report_html_public` | HTML | Customer-facing, obscured |
| Full Internal Report | `assessment_results` | `report_html` | HTML | Linked to assessment version |
| Public Report | `assessment_results` | `report_html_public` | HTML | Version-specific public view |
| Dimension Analyses | `dimension_analyses` | `full_analysis` | JSONB | Individual dimension data |
| Company Classification | `company_profiles` | `classification` | JSONB | Industry/vertical/size data |

### Access Patterns for Phase 2

```sql
-- Get customer's Phase 1 report (Option 1: via prospect)
SELECT
    c.id as customer_id,
    p.report_html as phase1_report_full,
    p.report_html_public as phase1_report_public,
    p.confidence_score
FROM customers c
JOIN prospects p ON p.id = c.prospect_id
WHERE c.id = :customer_id;

-- Get customer's Phase 1 report (Option 2: via assessment)
SELECT
    c.id as customer_id,
    ar.report_html as phase1_report_full,
    ar.report_html_public as phase1_report_public
FROM customers c
JOIN assessment_results ar ON ar.assessment_version_id = c.phase1_report_version_id
WHERE c.id = :customer_id;

-- Get all Phase 1 dimension analyses for customer
SELECT
    da.*
FROM customers c
JOIN dimension_analyses da ON da.assessment_id = c.phase1_assessment_id
WHERE c.id = :customer_id
  AND da.stage = 'web_scan'
  AND da.iteration = 1
ORDER BY da.dimension_key;

-- Get customer's company classification
SELECT
    cp.*
FROM customers c
JOIN company_profiles cp ON cp.organization_id = c.organization_id
WHERE c.id = :customer_id
ORDER BY cp.created_at DESC
LIMIT 1;
```

### Recommendation: Primary Storage

**Use `assessment_results` as primary Phase 1 report storage:**

✅ Pros:
- Properly normalized (one-to-many with versions)
- Supports multiple assessment iterations
- Clean separation from prospect pipeline

⚠️ Keep `prospects.report_html` for backward compatibility and quick access

---

## 🔐 Permission Updates

### RLS Policies to Add

```sql
-- Customers can view their own Phase 1 assessments
CREATE POLICY "Customers can view own assessments"
ON assessments FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM customers
        WHERE organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    )
);

-- Customers can view their dimension analyses
CREATE POLICY "Customers can view own dimension analyses"
ON dimension_analyses FOR SELECT
TO authenticated
USING (
    assessment_id IN (
        SELECT phase1_assessment_id FROM customers
        WHERE organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    )
);
```

---

## 🧪 Testing Checklist

### Pre-Conversion Tests

- [ ] Prospect without report → Conversion should FAIL
- [ ] Prospect with `status='pending'` → Conversion should FAIL
- [ ] Prospect with `report_html=NULL` → Conversion should FAIL
- [ ] Qualified prospect with completed report → Conversion should SUCCEED

### Post-Conversion Tests

- [ ] Customer record created with correct FKs
- [ ] Organization `org_type` updated to 'customer'
- [ ] Phase 1 report accessible via customer record
- [ ] All dimension analyses linked correctly
- [ ] Company profile accessible
- [ ] Prospect record still exists (audit trail)
- [ ] Customer can view their own Phase 1 data
- [ ] Admin can view customer in new /admin/customers page

### Edge Cases

- [ ] Convert same prospect twice → Should fail (UNIQUE constraint)
- [ ] Convert prospect from different org → Organization properly updated
- [ ] Customer with multiple users → All users see customer data

---

## 📈 Migration Plan (If Existing Data)

If there are existing "customers" that need to be migrated:

```sql
-- Backfill customers table from existing qualified prospects with reports
INSERT INTO customers (
    prospect_id,
    organization_id,
    contract_signed_at,
    contract_type,
    billing_contact_email,
    billing_contact_name,
    phase1_assessment_id,
    status,
    phase,
    notes
)
SELECT
    p.id,
    p.organization_id,
    p.qualified_at, -- Use qualification date as proxy
    'phase1_only',
    p.contact_email,
    p.contact_name,
    (SELECT id FROM assessments WHERE organization_id = p.organization_id LIMIT 1),
    'active',
    'phase1_delivered',
    'Migrated from existing prospect'
FROM prospects p
WHERE p.status = 'completed'
  AND p.report_html IS NOT NULL
  AND p.organization_id IS NOT NULL
  -- AND some manual flag indicating they are customers
ON CONFLICT (prospect_id) DO NOTHING;
```

---

## 🚀 Deployment Order

1. **Database Migration**
   Run `20260221_create_customers_table.sql`

2. **API Endpoint**
   Deploy `/api/admin/convert-to-customer`

3. **UI Components**
   Deploy `ConvertToCustomerButton` component

4. **Admin Pages**
   Update Qualified page, create Customers page

5. **Testing**
   Verify conversion flow end-to-end

6. **Documentation**
   Update admin docs with conversion process

---

## 🎯 Success Criteria

- ✅ Prospects can only become customers if Phase 1 report exists
- ✅ Customer record properly links to prospect, org, and assessment
- ✅ Phase 1 reports fully accessible for Phase 2 work
- ✅ Admin UI provides clear conversion workflow
- ✅ No data loss during conversion
- ✅ Audit trail maintained (prospect record preserved)

---

## 📝 Notes & Considerations

### Future Enhancements

1. **Customer Lifecycle**
   - Add churn tracking
   - Renewal management
   - Expansion opportunities

2. **Phase 2 Workflow**
   - Deep-dive assessment initiation
   - Interview scheduling
   - Custom playbook creation

3. **Reporting & Analytics**
   - Conversion rate tracking (prospect → customer)
   - Time-to-conversion metrics
   - Phase 1 report quality vs. conversion correlation

### Questions for Review

1. **Contract Storage:** Should we store contract PDF in Supabase Storage?
2. **Billing Integration:** Do we need Stripe customer ID link?
3. **Multi-User Access:** Should all org users automatically get customer access?
4. **Prospect Cleanup:** Should old prospects (non-converted) be archived after X months?

---

## 🔄 Alternative Considered: Single Table with Status

**Not Recommended** because:
- ❌ Mixing leads and customers in one table creates confusion
- ❌ Harder to optimize queries (prospects table would grow indefinitely)
- ❌ Less clear separation for Phase 2 features
- ❌ Difficult to add customer-specific fields without bloating prospects

---

**END OF PLAN**

---

**Next Steps:**
1. Review this plan
2. Discuss any questions or concerns
3. Approve database schema approach
4. Begin implementation (Step 1: Migration)
