-- Add source column to prospects if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'source') THEN
        ALTER TABLE prospects ADD COLUMN source TEXT DEFAULT 'outbound';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'organization_id') THEN
        ALTER TABLE prospects ADD COLUMN organization_id UUID;
    END IF;
END $$;

-- Ensure public.users table exists (mirroring auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT,
    full_name TEXT,
    avatar_url TEXT
);

-- Ensure public.users has organization_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'organization_id') THEN
        ALTER TABLE public.users ADD COLUMN organization_id UUID;
    END IF;
END $$;

-- Enable RLS on users if not enabled (idempotent)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy for users (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own data') THEN
        CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Admins full access on users') THEN
        CREATE POLICY "Admins full access on users" ON public.users FOR ALL TO authenticated USING (true); -- simplified for now
    END IF;
END $$;


-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
    user_domain TEXT;
    user_company_name TEXT;
    user_full_name TEXT;
BEGIN
    -- Extract domain: Check metadata first (from landing page scan), else fallback to email domain
    user_domain := NEW.raw_user_meta_data->>'company_domain';
    IF user_domain IS NULL OR user_domain = '' THEN
        user_domain := substring(NEW.email from '@(.*)$');
    END IF;
    
    -- Get company name from metadata if available, else use domain
    user_company_name := NEW.raw_user_meta_data->>'company_name';
    IF user_company_name IS NULL OR user_company_name = '' THEN
        user_company_name := user_domain;
    END IF;

    -- Get full name
    user_full_name := NEW.raw_user_meta_data->>'full_name';
    IF user_full_name IS NULL OR user_full_name = '' THEN
        user_full_name := 'Unknown';
    END IF;

    -- 1. Handle Organization (Find or Create)
    BEGIN
        SELECT id INTO org_id FROM public.organizations WHERE domain = user_domain LIMIT 1;
        
        IF org_id IS NULL THEN
            INSERT INTO public.organizations (name, domain, org_type)
            VALUES (user_company_name, user_domain, 'customer')
            RETURNING id INTO org_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Could not link organization: %', SQLERRM;
    END;

    -- 2. Create Public User Entry
    INSERT INTO public.users (id, email, full_name, organization_id)
    VALUES (NEW.id, NEW.email, user_full_name, org_id)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        organization_id = COALESCE(public.users.organization_id, EXCLUDED.organization_id);

    -- 3. Link Existing Prospect OR Create New Inquiry
    IF org_id IS NOT NULL THEN
        -- Check if prospect exists by domain
        IF EXISTS (SELECT 1 FROM public.prospects WHERE company_domain = user_domain) THEN
             -- Link existing (Outbound -> Qualified path)
             -- We keep source as is (likely 'outbound') to track origin
            UPDATE public.prospects 
            SET organization_id = org_id,
                contact_name = COALESCE(contact_name, user_full_name)
            WHERE company_domain = user_domain;
        ELSE
            -- Create new Inbound Inquiry (New Inquiry path)
            -- Status 'new_inquiry' indicates signed up but report not requested/generated yet
            INSERT INTO public.prospects (
                company_name, 
                company_domain, 
                webscan_type, 
                status, 
                source, 
                confidence_score,
                organization_id,
                contact_email,
                contact_name
            )
            VALUES (
                user_company_name, 
                user_domain, 
                'GTM AI Readiness', -- Default, can be updated on generation
                'new_inquiry',      -- SPECIAL STATUS
                'inbound', 
                0,
                org_id,
                NEW.email,
                user_full_name
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
