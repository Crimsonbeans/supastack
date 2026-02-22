'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import RequirementsForm from '@/components/admin/RequirementsForm'

interface CustomerRequirementsClientProps {
    questions: any[]
    documents: any[]
    assessmentId: string
    formStatus: string
    submittedAt: string | null
}

export default function CustomerRequirementsClient({
    questions,
    documents,
    assessmentId,
    formStatus: initialFormStatus,
    submittedAt: initialSubmittedAt,
}: CustomerRequirementsClientProps) {
    const [formStatus, setFormStatus] = useState(initialFormStatus)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (submitting) return
        setSubmitting(true)

        try {
            const res = await fetch('/api/customer/submit-requirements', {
                method: 'POST',
            })
            const data = await res.json()

            if (res.ok) {
                setFormStatus('completed')
                toast.success('Requirements submitted successfully!')
            } else {
                toast.error(data.error || 'Failed to submit')
            }
        } catch {
            toast.error('Failed to submit requirements')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col -m-4 md:-m-8">
            <RequirementsForm
                questions={questions}
                documents={documents}
                assessmentId={assessmentId}
                mode="customer"
                formStatus={formStatus as any}
                readOnly={formStatus === 'completed'}
                onSubmit={handleSubmit}
            />
        </div>
    )
}
