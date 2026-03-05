'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { Patient } from '@/types/patient'
import { FORM_FIELDS } from '@/lib/pdf-fields'
import { loadAndFillPdf, mergePdfs } from '@/lib/pdf'
import { PdfFormFiller } from '@/components/form/PdfFormFiller'

type Step = 'loading' | 'error' | 'reviewing' | 'saving' | 'done'

// Forms that have a real PDF viewer (AcroForm fields)
const PDF_VIEWER_FORMS = ['registration']

export default function AuditPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const router = useRouter()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [step, setStep] = useState<Step>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({})
  const [currentFormIdx, setCurrentFormIdx] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/patients/${patientId}`)
        if (!res.ok) throw new Error('Patient not found.')
        const data: Patient = await res.json()

        if (data.status !== 'submitted' && data.status !== 'audited') {
          throw new Error('This patient has not submitted their forms yet.')
        }

        setPatient(data)

        const forms = data.forms_to_send.length > 0 ? data.forms_to_send : ['registration']

        // If the patient already submitted field values, use those directly
        if (data.form_field_values) {
          setFormValues(data.form_field_values)
        } else {
          // Fall back to pre-filling only from patient demographics
          const nameParts = data.name.trim().split(/\s+/)
          const firstName = nameParts[0] ?? ''
          const lastName = nameParts.slice(1).join(' ') || firstName

          const initial: Record<string, Record<string, string>> = {}
          for (const formName of forms) {
            initial[formName] = {}
            for (const section of FORM_FIELDS[formName] ?? []) {
              for (const field of section.fields) {
                if (field.prefill === 'firstName') initial[formName][field.pdfName] = firstName
                if (field.prefill === 'lastName')  initial[formName][field.pdfName] = lastName
                if (field.prefill === 'fullName')  initial[formName][field.pdfName] = data.name
                if (field.prefill === 'dob')       initial[formName][field.pdfName] = data.dob
                if (field.prefill === 'phone')     initial[formName][field.pdfName] = data.phone
              }
            }
          }
          setFormValues(initial)
        }
        setStep('reviewing')
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load patient.')
        setStep('error')
      }
    }
    load()
  }, [patientId])

  function setValue(formName: string, fieldName: string, value: string) {
    setFormValues(prev => ({
      ...prev,
      [formName]: { ...(prev[formName] ?? {}), [fieldName]: value },
    }))
  }

  async function handleCompleteAudit() {
    if (!patient) return
    setStep('saving')
    setSaveError(null)

    try {
      const forms = patient.forms_to_send.length > 0 ? patient.forms_to_send : ['registration']
      const filledPdfs: Uint8Array[] = []

      for (const formName of forms) {
        const vals = formValues[formName] ?? {}
        const signatureDataUrl = vals['Patient Signature'] || undefined
        const textValues = { ...vals }
        delete textValues['Patient Signature']

        const bytes = await loadAndFillPdf(formName, textValues, signatureDataUrl)
        if (bytes) filledPdfs.push(bytes)
      }

      const fd = new FormData()
      if (filledPdfs.length > 0) {
        const merged = filledPdfs.length === 1 ? filledPdfs[0] : await mergePdfs(filledPdfs)
        fd.append('pdf', new Blob([merged.buffer as ArrayBuffer], { type: 'application/pdf' }), 'audited.pdf')
      }

      const res = await fetch(`/api/patients/${patientId}/audit`, { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Audit failed.')
      }

      setStep('done')
      setTimeout(() => router.push('/'), 1800)
    } catch (e) {
      setStep('reviewing')
      setSaveError(e instanceof Error ? e.message : 'Something went wrong.')
    }
  }

  // ─── States ────────────────────────────────────────────────────────────────

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading patient forms...</p>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <p className="text-red-500 text-sm">{loadError}</p>
          <button onClick={() => router.push('/')} className="mt-4 text-sm text-blue-500 hover:underline">
            ← Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
          <h2 className="text-xl font-semibold text-slate-800">Audit Complete</h2>
          <p className="text-sm text-slate-500">Returning to dashboard...</p>
        </div>
      </div>
    )
  }

  const forms = patient!.forms_to_send.length > 0 ? patient!.forms_to_send : ['registration']
  const currentForm = forms[currentFormIdx]
  const isPdfForm = PDF_VIEWER_FORMS.includes(currentForm)
  const isLastForm = currentFormIdx === forms.length - 1

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-sm font-semibold text-slate-800">{patient!.name}</span>
            <span className="text-xs text-slate-400 ml-2">— Audit Review</span>
          </div>
        </div>

        {/* Form tabs (if multiple forms) */}
        {forms.length > 1 && (
          <div className="flex gap-1">
            {forms.map((f, i) => (
              <button
                key={f}
                onClick={() => setCurrentFormIdx(i)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  i === currentFormIdx
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'registration' ? 'Registration' : f === 'mva' ? 'MVA' : "Worker's Comp"}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleCompleteAudit}
          disabled={step === 'saving'}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <CheckCircle size={15} />
          {step === 'saving' ? 'Saving...' : 'Complete Audit'}
        </button>
      </div>

      {saveError && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{saveError}</p>
          </div>
        </div>
      )}

      {/* PDF form — wider container on desktop */}
      <div className="max-w-5xl mx-auto px-6 py-6 pb-16">
        {isPdfForm ? (
          <PdfFormFiller
            pdfPath={`/forms/${currentForm}.pdf`}
            values={formValues[currentForm] ?? {}}
            onChange={(field, value) => setValue(currentForm, field, value)}
            lockedFields={[]}
            signatureFieldNames={['Patient Signature']}
          />
        ) : (
          // Scanned forms (mva, workers_comp) — show a note for now
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500 text-sm">
              This form ({currentForm}) is a scanned document and cannot be edited inline.
            </p>
          </div>
        )}

        {!isLastForm && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setCurrentFormIdx(i => i + 1)}
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Next Form →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
