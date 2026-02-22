import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
    try {
        const { upload_id, mode } = await request.json()

        if (!upload_id) {
            return NextResponse.json({ error: 'upload_id is required' }, { status: 400 })
        }

        // Fetch the upload record
        const { data: upload, error: fetchError } = await supabaseAdmin
            .from('document_uploads')
            .select('id, storage_path, assessment_id')
            .eq('id', upload_id)
            .single()

        if (fetchError || !upload) {
            return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
        }

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
                .eq('id', upload.assessment_id)
                .eq('organization_id', org.id)
                .single()

            if (!assessment) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 })
            }
        }

        // Delete from storage
        const { error: storageError } = await supabaseAdmin.storage
            .from('assessment-documents')
            .remove([upload.storage_path])

        if (storageError) {
            console.error('Storage delete error:', storageError)
        }

        // Delete from DB
        const { error: dbError } = await supabaseAdmin
            .from('document_uploads')
            .delete()
            .eq('id', upload_id)

        if (dbError) {
            console.error('DB delete error:', dbError)
            return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete document error:', error)
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
    }
}
