import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const supabase = supabaseAdmin

    try {
        const { question_id, assessment_id, answer_text, answer_json, answered_by } = await request.json()

        if (!question_id || !assessment_id) {
            return NextResponse.json({ error: 'question_id and assessment_id required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('discovery_answers')
            .upsert(
                {
                    discovery_question_id: question_id,
                    assessment_id,
                    answer_text: answer_text ?? null,
                    answer_json: answer_json ?? null,
                    answered_by: answered_by || 'admin',
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'discovery_question_id' }
            )
            .select('updated_at')
            .single()

        if (error) {
            console.error('Save answer error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, saved_at: data.updated_at })
    } catch (error: any) {
        console.error('Save answer error:', error)
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
    }
}
