'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CheckCircle, Loader2, AlertCircle, Upload, FileText, X, FolderOpen, ChevronLeft, ChevronRight, RefreshCw, Download, Lock } from 'lucide-react'
import { toast } from 'sonner'

// --- Types ---

interface UploadedDoc {
    id: string
    file_name: string
    file_size: number
    file_type: string
    created_at: string
    uploaded_by: string
    download_url?: string | null
}

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

interface Question {
    id: string
    dimension_key: string
    dimension_name: string
    question_text: string
    question_context: string | null
    answer_format: 'text' | 'number' | 'percentage' | 'yes_no' | 'select_one' | 'select_many' | 'scale_1_5'
    answer_options: string[] | null
    confidence_impact: 'high' | 'medium' | 'low'
    is_required: boolean
    display_order: number
    evidence_type: string | null
    answer: {
        answer_text: string | null
        answer_json: any
        updated_at: string
    } | null
}

interface DocumentRequest {
    id: string
    dimension_key: string
    dimension_name: string
    document_type: string
    document_description: string
    why_needed: string | null
    example_filenames: string | null
    accepted_formats: string | null
    confidence_impact: string
    is_required: boolean
    display_order: number
}

interface Dimension {
    key: string
    name: string
    questions: Question[]
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// Special tab key for documents
const DOCUMENTS_TAB = '__documents__'

interface RequirementsFormProps {
    questions: Question[]
    documents: DocumentRequest[]
    assessmentId: string
    mode?: 'admin' | 'customer'
    formStatus?: 'draft' | 'in_review' | 'completed'
    readOnly?: boolean
    onSubmit?: () => void
    approvalInfo?: { approved_at: string; approved_by: string } | null
    onApprove?: () => void
    onRefresh?: () => void
    editMode?: boolean
    onToggleEditMode?: () => void
}

// --- Main Component ---

export default function RequirementsForm({
    questions,
    documents,
    assessmentId,
    mode = 'admin',
    formStatus = 'draft',
    readOnly = false,
    onSubmit,
    approvalInfo = null,
    onApprove,
    onRefresh,
    editMode = false,
    onToggleEditMode,
}: RequirementsFormProps) {
    // Derive dimensions from questions (dynamic, not hardcoded)
    const dimensions: Dimension[] = []
    const seenKeys = new Set<string>()
    for (const q of questions) {
        if (!seenKeys.has(q.dimension_key)) {
            seenKeys.add(q.dimension_key)
            dimensions.push({
                key: q.dimension_key,
                name: q.dimension_name || q.dimension_key,
                questions: questions.filter(x => x.dimension_key === q.dimension_key),
            })
        }
    }

    const [activeTab, setActiveTab] = useState(dimensions[0]?.key || DOCUMENTS_TAB)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [jsonAnswers, setJsonAnswers] = useState<Record<string, any>>({})
    const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({})
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
    const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc[]>>({})
    const [uploading, setUploading] = useState<Record<string, boolean>>({})
    const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})
    const tabsRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    // Check tab overflow for scroll arrows
    const updateScrollArrows = useCallback(() => {
        const el = tabsRef.current
        if (!el) return
        setCanScrollLeft(el.scrollLeft > 2)
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
    }, [])

    useEffect(() => {
        updateScrollArrows()
        const el = tabsRef.current
        if (!el) return
        el.addEventListener('scroll', updateScrollArrows)
        const ro = new ResizeObserver(updateScrollArrows)
        ro.observe(el)
        return () => {
            el.removeEventListener('scroll', updateScrollArrows)
            ro.disconnect()
        }
    }, [updateScrollArrows])

    const scrollTabs = (direction: 'left' | 'right') => {
        const el = tabsRef.current
        if (!el) return
        el.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' })
    }

    // Initialize answers from pre-existing data
    useEffect(() => {
        const textAnswers: Record<string, string> = {}
        const jAnswers: Record<string, any> = {}
        const statuses: Record<string, SaveStatus> = {}
        for (const q of questions) {
            if (q.answer) {
                if (q.answer.answer_text != null) {
                    textAnswers[q.id] = q.answer.answer_text
                }
                if (q.answer.answer_json != null) {
                    jAnswers[q.id] = q.answer.answer_json
                }
                statuses[q.id] = 'saved'
            }
        }
        setAnswers(textAnswers)
        setJsonAnswers(jAnswers)
        setSaveStatus(statuses)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const saveAnswer = useCallback(async (questionId: string, answerText: string | null, answerJson: any) => {
        if (readOnly) return
        setSaveStatus(prev => ({ ...prev, [questionId]: 'saving' }))
        const saveUrl = mode === 'customer' ? '/api/customer/save-answer' : '/api/admin/save-answer'
        try {
            const res = await fetch(saveUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question_id: questionId,
                    assessment_id: assessmentId,
                    answer_text: answerText,
                    answer_json: answerJson,
                }),
            })
            const data = await res.json()
            if (res.ok) {
                setSaveStatus(prev => ({ ...prev, [questionId]: 'saved' }))
                setLastSavedAt(data.saved_at)
            } else {
                setSaveStatus(prev => ({ ...prev, [questionId]: 'error' }))
            }
        } catch {
            setSaveStatus(prev => ({ ...prev, [questionId]: 'error' }))
        }
    }, [assessmentId])

    const handleTextChange = (questionId: string, value: string) => {
        if (readOnly) return
        setAnswers(prev => ({ ...prev, [questionId]: value }))
        setSaveStatus(prev => ({ ...prev, [questionId]: 'idle' }))
        if (debounceTimers.current[questionId]) clearTimeout(debounceTimers.current[questionId])
        debounceTimers.current[questionId] = setTimeout(() => {
            saveAnswer(questionId, value, null)
        }, 1500)
    }

    const handleInstantSave = (questionId: string, answerText: string | null, answerJson: any) => {
        if (answerText !== null) setAnswers(prev => ({ ...prev, [questionId]: answerText }))
        if (answerJson !== undefined) setJsonAnswers(prev => ({ ...prev, [questionId]: answerJson }))
        saveAnswer(questionId, answerText, answerJson)
    }

    const handleSelectManyToggle = (questionId: string, option: string) => {
        const current: string[] = jsonAnswers[questionId] || []
        const updated = current.includes(option)
            ? current.filter(o => o !== option)
            : [...current, option]
        setJsonAnswers(prev => ({ ...prev, [questionId]: updated }))
        saveAnswer(questionId, null, updated)
    }

    // Load existing uploads on mount
    useEffect(() => {
        fetch(`/api/list-documents?assessment_id=${assessmentId}&mode=${mode}`)
            .then(res => res.json())
            .then(data => {
                if (data.documents) setUploadedDocs(data.documents)
            })
            .catch(() => {})
    }, [assessmentId, mode])

    // Upload file to server
    const handleFilesSelected = async (slotKey: string, files: FileList | null) => {
        if (!files || files.length === 0 || readOnly) return

        for (const file of Array.from(files)) {
            // Client-side validation
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`${file.name} is too large. Maximum size is 25MB.`)
                continue
            }
            if (!ACCEPTED_TYPES.includes(file.type)) {
                toast.error(`${file.name} is not an accepted file type.`)
                continue
            }

            setUploading(prev => ({ ...prev, [slotKey]: true }))

            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('assessment_id', assessmentId)
                formData.append('slot_key', slotKey)
                formData.append('uploaded_by', mode)

                const res = await fetch('/api/upload-document', { method: 'POST', body: formData })
                const data = await res.json()

                if (res.ok && data.upload) {
                    setUploadedDocs(prev => ({
                        ...prev,
                        [slotKey]: [...(prev[slotKey] || []), data.upload],
                    }))
                    toast.success(`${file.name} uploaded`)
                } else {
                    toast.error(data.error || 'Upload failed')
                }
            } catch {
                toast.error(`Failed to upload ${file.name}`)
            } finally {
                setUploading(prev => ({ ...prev, [slotKey]: false }))
            }
        }
    }

    // Delete file from server
    const handleRemoveFile = async (slotKey: string, uploadId: string) => {
        if (readOnly) return
        try {
            const res = await fetch('/api/delete-document', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ upload_id: uploadId, mode }),
            })
            if (res.ok) {
                setUploadedDocs(prev => ({
                    ...prev,
                    [slotKey]: (prev[slotKey] || []).filter(d => d.id !== uploadId),
                }))
                toast.success('File removed')
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to delete')
            }
        } catch {
            toast.error('Failed to delete file')
        }
    }

    // Global save status
    const allStatuses = Object.values(saveStatus)
    const isSaving = allStatuses.some(s => s === 'saving')
    const hasUnsaved = allStatuses.some(s => s === 'idle')
    const answeredCount = questions.filter(q => answers[q.id] || jsonAnswers[q.id]).length
    const requiredQuestions = questions.filter(q => q.is_required)
    const requiredAnsweredCount = requiredQuestions.filter(q => answers[q.id] || jsonAnswers[q.id]).length
    const allRequiredAnswered = requiredQuestions.length === 0 || requiredAnsweredCount === requiredQuestions.length

    const isDocumentsTab = activeTab === DOCUMENTS_TAB
    const activeQuestions = !isDocumentsTab ? (dimensions.find(d => d.key === activeTab)?.questions || []) : []
    const activeDimName = !isDocumentsTab ? (dimensions.find(d => d.key === activeTab)?.name || '') : 'Documents'
    const activeAnsweredCount = activeQuestions.filter(q => answers[q.id] || jsonAnswers[q.id]).length

    const formStatusLabel = formStatus === 'completed' ? 'Completed' : formStatus === 'in_review' ? 'In Review' : 'Draft'
    const formStatusColor = formStatus === 'completed' ? 'bg-green-50 text-green-700' : formStatus === 'in_review' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'

    return (
        <div className="flex flex-col h-full">
            {/* Approval banner (admin mode) */}
            {mode === 'admin' && approvalInfo && (
                <div className="shrink-0 bg-green-50 border-b border-green-100 px-6 py-2">
                    <div className="flex items-center justify-between max-w-3xl mx-auto">
                        <span className="flex items-center gap-1.5 text-[12px] text-green-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approved {approvalInfo.approved_by === 'auto' ? 'automatically' : 'manually'} on{' '}
                            {new Date(approvalInfo.approved_at).toLocaleDateString()}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${formStatusColor}`}>
                            {formStatusLabel}
                        </span>
                    </div>
                </div>
            )}

            {/* Submitted banner (read-only) */}
            {readOnly && formStatus === 'completed' && (
                <div className="shrink-0 bg-indigo-50 border-b border-indigo-100 px-6 py-2">
                    <div className="max-w-3xl mx-auto text-[12px] text-indigo-700 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Requirements submitted. This form is now read-only.
                    </div>
                </div>
            )}

            {/* Pre-approval read-only banner (admin mode, not yet approved) */}
            {mode === 'admin' && readOnly && !approvalInfo && (
                <div className="shrink-0 bg-amber-50 border-b border-amber-100 px-6 py-2">
                    <div className="max-w-3xl mx-auto text-[12px] text-amber-700 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Review-only mode. Approve the requirements first to enable editing.
                    </div>
                </div>
            )}

            {/* Post-approval edit mode off banner (admin mode, approved but edit mode disabled) */}
            {mode === 'admin' && readOnly && approvalInfo && !editMode && (
                <div className="shrink-0 bg-slate-50 border-b border-slate-100 px-6 py-2">
                    <div className="max-w-3xl mx-auto text-[12px] text-slate-500 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        View-only mode. Click &ldquo;Enable Edit&rdquo; above to make changes.
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="shrink-0 bg-white border-b border-slate-100 px-6 py-2.5">
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                    <h2 className="text-sm font-semibold text-slate-900">
                        Requirements Form
                        <span className="text-slate-400 font-normal ml-2">{answeredCount} of {questions.length} answered</span>
                    </h2>
                    <div className="flex items-center gap-2 text-[11px]">
                        {!readOnly && (
                            <>
                                {isSaving ? (
                                    <span className="flex items-center gap-1 text-slate-500">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                                    </span>
                                ) : hasUnsaved ? (
                                    <span className="text-amber-600">Unsaved changes</span>
                                ) : answeredCount > 0 ? (
                                    <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="w-3 h-3" /> All saved
                                    </span>
                                ) : null}
                                {lastSavedAt && !isSaving && (
                                    <span className="text-slate-400 ml-1">
                                        {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </>
                        )}
                        {/* Edit mode toggle (admin mode, after approval) */}
                        {mode === 'admin' && onToggleEditMode && (
                            <button
                                onClick={onToggleEditMode}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                                    editMode
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {editMode ? 'Editing' : 'Enable Edit'}
                            </button>
                        )}
                        {/* Refresh button (admin mode) */}
                        {mode === 'admin' && onRefresh && (
                            <button
                                onClick={onRefresh}
                                title="Refresh answers"
                                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {/* Form status badge (admin mode, always shown) */}
                        {mode === 'admin' && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${formStatusColor}`}>
                                {formStatusLabel}
                            </span>
                        )}
                        {/* Approve button (admin mode, not yet approved) */}
                        {mode === 'admin' && !approvalInfo && onApprove && (
                            <button
                                onClick={onApprove}
                                className="ml-2 px-3 py-1 bg-indigo-600 text-white text-[11px] font-medium rounded-md hover:bg-indigo-700 transition-colors cursor-pointer"
                            >
                                Approve Requirements
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Dimension Tabs — horizontally scrollable with arrows */}
            <div className="shrink-0 bg-white border-b border-slate-100">
                <div className="max-w-3xl mx-auto px-6 py-2 relative">
                    {/* Left scroll arrow */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scrollTabs('left')}
                            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-slate-500" />
                        </button>
                    )}

                    <div
                        ref={tabsRef}
                        className="flex gap-1.5 overflow-x-auto"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {dimensions.map(dim => {
                            const dimAnswered = dim.questions.filter(q => answers[q.id] || jsonAnswers[q.id]).length
                            const isActive = activeTab === dim.key
                            const hasAnswers = dimAnswered > 0
                            return (
                                <button
                                    key={dim.key}
                                    onClick={() => setActiveTab(dim.key)}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all cursor-pointer
                                        ${isActive
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }
                                    `}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        hasAnswers ? 'bg-green-500' : 'bg-slate-300'
                                    }`} />
                                    {dim.name}
                                    <span className={`text-[10px] ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
                                        ({dimAnswered}/{dim.questions.length})
                                    </span>
                                </button>
                            )
                        })}
                        {/* Documents tab — always present */}
                        <button
                            onClick={() => setActiveTab(DOCUMENTS_TAB)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all cursor-pointer
                                ${isDocumentsTab
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }
                            `}
                        >
                            <FolderOpen className="w-3 h-3" />
                            Documents
                            {documents.length > 0 && (
                                <span className={`text-[10px] ${isDocumentsTab ? 'text-indigo-500' : 'text-slate-400'}`}>
                                    ({documents.length})
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Right scroll arrow */}
                    {canScrollRight && (
                        <button
                            onClick={() => scrollTabs('right')}
                            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-6 py-5">
                    {isDocumentsTab ? (
                        <DocumentsContent
                            documents={documents}
                            uploadedDocs={uploadedDocs}
                            uploading={uploading}
                            onFilesSelected={handleFilesSelected}
                            onRemoveFile={handleRemoveFile}
                            readOnly={readOnly}
                            mode={mode}
                        />
                    ) : (
                        <>
                            {/* Dimension header */}
                            <div className="flex items-baseline justify-between mb-5">
                                <h3 className="text-base font-semibold text-slate-900">{activeDimName}</h3>
                                <span className="text-[11px] text-slate-400">
                                    {activeAnsweredCount} of {activeQuestions.length} answered
                                </span>
                            </div>

                            {/* Questions */}
                            <div className="space-y-6">
                                {activeQuestions.map((q, idx) => (
                                    <QuestionField
                                        key={q.id}
                                        question={q}
                                        index={idx + 1}
                                        value={answers[q.id] || ''}
                                        jsonValue={jsonAnswers[q.id]}
                                        status={saveStatus[q.id] || 'idle'}
                                        readOnly={readOnly}
                                        onTextChange={(val) => handleTextChange(q.id, val)}
                                        onInstantSave={(text, json) => handleInstantSave(q.id, text, json)}
                                        onSelectManyToggle={(opt) => handleSelectManyToggle(q.id, opt)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Submit footer (customer mode, not completed) */}
            {mode === 'customer' && !readOnly && formStatus !== 'completed' && (
                <div className="shrink-0 bg-white border-t border-slate-200 px-6 py-3">
                    <div className="flex items-center justify-between max-w-3xl mx-auto">
                        <span className="text-[12px] text-slate-500">
                            {requiredQuestions.length > 0
                                ? `${requiredAnsweredCount} of ${requiredQuestions.length} required answered`
                                : `${answeredCount} of ${questions.length} answered`
                            }
                        </span>
                        <button
                            onClick={onSubmit}
                            disabled={!allRequiredAnswered || isSaving}
                            className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors cursor-pointer ${
                                allRequiredAnswered && !isSaving
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            Submit Requirements
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// --- Documents Content ---

function DocumentsContent({
    documents,
    uploadedDocs,
    uploading,
    onFilesSelected,
    onRemoveFile,
    readOnly,
    mode,
}: {
    documents: DocumentRequest[]
    uploadedDocs: Record<string, UploadedDoc[]>
    uploading: Record<string, boolean>
    onFilesSelected: (slotKey: string, files: FileList | null) => void
    onRemoveFile: (slotKey: string, uploadId: string) => void
    readOnly: boolean
    mode: string
}) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-baseline justify-between">
                <h3 className="text-base font-semibold text-slate-900">Documents</h3>
                <span className="text-[11px] text-slate-400">
                    {documents.length > 0
                        ? `${documents.length} requested document${documents.length !== 1 ? 's' : ''}`
                        : 'Upload supporting documents'
                    }
                </span>
            </div>

            {/* Required document requests from generator */}
            {documents.map((doc) => (
                <DocumentUploadBlock
                    key={doc.id}
                    slotKey={doc.id}
                    title={doc.document_type}
                    description={doc.document_description}
                    whyNeeded={doc.why_needed}
                    acceptedFormats={doc.accepted_formats}
                    exampleFilenames={doc.example_filenames}
                    isRequired={doc.is_required}
                    confidenceImpact={doc.confidence_impact}
                    files={uploadedDocs[doc.id] || []}
                    isUploading={uploading[doc.id] || false}
                    onFilesSelected={(files) => onFilesSelected(doc.id, files)}
                    onRemoveFile={(uploadId) => onRemoveFile(doc.id, uploadId)}
                    readOnly={readOnly}
                    showUploadedBy={mode === 'admin'}
                />
            ))}

            {/* Divider if we have generated docs */}
            {documents.length > 0 && (
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wide">Additional</span>
                    </div>
                </div>
            )}

            {/* Fixed "Other Documents" section — always shown */}
            <DocumentUploadBlock
                slotKey="__other__"
                title="Other Documents"
                description="You can upload any additional supporting documents here that may help with the assessment."
                whyNeeded={null}
                acceptedFormats="PDF, DOCX, XLSX, PPTX, CSV, PNG, JPG"
                exampleFilenames={null}
                isRequired={false}
                confidenceImpact={null}
                files={uploadedDocs['__other__'] || []}
                isUploading={uploading['__other__'] || false}
                onFilesSelected={(files) => onFilesSelected('__other__', files)}
                onRemoveFile={(uploadId) => onRemoveFile('__other__', uploadId)}
                readOnly={readOnly}
                showUploadedBy={mode === 'admin'}
            />
        </div>
    )
}

// --- Document Upload Block ---

function DocumentUploadBlock({
    slotKey,
    title,
    description,
    whyNeeded,
    acceptedFormats,
    exampleFilenames,
    isRequired,
    confidenceImpact,
    files,
    isUploading,
    onFilesSelected,
    onRemoveFile,
    readOnly,
    showUploadedBy,
}: {
    slotKey: string
    title: string
    description: string
    whyNeeded: string | null
    acceptedFormats: string | null
    exampleFilenames: string | null
    isRequired: boolean
    confidenceImpact: string | null
    files: UploadedDoc[]
    isUploading: boolean
    onFilesSelected: (files: FileList | null) => void
    onRemoveFile: (uploadId: string) => void
    readOnly: boolean
    showUploadedBy: boolean
}) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragOver, setIsDragOver] = useState(false)

    const handleDragOver = (e: React.DragEvent) => {
        if (readOnly) return
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = () => {
        setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        if (readOnly) return
        e.preventDefault()
        setIsDragOver(false)
        onFilesSelected(e.dataTransfer.files)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="text-[13px] font-semibold text-slate-900">{title}</h4>
                            {isRequired && (
                                <span className="text-[9px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase">Required</span>
                            )}
                            {confidenceImpact && (
                                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded uppercase ${
                                    confidenceImpact === 'high' ? 'bg-red-50 text-red-600' :
                                    confidenceImpact === 'medium' ? 'bg-amber-50 text-amber-600' :
                                    'bg-slate-50 text-slate-500'
                                }`}>
                                    {confidenceImpact} impact
                                </span>
                            )}
                            {files.length > 0 && (
                                <span className="text-[10px] text-green-600 font-medium">{files.length} uploaded</span>
                            )}
                        </div>
                        <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{description}</p>
                    </div>
                </div>

                {/* Extra details */}
                {(whyNeeded || exampleFilenames) && (
                    <div className="mt-2.5 space-y-1.5">
                        {whyNeeded && (
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                <span className="font-medium text-slate-500">Why needed:</span> {whyNeeded}
                            </p>
                        )}
                        {exampleFilenames && (
                            <p className="text-[11px] text-slate-400">
                                <span className="font-medium text-slate-500">Examples:</span> {exampleFilenames}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Upload area — hidden when readOnly */}
            <div className="px-4 pb-4">
                {!readOnly && (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={`
                            border-2 border-dashed rounded-lg px-4 py-5 text-center transition-all
                            ${isUploading
                                ? 'border-indigo-300 bg-indigo-50 cursor-wait'
                                : isDragOver
                                    ? 'border-indigo-400 bg-indigo-50 cursor-pointer'
                                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                            }
                        `}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-5 h-5 mx-auto mb-2 text-indigo-500 animate-spin" />
                                <p className="text-[12px] text-indigo-600 font-medium">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <Upload className={`w-5 h-5 mx-auto mb-2 ${isDragOver ? 'text-indigo-500' : 'text-slate-400'}`} />
                                <p className="text-[12px] text-slate-600 font-medium">
                                    {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
                                </p>
                                {acceptedFormats && (
                                    <p className="text-[10px] text-slate-400 mt-1">{acceptedFormats} &middot; Max 25MB</p>
                                )}
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={e => {
                                onFilesSelected(e.target.files)
                                e.target.value = ''
                            }}
                        />
                    </div>
                )}

                {/* Uploaded files list */}
                {files.length > 0 && (
                    <div className={`${!readOnly ? 'mt-3' : ''} space-y-1.5`}>
                        {files.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100"
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                    {doc.download_url ? (
                                        <a
                                            href={doc.download_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[12px] text-indigo-600 hover:text-indigo-700 truncate underline decoration-indigo-200 hover:decoration-indigo-400"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {doc.file_name}
                                        </a>
                                    ) : (
                                        <span className="text-[12px] text-slate-700 truncate">{doc.file_name}</span>
                                    )}
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                        {formatFileSize(doc.file_size)}
                                    </span>
                                    {showUploadedBy && (
                                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                                            doc.uploaded_by === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                                        }`}>
                                            {doc.uploaded_by}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {doc.download_url && (
                                        <a
                                            href={doc.download_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-0.5 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <Download className="w-3.5 h-3.5 text-slate-400" />
                                        </a>
                                    )}
                                    {!readOnly && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onRemoveFile(doc.id)
                                            }}
                                            className="p-0.5 rounded hover:bg-red-100 transition-colors cursor-pointer shrink-0"
                                        >
                                            <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Question Field ---

function QuestionField({
    question,
    index,
    value,
    jsonValue,
    status,
    readOnly,
    onTextChange,
    onInstantSave,
    onSelectManyToggle,
}: {
    question: Question
    index: number
    value: string
    jsonValue: any
    status: SaveStatus
    readOnly: boolean
    onTextChange: (val: string) => void
    onInstantSave: (text: string | null, json: any) => void
    onSelectManyToggle: (option: string) => void
}) {
    return (
        <div className="border border-slate-200 rounded-xl p-4 bg-white">
            {/* Question header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                    <span className="text-[13px] text-slate-900 font-medium">
                        <span className="text-slate-400 mr-1">{index}.</span>
                        {question.question_text}
                        {question.is_required && <span className="text-red-500 ml-0.5">*</span>}
                    </span>
                </div>
                {!readOnly && <FieldSaveStatus status={status} />}
            </div>

            {/* Input */}
            <div className="mb-2">
                <DynamicInput
                    question={question}
                    value={value}
                    jsonValue={jsonValue}
                    readOnly={readOnly}
                    onTextChange={onTextChange}
                    onInstantSave={onInstantSave}
                    onSelectManyToggle={onSelectManyToggle}
                />
            </div>

            {/* Context + metadata */}
            {question.question_context && (
                <p className="text-[11px] text-slate-500 mb-1.5 leading-relaxed">{question.question_context}</p>
            )}
            <div className="flex items-center gap-2 text-[10px]">
                <span className={`px-1.5 py-0.5 rounded font-medium uppercase ${
                    question.confidence_impact === 'high' ? 'bg-red-50 text-red-600' :
                    question.confidence_impact === 'medium' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-50 text-slate-500'
                }`}>
                    {question.confidence_impact} impact
                </span>
                {question.evidence_type && (
                    <span className="text-slate-400">{question.evidence_type}</span>
                )}
            </div>
        </div>
    )
}

// --- Dynamic Input Renderer ---

function DynamicInput({
    question,
    value,
    jsonValue,
    readOnly,
    onTextChange,
    onInstantSave,
    onSelectManyToggle,
}: {
    question: Question
    value: string
    jsonValue: any
    readOnly: boolean
    onTextChange: (val: string) => void
    onInstantSave: (text: string | null, json: any) => void
    onSelectManyToggle: (option: string) => void
}) {
    const disabledClass = readOnly ? 'opacity-60 pointer-events-none' : ''

    switch (question.answer_format) {
        case 'text':
            return (
                <textarea
                    value={value}
                    onChange={e => onTextChange(e.target.value)}
                    rows={2}
                    disabled={readOnly}
                    placeholder="Type your answer..."
                    className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-y ${readOnly ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                />
            )

        case 'number':
            return (
                <input
                    type="number"
                    value={value}
                    onChange={e => onTextChange(e.target.value)}
                    disabled={readOnly}
                    placeholder="Enter a number"
                    className={`w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                />
            )

        case 'percentage':
            return (
                <div className="relative max-w-xs">
                    <input
                        type="number"
                        value={value}
                        onChange={e => onTextChange(e.target.value)}
                        disabled={readOnly}
                        min={0}
                        max={100}
                        placeholder="0"
                        className={`w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">%</span>
                </div>
            )

        case 'yes_no':
            return (
                <div className={`flex gap-2 ${disabledClass}`}>
                    {['Yes', 'No'].map(opt => (
                        <button
                            key={opt}
                            onClick={() => !readOnly && onInstantSave(opt, null)}
                            disabled={readOnly}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${readOnly ? '' : 'cursor-pointer'} ${
                                value === opt
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )

        case 'select_one':
            return (
                <div className={`space-y-1.5 ${disabledClass}`}>
                    {(question.answer_options || []).map(opt => (
                        <label
                            key={opt}
                            onClick={() => !readOnly && onInstantSave(opt, null)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${readOnly ? '' : 'cursor-pointer'} ${
                                value === opt
                                    ? 'bg-indigo-50 border border-indigo-200'
                                    : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                            }`}
                        >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                value === opt ? 'border-indigo-600' : 'border-slate-300'
                            }`}>
                                {value === opt && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                            </div>
                            <span className="text-sm text-slate-700">{opt}</span>
                        </label>
                    ))}
                </div>
            )

        case 'select_many': {
            const selected: string[] = jsonValue || []
            return (
                <div className={`space-y-1.5 ${disabledClass}`}>
                    {(question.answer_options || []).map(opt => {
                        const isChecked = selected.includes(opt)
                        return (
                            <label
                                key={opt}
                                onClick={() => !readOnly && onSelectManyToggle(opt)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${readOnly ? '' : 'cursor-pointer'} ${
                                    isChecked
                                        ? 'bg-indigo-50 border border-indigo-200'
                                        : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                                }`}
                            >
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                    isChecked ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                                }`}>
                                    {isChecked && (
                                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-sm text-slate-700">{opt}</span>
                            </label>
                        )
                    })}
                </div>
            )
        }

        case 'scale_1_5': {
            const selectedVal = value ? parseInt(value) : (jsonValue?.value || 0)
            return (
                <div className={`flex gap-2 ${disabledClass}`}>
                    {[1, 2, 3, 4, 5].map(n => (
                        <button
                            key={n}
                            onClick={() => !readOnly && onInstantSave(String(n), { value: n })}
                            disabled={readOnly}
                            className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${readOnly ? '' : 'cursor-pointer'} ${
                                selectedVal === n
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                    <div className="flex items-center gap-1 ml-2 text-[10px] text-slate-400">
                        <span>Low</span>
                        <span className="mx-1">—</span>
                        <span>High</span>
                    </div>
                </div>
            )
        }

        default:
            return (
                <textarea
                    value={value}
                    onChange={e => onTextChange(e.target.value)}
                    rows={2}
                    disabled={readOnly}
                    placeholder="Type your answer..."
                    className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-y ${readOnly ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                />
            )
    }
}

// --- Save Status Indicator ---

function FieldSaveStatus({ status }: { status: SaveStatus }) {
    if (status === 'saving') {
        return (
            <span className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving
            </span>
        )
    }
    if (status === 'saved') {
        return (
            <span className="flex items-center gap-1 text-[10px] text-green-600 shrink-0">
                <CheckCircle className="w-3 h-3" /> Saved
            </span>
        )
    }
    if (status === 'error') {
        return (
            <span className="flex items-center gap-1 text-[10px] text-red-500 shrink-0">
                <AlertCircle className="w-3 h-3" /> Error
            </span>
        )
    }
    return null
}
