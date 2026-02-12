import { createClient } from '@supabase/supabase-js'

// process.env.SUPABASE_SERVICE_ROLE_KEY should only be used server-side!
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)
