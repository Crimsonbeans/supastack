
-- Fix the handle_new_user function to use valid org_type 'customer'
-- Run this in your Supabase SQL Editor

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
            -- FIXED: Use 'customer' instead of 'client' to satisfy check constraint
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
             UPDATE public.prospects 
             SET organization_id = org_id,
                 contact_name = COALESCE(contact_name, user_full_name)
             WHERE company_domain = user_domain;
        ELSE
            -- Create new Inbound Inquiry (New Inquiry path)
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
                'GTM AI Readiness', 
                'new_inquiry',
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
