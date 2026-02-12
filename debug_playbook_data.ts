
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ftsuggkqwnuu6irz.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is required')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugPlaybook() {
    console.log('Checking playbooks...')
    const { data: playbooks, error: pbError } = await supabase
        .from('playbooks')
        .select('*')
        .eq('slug', 'gtm_readiness')
        .eq('is_active', true)

    if (pbError) {
        console.error('Error fetching playbooks:', pbError)
    } else {
        console.log('Playbooks found:', playbooks)
        if (playbooks && playbooks.length > 0) {
            const playbookId = playbooks[0].id
            console.log('Checking versions for playbook:', playbookId)

            const { data: versions, error: vError } = await supabase
                .from('playbook_versions')
                .select('*')
                .eq('playbook_id', playbookId)
                .eq('status', 'active')

            if (vError) {
                console.error('Error fetching versions:', vError)
            } else {
                console.log('Versions found:', versions)
            }
        }
    }

    // Attempt to check constraint definition if possible (requires admin view usually)
    // We can try to test inserts to confirm the constraint behavior
    /*
    console.log('Testing constraint behavior...')
    try {
      const { error: insertError } = await supabase
        .from('assessments')
        .insert({
          organization_id: '56324088-929e-4a1c-8a79-49e368f7e6c5', # Existing org ID from context
          assessment_type: 'gtm_readiness',
          company_name: 'Test Constraint',
          // Both null
          playbook_version_id: null,
          playbook_variant_id: null
        })
      
      if (insertError) {
        console.log('Insert with both nulls failed as expected:', insertError.message)
      } else {
        console.log('Insert with both nulls SUCCEEDED (Unexpected)')
      }
    } catch (e) {
      console.error('Exception during test:', e)
    }
    */
}

debugPlaybook()
