import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const ACCEPTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'image/png',
    'image/jpeg',
]

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200)
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const assessmentId = formData.get('assessment_id') as string | null
        const slotKey = formData.get('slot_key') as string | null
        const uploadedBy = (formData.get('uploaded_by') as string) || 'customer'

        if (!file || !assessmentId || !slotKey) {
            return NextResponse.json({ error: 'file, assessment_id, and slot_key are required' }, { status: 400 })
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File too large. Maximum size is 25MB.' }, { status: 400 })
        }

        // Validate file type
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'File type not allowed. Accepted: PDF, DOCX, XLSX, PPTX, CSV, PNG, JPG' }, { status: 400 })
        }

        // Auth check for customer uploads
        if (uploadedBy === 'customer') {
            const supabase = await createClient()
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            // Verify user's org owns this assessment
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

        // Build storage path
        const safeName = sanitizeFilename(file.name)
        const storagePath = `${assessmentId}/${slotKey}/${Date.now()}_${safeName}`

        // Upload to storage
        const buffer = Buffer.from(await file.arrayBuffer())
        const { error: uploadError } = await supabaseAdmin.storage
            .from('assessment-documents')
            .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: false,
            })

        if (uploadError) {
            console.error('Storage upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
        }

        // Insert DB record
        const documentRequestId = slotKey !== '__other__' ? slotKey : null
        const { data: upload, error: dbError } = await supabaseAdmin
            .from('document_uploads')
            .insert({
                assessment_id: assessmentId,
                document_request_id: documentRequestId,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                storage_path: storagePath,
                uploaded_by: uploadedBy,
                slot_key: slotKey,
            })
            .select('id, file_name, file_size, file_type, created_at, uploaded_by')
            .single()

        if (dbError) {
            // Rollback storage upload
            await supabaseAdmin.storage.from('assessment-documents').remove([storagePath])
            console.error('DB insert error:', dbError)
            return NextResponse.json({ error: 'Failed to save upload record' }, { status: 500 })
        }

        return NextResponse.json({ upload })
    } catch (error: any) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
    }
}
