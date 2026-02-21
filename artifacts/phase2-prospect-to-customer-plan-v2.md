# Phase 2: Prospect to Customer Conversion Plan (v2 - REVISED)

**Created:** 2026-02-21
**Updated:** 2026-02-21 (v2 - FINAL)
**Status:** ✅ Approved - Ready for Implementation
**Project:** DVYglwqlfMJuM9zT

---

## 📝 Changelog from v1

### Requirements Updates (Based on User Feedback)

1. ✅ **Report Source:** Use `prospects.report_html` as primary source (keep it simple)
2. ✅ **Prospect Status:** Add `status='converted_to_customer'` + lock record
3. ✅ **Multi-User Conversion:** Modal shows all org prospects with checkboxes for batch conversion
4. ✅ **Customer Portal:** Same as user panel + Phase 2 sections (no separate portal)
5. ✅ **Contract/Billing:** NO PDF storage, NO Stripe integration (handled offline)
6. ✅ **Archival:** NO automatic archival (admin deletes manually)

---

## 🎯 Objective

Convert qualified prospects (with completed Phase 1 reports) into customers after offline contract signing, with support for **bulk organization-level conversion**, while retaining all Phase 1 data and locking prospect records.

---

## 🚨 Critical Business Rules (UPDATED)

### Hard Requirements

1. **Report Prerequisite** ✅
   - A prospect can ONLY be converted to customer if they have a completed Phase 1 report
   - Check: `prospects.status = 'completed'`
   - Check: `prospects.report_html IS NOT NULL`

2. **Data Retention** ✅
   - Phase 1 reports remain in `prospects.report_html` and `prospects.report_html_public`
   - All dimension analyses retained in `dimension_analyses`
   - Company profiles retained in `company_profiles`

3. **Prospect Locking** 🆕
   - After conversion, prospect `status` → `'converted_to_customer'`
   - Prospect record CANNOT be deleted unless customer record is deleted first (FK constraint)
   - Converted prospects NOT shown in admin /prospects, /qualified, or /inquiries pages

4. **Multi-Prospect Conversion** 🆕
   - When converting one prospect, show ALL prospects from same organization
   - Admin selects which prospects to convert (checkboxes)
   - All selected prospects → customers with same contract details
   - Each prospect gets individual customer record (one-to-one relationship)

