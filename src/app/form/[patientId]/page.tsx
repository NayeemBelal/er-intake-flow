'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Patient } from '@/types/patient'
import { FORM_FIELDS, FORM_LABELS } from '@/lib/pdf-fields'
import { loadAndFillPdf, mergePdfs } from '@/lib/pdf'
import { FormProgress } from '@/components/form/FormProgress'
import { FormSection } from '@/components/form/FormSection'
import { FormThankYou } from '@/components/form/FormThankYou'
import { PdfFormFiller } from '@/components/form/PdfFormFiller'

// Forms rendered as inline PDF viewers
const PDF_VIEWER_FORMS = ['registration']

type Step = 'loading' | 'error' | 'filling' | 'submitting' | 'done'

export default function FormPage() {
  const { patientId } = useParams<{ patientId: string }>()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [step, setStep] = useState<Step>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)

  const [currentFormIdx, setCurrentFormIdx] = useState(0)
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPatient() {
      try {
        const res = await fetch(`/api/patients/${patientId}`)
        if (!res.ok) throw new Error('Your form link is invalid or has expired.')
        const data: Patient = await res.json()
        setPatient(data)

        // Pre-fill values from intake data
        const nameParts = data.name.trim().split(/\s+/)
        const firstName = nameParts[0] ?? ''
        const lastName = nameParts.slice(1).join(' ') || firstName

        const initial: Record<string, Record<string, string>> = {}
        for (const formName of data.forms_to_send) {
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
        setStep('filling')
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load your forms.')
        setStep('error')
      }
    }
    loadPatient()
  }, [patientId])

  if (step === 'loading') return <LoadingScreen />
  if (step === 'error') return <ErrorScreen message={loadError ?? 'Something went wrong.'} />
  if (step === 'done') return <FormThankYou patientName={patient!.name} />

  const forms = patient!.forms_to_send
  if (!forms || forms.length === 0) {
    return <ErrorScreen message="No forms have been assigned to you yet. Please check back soon." />
  }

  const currentForm = forms[currentFormIdx]
  const isPdfViewerForm = PDF_VIEWER_FORMS.includes(currentForm)
  const sections = FORM_FIELDS[currentForm] ?? []
  const currentSection = sections[currentSectionIdx]

  // For PDF viewer forms, treat as single-section (no section nav)
  const isLastSection = isPdfViewerForm ? true : currentSectionIdx === sections.length - 1
  const isLastForm = currentFormIdx === forms.length - 1
  const isFinalStep = isLastSection && isLastForm
  const isFirstStep = currentFormIdx === 0 && (isPdfViewerForm ? true : currentSectionIdx === 0)

  const values = formValues[currentForm] ?? {}

  function setValue(fieldName: string, value: string) {
    setFormValues(prev => ({
      ...prev,
      [currentForm]: { ...(prev[currentForm] ?? {}), [fieldName]: value },
    }))
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
  }

  function validateSectionForm(): boolean {
    const errs: Record<string, string> = {}
    for (const field of currentSection.fields) {
      if (field.required && !values[field.pdfName]) {
        errs[field.pdfName] = `${field.label.length > 40 ? 'This field' : field.label} is required`
      }
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validatePdfForm(): boolean {
    return true
  }

  async function handleNext() {
    const valid = isPdfViewerForm ? validatePdfForm() : validateSectionForm()
    if (!valid) {
      if (!isPdfViewerForm) window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (!isLastSection) {
      setCurrentSectionIdx(s => s + 1)
      setFieldErrors({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (!isLastForm) {
      setCurrentFormIdx(f => f + 1)
      setCurrentSectionIdx(0)
      setFieldErrors({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      await handleSubmit()
    }
  }

  function handleBack() {
    setFieldErrors({})
    if (!isPdfViewerForm && currentSectionIdx > 0) {
      setCurrentSectionIdx(s => s - 1)
    } else if (currentFormIdx > 0) {
      const prevForm = forms[currentFormIdx - 1]
      const prevSections = FORM_FIELDS[prevForm] ?? []
      const isPrevPdf = PDF_VIEWER_FORMS.includes(prevForm)
      setCurrentFormIdx(f => f - 1)
      setCurrentSectionIdx(isPrevPdf ? 0 : prevSections.length - 1)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setStep('submitting')
    setSubmitError(null)
    try {
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
        const merged =
          filledPdfs.length === 1 ? filledPdfs[0] : await mergePdfs(filledPdfs)
        fd.append(
          'pdf',
          new Blob([merged.buffer as ArrayBuffer], { type: 'application/pdf' }),
          'filled.pdf'
        )
      }

      fd.append('fieldValues', JSON.stringify(formValues))

      const res = await fetch(`/api/patients/${patientId}/submit`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed.')
      }

      setStep('done')
    } catch (e) {
      setStep('filling')
      setSubmitError(e instanceof Error ? e.message : 'Submission failed. Please try again.')
    }
  }

  const nextLabel = step === 'submitting'
    ? 'Submitting...'
    : isFinalStep
    ? 'Submit Forms →'
    : isLastSection && !isLastForm
    ? `Next: ${FORM_LABELS[forms[currentFormIdx + 1]] ?? 'Next Form'} →`
    : isPdfViewerForm
    ? 'Continue →'
    : 'Next Section →'

  return (
    <div className="min-h-screen bg-white">
      <FormProgress
        formLabel={FORM_LABELS[currentForm] ?? currentForm}
        formIndex={currentFormIdx}
        totalForms={forms.length}
        sectionIndex={isPdfViewerForm ? 0 : currentSectionIdx}
        totalSections={isPdfViewerForm ? 1 : sections.length}
        onBack={isFirstStep ? undefined : handleBack}
      />

      <div className={isPdfViewerForm ? 'w-full pt-4 pb-28' : 'max-w-[480px] mx-auto px-5 pt-8 pb-36'}>
        {isPdfViewerForm ? (
          <PdfFormFiller
            pdfPath={`/forms/${currentForm}.pdf`}
            values={values}
            onChange={setValue}
            lockedFields={['FIRST NAME', 'LAST NAME', 'DOB', 'PHONE NUMBER', 'Patient Name', 'Date of Birth']}
            signatureFieldNames={['Patient Signature']}
            errors={fieldErrors}
          />
        ) : (
          <FormSection
            section={currentSection}
            values={values}
            onChange={setValue}
            errors={fieldErrors}
            lockedFields={['wc_patient_name', 'wc_dob']}
          />
        )}

        {submitError && (
          <div className={`mt-6 p-4 bg-red-50 border border-red-200 rounded-xl ${isPdfViewerForm ? 'mx-4' : ''}`}>
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {Object.keys(fieldErrors).length > 0 && isPdfViewerForm && (
          <div className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-700 font-medium">Please fill in all required fields highlighted in red above.</p>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-5 py-4">
        <div className="max-w-[480px] mx-auto">
          <button
            onClick={handleNext}
            disabled={step === 'submitting'}
            className={`w-full font-semibold text-base h-14 rounded-xl transition-all ${
              isFinalStep
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-60'
                : 'bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-60'
            }`}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading your forms...</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-xl font-bold">!</span>
        </div>
        <h2 className="font-semibold text-slate-900 mb-2">Unable to load forms</h2>
        <p className="text-slate-500 text-sm">{message}</p>
      </div>
    </div>
  )
}
