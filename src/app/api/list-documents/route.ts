import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const assessmentId = request.nextUrl.searchParams.get('assessment_id')
        if (!assessmentId) {
            return NextResponse.json({ error: 'assessment_id is required' }, { status: 400 })
        }

        const mode = request.nextUrl.searchParams.get('mode') || 'admin'

        // Auth check for customer
        if (mode === 'customer') {
            const supabase = await createClient()
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            const domain = user.user_metadata?.company_domain || user.email?.split('@')[1]
            const { data: org } = await supabaseAdmin.from('organizations').select('id').eq('domain', domain!).single()
            if (!org) {
                return NextResponse.json({ error: 'Organization not found' }, { status: 403 })
            }

            const { data: assessment } = await supabaseAdmin
                .from('assessments')
                .select('id')
                .eq('id', assessmentId)
                .eq('organization_id', org.id)
                .single()

            if (!assessment) {
                return NextResponse.json({ error: 'Assessment not found or access denied' }, { status: 403 })
            }
        }

        // Fetch all uploads for this assessment
        const { data: uploads, error } = await supabaseAdmin
            .from('document_uploads')
            .select('id, file_name, file_size, file_type, created_at, uploaded_by, slot_key, storage_path')
            .eq('assessment_id', assessmentId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('List documents error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Generate signed download URLs and group by slot_key
        const documents: Record<string, any[]> = {}

        for (const upload of uploads || []) {
            const { data: signedData } = await supabaseAdmin.storage
                .from('assessment-documents')
                .createSignedUrl(upload.storage_path, 3600) // 1hr expiry

            const doc = {
                id: upload.id,
                file_name: upload.file_name,
                file_size: upload.file_size,
                file_type: upload.file_type,
                created_at: upload.created_at,
                uploaded_by: upload.uploaded_by,
                download_url: signedData?.signedUrl || null,
            }

            if (!documents[upload.slot_key]) {
                documents[upload.slot_key] = []
            }
            documents[upload.slot_key].push(doc)
        }

        return NextResponse.json({ documents })
    } catch (error: any) {
        console.error('List documents error:', error)
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
    }
}