5. **Customer Portal Access** 🆕
   - Customer portal = existing user portal + Phase 2 sections
   - All users from converted prospects get access to:
     - Phase 1 report (from their org's prospect record)
     - Phase 2 features (new sections)
   - NO separate customer portal needed

---

## 📊 Database Schema Changes

### 1. Update `prospects` Table

```sql
-- Add new status value for converted prospects
-- No schema change needed - just use existing 'status' column

-- Existing statuses:
-- 'pending', 'processing', 'completed', 'new_inquiry'

-- New status:
-- 'converted_to_customer' (set when prospect becomes customer)
```

### 2. New `customers` Table

```sql
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    converted_at TIMESTAMPTZ DEFAULT NOW(),

    -- One-to-one relationship with prospect (UNIQUE constraint)
    prospect_id UUID REFERENCES prospects(id) ON DELETE RESTRICT NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,

    -- Contract information (same for all prospects converted together)
    contract_signed_at TIMESTAMPTZ NOT NULL,
    contract_type TEXT, -- 'phase1_only', 'phase1_and_phase2', 'enterprise'

    -- Account management
    account_manager TEXT,

    -- Customer status
    status TEXT DEFAULT 'active', -- 'active', 'churned', 'paused'

    -- Phase tracking
    phase TEXT DEFAULT 'phase1_delivered',
    -- Values: 'phase1_delivered', 'phase2_in_progress', 'phase2_delivered'

    -- Metadata
    notes TEXT,
    tags TEXT[],

    -- Conversion batch tracking (all prospects converted together share this)
    conversion_batch_id UUID,

    -- Constraints
    CONSTRAINT customers_unique_prospect UNIQUE(prospect_id),
    CONSTRAINT customers_valid_status CHECK (status IN ('active', 'churned', 'paused')),
    CONSTRAINT customers_valid_phase CHECK (phase IN (
        'phase1_delivered',
        'phase2_in_progress',
        'phase2_delivered'
    ))
);

-- Indexes
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_phase ON customers(phase);
CREATE INDEX idx_customers_prospect ON customers(prospect_id);
CREATE INDEX idx_customers_conversion_batch ON customers(conversion_batch_id);

-- RLS Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on customers"
ON customers FOR ALL
TO authenticated
USING (true);

-- Customers can view their own organization's customer records
CREATE POLICY "Customers can view own org data"
ON customers FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
);
```

**Key Points:**
- `ON DELETE RESTRICT` prevents deleting prospect if customer exists (locks it)
- `prospect_id` is UNIQUE - one customer per prospect
- `conversion_batch_id` groups prospects converted together
- Simple schema - no Stripe, no contract PDFs

---

## 🔄 Conversion Workflow (UPDATED)

### Process Flow

```
Admin clicks "Convert to Customer" on Prospect A
    ↓
1. Validate Prerequisites
    - Check prospect.status = 'completed'
    - Check prospect.report_html IS NOT NULL
    ↓
2. Fetch All Org Prospects
    - Query prospects by organization_id
    - Exclude already converted (status != 'converted_to_customer')
    ↓
3. Show Conversion Modal
    ┌─────────────────────────────────────────┐
    │ Convert Acme Inc to Customer            │
    │                                         │
    │ Selected Prospect:                      │
    │ ☑ John Doe (john@acme.com)             │
    │                                         │
    │ Other Acme Inc prospects:               │
    │ ☐ Jane Smith (jane@acme.com)           │
    │ ☐ Bob Wilson (bob@acme.com)            │
    │                                         │
    │ Contract Details:                       │
    │ - Signed Date: [date picker]            │
    │ - Type: [Phase 1 Only ▼]               │
    │ - Account Manager: [text]               │
    │ - Notes: [textarea]                     │
    │                                         │
    │ [Cancel] [Convert Selected to Customer] │
    └─────────────────────────────────────────┘
    ↓
4. User Selects Prospects + Fills Contract Details
    ↓
5. Backend Process (Transactional)
    - Generate conversion_batch_id
    - For each selected prospect:
        a. Create customer record
        b. Update prospect.status = 'converted_to_customer'
        c. Link customer.conversion_batch_id
    - Update organization.org_type = 'customer'
    ↓
6. Success Response
    ↓
Customers Created ✅
Prospects Locked ✅
Admin Dashboard Refreshed ✅
```

---

## 🛠️ Implementation Steps

### Step 1: Database Migration

**File:** `supabase/migrations/20260221_create_customers_table_v2.sql`

```sql
-- =====================================================
-- PHASE 2: Create Customers Table (v2 - Multi-Prospect)
-- =====================================================

-- 1. Create customers table
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    converted_at TIMESTAMPTZ DEFAULT NOW(),

    -- One-to-one with prospect (ON DELETE RESTRICT locks prospect)
    prospect_id UUID REFERENCES prospects(id) ON DELETE RESTRICT NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,

    -- Contract info
    contract_signed_at TIMESTAMPTZ NOT NULL,
    contract_type TEXT,
    account_manager TEXT,

    -- Status
    status TEXT DEFAULT 'active',
    phase TEXT DEFAULT 'phase1_delivered',

    -- Metadata
    notes TEXT,
    tags TEXT[],

    -- Batch tracking (prospects converted together)
    conversion_batch_id UUID,

    -- Constraints
    CONSTRAINT customers_unique_prospect UNIQUE(prospect_id),
    CONSTRAINT customers_valid_status CHECK (status IN ('active', 'churned', 'paused')),
    CONSTRAINT customers_valid_phase CHECK (phase IN (
        'phase1_delivered',
        'phase2_in_progress',
        'phase2_delivered'
    ))
);

-- 2. Indexes
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_phase ON customers(phase);
CREATE INDEX idx_customers_prospect ON customers(prospect_id);
CREATE INDEX idx_customers_conversion_batch ON customers(conversion_batch_id);

-- 3. RLS Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on customers"
ON customers FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Customers can view own org data"
ON customers FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
);

-- 4. Add comment for documentation
COMMENT ON TABLE customers IS 'Customer records - one per converted prospect. Linked prospect cannot be deleted (ON DELETE RESTRICT).';
COMMENT ON COLUMN customers.conversion_batch_id IS 'Groups prospects converted together in the same admin action';
COMMENT ON COLUMN customers.prospect_id IS 'One-to-one with prospects. ON DELETE RESTRICT prevents prospect deletion.';
```

---

### Step 2: API Endpoint (Multi-Prospect Conversion)

**File:** `src/app/api/admin/convert-to-customer/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

interface ConvertToCustomerRequest {
    prospect_ids: string[] // Array of prospect IDs to convert
    contract_details: {
        signed_at: string
        type: string
        account_manager?: string
        notes?: string
    }
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    try {
        const { prospect_ids, contract_details } = await request.json() as ConvertToCustomerRequest

        if (!prospect_ids || prospect_ids.length === 0) {
            return NextResponse.json(
                { error: 'No prospects selected for conversion' },
                { status: 400 }
            )
        }

        // 1. Validate all prospects can be converted
        const { data: prospects, error: prospectError } = await supabase
            .from('prospects')
            .select('id, status, organization_id, company_name, report_html')
            .in('id', prospect_ids)

        if (prospectError || !prospects || prospects.length !== prospect_ids.length) {
            return NextResponse.json(
                { error: 'Failed to fetch all selected prospects' },
                { status: 404 }
            )
        }

        // 2. Validate: All must have completed Phase 1 reports
        const invalidProspects = prospects.filter(
            p => p.status !== 'completed' || !p.report_html
        )

        if (invalidProspects.length > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot convert prospects without completed Phase 1 reports',
                    invalid_prospects: invalidProspects.map(p => ({
                        id: p.id,
                        company: p.company_name,
                        status: p.status,
                        has_report: !!p.report_html
                    }))
                },
                { status: 400 }
            )
        }

        // 3. Validate: All from same organization
        const orgIds = new Set(prospects.map(p => p.organization_id))
        if (orgIds.size !== 1) {
            return NextResponse.json(
                { error: 'All selected prospects must be from the same organization' },
                { status: 400 }
            )
        }

        const organizationId = prospects[0].organization_id
        const conversionBatchId = randomUUID()

        // 4. Create customer records for each prospect (transaction)
        const customerRecords = prospects.map(prospect => ({
            prospect_id: prospect.id,
            organization_id: organizationId,
            contract_signed_at: contract_details.signed_at || new Date().toISOString(),
            contract_type: contract_details.type || 'phase1_only',
            account_manager: contract_details.account_manager || null,
            notes: contract_details.notes || null,
            conversion_batch_id: conversionBatchId,
            status: 'active',
            phase: 'phase1_delivered'
        }))

        const { data: customers, error: customerError } = await supabase
            .from('customers')
            .insert(customerRecords)
            .select()

        if (customerError) {
            console.error('Customer creation failed:', customerError)
            return NextResponse.json(
                { error: 'Failed to create customer records', details: customerError },
                { status: 500 }
            )
        }

        // 5. Update prospect statuses to 'converted_to_customer'
        const { error: updateError } = await supabase
            .from('prospects')
            .update({ status: 'converted_to_customer' })
            .in('id', prospect_ids)

        if (updateError) {
            console.error('Prospect status update failed:', updateError)
            // Note: Customers already created - this is a partial failure
            // Consider rollback or manual cleanup
            return NextResponse.json(
                {
                    error: 'Customers created but prospect status update failed',
                    details: updateError,
                    customers_created: customers.length
                },
                { status: 500 }
            )
        }

        // 6. Update organization type to 'customer'
        await supabase
            .from('organizations')
            .update({ org_type: 'customer' })
            .eq('id', organizationId)

        return NextResponse.json({
            success: true,
            customers_created: customers.length,
            conversion_batch_id: conversionBatchId,
            organization_id: organizationId,
            message: `${customers.length} prospect(s) converted to customers`
        })

    } catch (error: any) {
        console.error('Conversion error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
```

---

### Step 3: Fetch Org Prospects Endpoint

**File:** `src/app/api/admin/get-org-prospects/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
        return NextResponse.json(
            { error: 'organization_id required' },
            { status: 400 }
        )
    }

    // Fetch all prospects from this org that aren't already converted
    const { data: prospects, error } = await supabase
        .from('prospects')
        .select('id, company_name, contact_name, contact_email, status, report_html, qualified_at')
        .eq('organization_id', organizationId)
        .neq('status', 'converted_to_customer')
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json(
            { error: 'Failed to fetch organization prospects', details: error },
            { status: 500 }
        )
    }

    return NextResponse.json({
        organization_id: organizationId,
        prospects: prospects || [],
        count: prospects?.length || 0
    })
}
```

---

### Step 4: Admin UI Component - Multi-Prospect Conversion Modal

**File:** `src/components/admin/ConvertToCustomerButton.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, AlertCircle, Users } from 'lucide-react'

interface Prospect {
    id: string
    company_name: string
    contact_name: string
    contact_email: string
    status: string
    report_html: string | null
    qualified_at: string | null
}

interface ConvertToCustomerButtonProps {
    prospect: Prospect
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
                <MultiProspectConversionDialog
                    initialProspect={prospect}
                    onClose={() => setShowDialog(false)}
                    onSuccess={onSuccess}
                />
            )}
        </>
    )
}

// Multi-prospect conversion dialog
function MultiProspectConversionDialog({
    initialProspect,
    onClose,
    onSuccess
}: {
    initialProspect: Prospect
    onClose: () => void
    onSuccess?: () => void
}) {
    const [orgProspects, setOrgProspects] = useState<Prospect[]>([])
    const [selectedProspectIds, setSelectedProspectIds] = useState<Set<string>>(
        new Set([initialProspect.id])
    )
    const [loadingProspects, setLoadingProspects] = useState(true)
    const [converting, setConverting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        signed_at: new Date().toISOString().split('T')[0],
        type: 'phase1_only',
        account_manager: '',
        notes: ''
    })

    // Fetch all prospects from same organization
    useEffect(() => {
        async function fetchOrgProspects() {
            try {
                // Get org ID from initial prospect
                const response = await fetch(`/api/admin/get-org-prospects?organization_id=${initialProspect.organization_id}`)
                const data = await response.json()

                if (response.ok) {
                    setOrgProspects(data.prospects || [])
                } else {
                    setError('Failed to load organization prospects')
                }
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoadingProspects(false)
            }
        }

        fetchOrgProspects()
    }, [initialProspect.id])

    const toggleProspect = (prospectId: string) => {
        const newSet = new Set(selectedProspectIds)
        if (newSet.has(prospectId)) {
            newSet.delete(prospectId)
        } else {
            newSet.add(prospectId)
        }
        setSelectedProspectIds(newSet)
    }

    const handleConvert = async () => {
        if (selectedProspectIds.size === 0) {
            setError('Please select at least one prospect to convert')
            return
        }

        setConverting(true)
        setError(null)

        try {
            const response = await fetch('/api/admin/convert-to-customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prospect_ids: Array.from(selectedProspectIds),
                    contract_details: formData
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Conversion failed')
            }

            onClose()
            onSuccess?.()

        } catch (err: any) {
            setError(err.message)
        } finally {
            setConverting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
                <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-xl font-bold">Convert {initialProspect.company_name} to Customer</h3>
                </div>

                {/* Organization Prospects Selection */}
                <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm text-slate-700">
                        Select Prospects to Convert ({orgProspects.length} found)
                    </h4>

                    {loadingProspects ? (
                        <div className="flex items-center gap-2 text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading organization prospects...</span>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {orgProspects.map(p => {
                                const canConvert = p.status === 'completed' && p.report_html
                                const isSelected = selectedProspectIds.has(p.id)
                                const isInitial = p.id === initialProspect.id

                                return (
                                    <label
                                        key={p.id}
                                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                            isSelected ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-slate-50'
                                        } ${!canConvert ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleProspect(p.id)}
                                            disabled={!canConvert}
                                            className="w-4 h-4 text-indigo-600"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">
                                                    {p.contact_name || 'Unknown'}
                                                </span>
                                                {isInitial && (
                                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                                        Selected
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-500">{p.contact_email}</span>
                                            {!canConvert && (
                                                <span className="text-xs text-red-500 block">
                                                    No Phase 1 report
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    )}

                    <div className="text-xs text-slate-500 pt-2 border-t">
                        {selectedProspectIds.size} prospect(s) selected for conversion
                    </div>
                </div>

                {/* Contract Details */}
                <div className="space-y-3 border-t pt-4">
                    <h4 className="font-medium text-sm text-slate-700">Contract Details</h4>

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
                            <option value="phase1_and_phase2">Phase 1 + Phase 2</option>
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
                        onClick={handleConvert}
                        disabled={converting || selectedProspectIds.size === 0}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {converting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Converting {selectedProspectIds.size} prospect(s)...
                            </>
                        ) : (
                            `Convert ${selectedProspectIds.size} to Customer${selectedProspectIds.size > 1 ? 's' : ''}`
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={converting}
                        className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg font-medium"
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

### Step 5: Update Admin Queries (Exclude Converted Prospects)

**File:** `src/app/admin/leads/qualified/page.tsx`

```typescript
// Add filter to exclude converted prospects
const { data: prospects, error } = await supabase
    .from('prospects')
    .select('*')
    .not('qualified_at', 'is', null)
    .neq('status', 'converted_to_customer') // ← NEW: Exclude converted
    .order('qualified_at', { ascending: false })
```

**File:** `src/app/admin/leads/prospects/page.tsx`

```typescript
// Add filter to exclude converted prospects
const { data: prospects, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('source', 'outbound')
    .is('qualified_at', null)
    .neq('status', 'converted_to_customer') // ← NEW: Exclude converted
    .order('created_at', { ascending: false })
```

**File:** `src/app/admin/leads/inquiries/page.tsx`

```typescript
// Add filter to exclude converted prospects
const { data: prospects, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('source', 'inbound')
    .eq('status', 'new_inquiry')
    .neq('status', 'converted_to_customer') // ← NEW: Exclude converted
    .order('created_at', { ascending: false })
```

---

### Step 6: New Customers Admin Page

**File:** `src/app/admin/customers/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server'
import CustomersTable from '@/components/admin/CustomersTable'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
    const supabase = await createClient()

    const { data: customers, error } = await supabase
        .from('customers')
        .select(`
            *,
            organization:organizations(id, name, domain),
            prospect:prospects(
                id,
                company_name,
                contact_name,
                contact_email,
                report_html,
                report_html_public,
                created_at
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching customers:', error)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Customers</h1>
                    <p className="text-slate-500 text-sm">
                        Converted prospects with active contracts
                    </p>
                </div>
                <div className="text-sm text-slate-500">
                    {customers?.length || 0} total customers
                </div>
            </div>

            <CustomersTable customers={customers || []} />
        </div>
    )
}
```

**File:** `src/components/admin/CustomersTable.tsx`

```typescript
'use client'

import { useState } from 'react'
import { ExternalLink, Calendar, User, Tag } from 'lucide-react'
import Link from 'next/link'

export default function CustomersTable({ customers }: { customers: any[] }) {
    const [filter, setFilter] = useState<'all' | 'active' | 'churned'>('active')

    const filtered = customers.filter(c => {
        if (filter === 'all') return true
        return c.status === filter
    })

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('active')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        filter === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    Active ({customers.filter(c => c.status === 'active').length})
                </button>
                <button
                    onClick={() => setFilter('churned')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        filter === 'churned'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    Churned ({customers.filter(c => c.status === 'churned').length})
                </button>
                <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        filter === 'all'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    All ({customers.length})
                </button>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="text-left p-3 text-xs font-medium text-slate-600">Company</th>
                            <th className="text-left p-3 text-xs font-medium text-slate-600">Contact</th>
                            <th className="text-left p-3 text-xs font-medium text-slate-600">Contract</th>
                            <th className="text-left p-3 text-xs font-medium text-slate-600">Phase</th>
                            <th className="text-left p-3 text-xs font-medium text-slate-600">Account Mgr</th>
                            <th className="text-left p-3 text-xs font-medium text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(customer => (
                            <tr key={customer.id} className="border-b hover:bg-slate-50">
                                <td className="p-3">
                                    <div>
                                        <div className="font-medium text-sm">
                                            {customer.organization?.name || customer.prospect?.company_name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {customer.organization?.domain}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="text-sm">{customer.prospect?.contact_name}</div>
                                    <div className="text-xs text-slate-500">{customer.prospect?.contact_email}</div>
                                </td>
                                <td className="p-3">
                                    <div className="text-xs">
                                        <div className="flex items-center gap-1 text-slate-600">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(customer.contract_signed_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-slate-500 mt-0.5">
                                            {customer.contract_type?.replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        customer.phase === 'phase2_delivered'
                                            ? 'bg-green-100 text-green-700'
                                            : customer.phase === 'phase2_in_progress'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-indigo-100 text-indigo-700'
                                    }`}>
                                        {customer.phase.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-slate-600">
                                    {customer.account_manager || '—'}
                                </td>
                                <td className="p-3">
                                    <Link
                                        href={`/admin/customers/${customer.id}`}
                                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        View <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
```

---

### Step 7: Customer Portal (Enhanced User Dashboard)

**No new portal needed** - enhance existing user dashboard at `/dashboard`

**File:** `src/app/dashboard/layout.tsx` (Add Phase 2 navigation)

```typescript
// Add Phase 2 sections to navigation
const navigation = [
    { name: 'Phase 1 Report', href: '/dashboard/report', icon: FileText },
    // NEW Phase 2 sections
    { name: 'Phase 2 Assessment', href: '/dashboard/phase2', icon: Layers },
    { name: 'Documents', href: '/dashboard/documents', icon: Upload },
    { name: 'Insights', href: '/dashboard/insights', icon: TrendingUp },
]

// Show Phase 2 sections only if user's org has customer record with phase2 access
// Check: SELECT phase FROM customers WHERE organization_id = user.organization_id
```

**File:** `src/app/dashboard/report/page.tsx` (No changes needed)

```typescript
// This already shows Phase 1 report from prospects.report_html
// Works for both prospects and customers (via organization_id link)
```

---

## 📊 Phase 1 Report Access (Post-Conversion)

### Current Flow (Works for Both Prospects and Customers)

```typescript
// File: src/app/dashboard/report/page.tsx

// User logs in → auth.uid() → public.users → organization_id
// Query prospects table for Phase 1 report:

const { data: prospect } = await supabase
    .from('prospects')
    .select('report_html, report_html_public')
    .eq('organization_id', userOrgId)
    .single()

// Returns Phase 1 report regardless of prospect.status
// Works for 'completed' prospects AND 'converted_to_customer' prospects
```

**No changes needed** - existing dashboard code will work for customers too!

---

## 🧪 Testing Checklist

### Pre-Conversion Tests

- [ ] Prospect without report → Conversion blocked
- [ ] Prospect with `status='pending'` → Conversion blocked
- [ ] Prospect with `report_html=NULL` → Conversion blocked
- [ ] Qualified prospect with completed report → Conversion allowed

### Multi-Prospect Conversion Tests

- [ ] Modal shows all org prospects (excluding already converted)
- [ ] Can select multiple prospects with checkboxes
- [ ] Cannot select prospects without Phase 1 reports (disabled)
- [ ] All selected prospects converted in single batch
- [ ] `conversion_batch_id` same for all in batch

### Post-Conversion Tests

- [ ] Customer records created with correct FKs
- [ ] Prospect `status` updated to `'converted_to_customer'`
- [ ] Organization `org_type` updated to `'customer'`
- [ ] Converted prospects NOT shown in /admin/leads/* pages
- [ ] Converted prospects shown in /admin/customers page
- [ ] Phase 1 report accessible in user dashboard
- [ ] User can still see Phase 1 report after conversion

### Locking Tests

- [ ] Attempt to delete prospect → Blocked by FK constraint
- [ ] Attempt to delete organization with customers → Blocked (if implemented)
- [ ] Delete customer → Now can delete prospect

### Edge Cases

- [ ] Convert all prospects from org → All shown in modal
- [ ] Convert single prospect → Other prospects still available for later conversion
- [ ] User from converted prospect logs in → Sees Phase 1 report
- [ ] Multiple users from same org → All see same Phase 1 report

---

## 📈 Migration Plan (If Existing Data)

If there are existing customers that need backfilling:

```sql
-- Manual backfill script (run with admin access)
-- This is for any prospects already marked as customers in some way

INSERT INTO customers (
    prospect_id,
    organization_id,
    contract_signed_at,
    contract_type,
    status,
    phase,
    notes,
    conversion_batch_id
)
SELECT
    p.id,
    p.organization_id,
    p.qualified_at, -- Use qualification date as proxy
    'phase1_only',
    'active',
    'phase1_delivered',
    'Migrated from existing data',
    gen_random_uuid() -- Each gets unique batch ID
FROM prospects p
WHERE p.status = 'completed'
  AND p.report_html IS NOT NULL
  AND p.organization_id IS NOT NULL
  -- Add additional filter here for identifying existing "customers"
ON CONFLICT (prospect_id) DO NOTHING;

-- Update prospect statuses
UPDATE prospects
SET status = 'converted_to_customer'
WHERE id IN (SELECT prospect_id FROM customers);

-- Update organization types
UPDATE organizations
SET org_type = 'customer'
WHERE id IN (SELECT DISTINCT organization_id FROM customers);
```

---

## 🚀 Deployment Order

1. **Database Migration**
   - Run `20260221_create_customers_table_v2.sql`

2. **API Endpoints**
   - Deploy `/api/admin/convert-to-customer`
   - Deploy `/api/admin/get-org-prospects`

3. **UI Components**
   - Deploy `ConvertToCustomerButton` with multi-prospect modal
   - Deploy `CustomersTable`

4. **Admin Page Updates**
   - Update qualified/prospects/inquiries pages (exclude converted)
   - Create `/admin/customers` page

5. **User Dashboard Enhancement**
   - Add Phase 2 navigation (Phase 2 feature development)

6. **Testing**
   - Verify conversion flow end-to-end
   - Test multi-prospect selection
   - Verify locking mechanism

---

## 🎯 Success Criteria

- ✅ Prospects can only become customers if Phase 1 report exists
- ✅ Admin can convert multiple prospects from same org in one action
- ✅ Converted prospects locked (cannot delete unless customer deleted)
- ✅ Converted prospects hidden from admin lead tables
- ✅ Customers visible in dedicated /admin/customers page
- ✅ Users from converted prospects still see Phase 1 report in dashboard
- ✅ No data loss during conversion
- ✅ Audit trail maintained (prospect record preserved with status change)

---

## ✅ User Decisions (APPROVED)

### 1. Multi-Prospect Conversion ✅

**DECISION:** One customer record per prospect (Option A)

```
Acme Org
├── Prospect: john@acme.com → Customer Record 1
├── Prospect: jane@acme.com → Customer Record 2
└── Prospect: bob@acme.com  → Customer Record 3
```

Each prospect gets individual customer record for separate tracking.

---

### 2. Phase 1 Report Access ✅

**DECISION:** Same report prospect already sees in user panel

- Report source: `prospects.report_html` (org-level)
- All users from same org see same Phase 1 report
- No changes needed to existing dashboard code

---

### 3. Organization Deletion Lock ✅

**DECISION:** YES - Prevent org deletion if prospects OR customers exist

```sql
-- Add to organizations table
ALTER TABLE organizations ADD CONSTRAINT prevent_org_deletion
    CHECK (
        NOT EXISTS (
            SELECT 1 FROM prospects WHERE organization_id = organizations.id
        ) AND NOT EXISTS (
            SELECT 1 FROM customers WHERE organization_id = organizations.id
        )
    );
```

Organization locked if ANY prospects or customers exist.

---

### 4. Admin Visibility ✅

**DECISION:** YES - Create `/admin/customers` menu

- New menu item: "Customers"
- Shows all converted prospects as customer records
- Replaces need for separate `/admin/converted` view

---

**END OF PLAN v2**

---

**Next Steps:**
1. Review this updated plan
2. Answer open questions
3. Approve or request modifications
4. Begin implementation
