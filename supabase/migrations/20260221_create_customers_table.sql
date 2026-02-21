-- =====================================================
-- PHASE 2: Prospect to Customer Conversion
-- Migration: Create Customers Table
-- Created: 2026-02-21
-- =====================================================

-- =========================
-- 1. CREATE CUSTOMERS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    converted_at TIMESTAMPTZ DEFAULT NOW(),

    -- One-to-one with prospect (ON DELETE RESTRICT locks prospect)
    prospect_id UUID REFERENCES prospects(id) ON DELETE RESTRICT NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,

    -- Contract information
    contract_signed_at TIMESTAMPTZ NOT NULL,
    contract_type TEXT,
    account_manager TEXT,

    -- Customer status
    status TEXT DEFAULT 'active',
    phase TEXT DEFAULT 'phase1_delivered',

    -- Metadata
    notes TEXT,
    tags TEXT[],

    -- Batch tracking (groups prospects converted together)
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

-- =========================
-- 2. CREATE INDEXES
-- =========================

CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_phase ON customers(phase);
CREATE INDEX IF NOT EXISTS idx_customers_prospect ON customers(prospect_id);
CREATE INDEX IF NOT EXISTS idx_customers_conversion_batch ON customers(conversion_batch_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- =========================
-- 3. ADD RLS POLICIES
-- =========================

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins full access on customers"
ON customers FOR ALL
TO authenticated
USING (true);

-- Customers can view their own organization's data
CREATE POLICY "Customers can view own org data"
ON customers FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
);

-- =========================
-- 4. ADD TABLE COMMENTS
-- =========================

COMMENT ON TABLE customers IS
'Customer records - one per converted prospect. Linked prospect cannot be deleted (ON DELETE RESTRICT).';

COMMENT ON COLUMN customers.prospect_id IS
'One-to-one with prospects. ON DELETE RESTRICT prevents prospect deletion while customer exists.';

COMMENT ON COLUMN customers.organization_id IS
'Links to organization. ON DELETE RESTRICT prevents org deletion while customers exist.';

COMMENT ON COLUMN customers.conversion_batch_id IS
'Groups prospects converted together in the same admin action. All prospects converted in one batch share this UUID.';

COMMENT ON COLUMN customers.status IS
'Customer status: active (default), churned, or paused';

COMMENT ON COLUMN customers.phase IS
'Current phase: phase1_delivered (default), phase2_in_progress, or phase2_delivered';

COMMENT ON COLUMN customers.contract_type IS
'Type of contract: phase1_only, phase1_and_phase2, or enterprise';

-- =========================
-- 5. LOCK ORGANIZATIONS
-- =========================

-- Prevent organization deletion if ANY prospects or customers exist
-- Note: This uses a trigger instead of CHECK constraint for better compatibility

CREATE OR REPLACE FUNCTION prevent_org_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM prospects WHERE organization_id = OLD.id
    ) THEN
        RAISE EXCEPTION 'Cannot delete organization: prospects still exist';
    END IF;

    IF EXISTS (
        SELECT 1 FROM customers WHERE organization_id = OLD.id
    ) THEN
        RAISE EXCEPTION 'Cannot delete organization: customers still exist';
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (idempotent)
DROP TRIGGER IF EXISTS prevent_org_deletion_trigger ON organizations;

-- Create trigger
CREATE TRIGGER prevent_org_deletion_trigger
BEFORE DELETE ON organizations
FOR EACH ROW
EXECUTE FUNCTION prevent_org_deletion();

-- =========================
-- MIGRATION COMPLETE
-- =========================

-- Verify table was created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'customers'
    ) THEN
        RAISE EXCEPTION 'Migration failed: customers table not created';
    END IF;

    RAISE NOTICE 'Migration completed successfully: customers table created';
END $$;
