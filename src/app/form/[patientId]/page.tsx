'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Patient } from '@/types/patient'
import { FORM_FIELDS, FORM_LABELS, expandRadioValues } from '@/lib/pdf-fields'
import { loadAndFillPdf, mergePdfs, SignaturePlacement } from '@/lib/pdf'
import { FormProgress } from '@/components/form/FormProgress'
import { FormSection } from '@/components/form/FormSection'
import { FormThankYou } from '@/components/form/FormThankYou'
import { FormTerms, TERMS_PAGES } from '@/components/form/FormTerms'

// Fields that are pre-filled from intake and should not be editable
function lockedFieldsForForm(form: string): string[] {
  if (form === 'registration') {
    return ['FIRST NAME', 'LAST NAME', 'DOB', 'PHONE NUMBER', 'Patient Name', 'Date of Birth']
  }
  if (form === 'workers_comp') {
    return ['wc_patient_name', 'wc_dob']
  }
  return []
}

type Step = 'loading' | 'error' | 'filling' | 'terms' | 'terms2' | 'terms3' | 'terms4' | 'submitting' | 'done'

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
  // Tracks whether the patient accepted (true), declined (false), or skipped (null) each terms page
  const [termsAccepted, setTermsAccepted] = useState<(boolean | null)[]>([null, null, null, null])

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
        const lastName  = nameParts.slice(1).join(' ') || firstName

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
        // Merge any values pre-seeded at intake (e.g. "How Did You Hear About Us")
        // Prefill values take priority so locked fields always reflect intake data.
        if (data.form_field_values) {
          for (const [formName, existingFields] of Object.entries(data.form_field_values)) {
            initial[formName] = { ...existingFields as Record<string,string>, ...(initial[formName] ?? {}) }
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
  if (step === 'error')   return <ErrorScreen message={loadError ?? 'Something went wrong.'} />
  if (step === 'done')    return <FormThankYou patientName={patient!.name} />

  // Declare forms here so handleSubmit (below) can close over it regardless of which step renders
  const forms = patient!.forms_to_send
  if (!forms || forms.length === 0) {
    return <ErrorScreen message="No forms have been assigned to you yet. Please check back soon." />
  }

  if (step === 'terms') {
    return (
      <FormTerms
        sections={TERMS_PAGES[0]}
        pageIndex={0}
        onAccept={(accepted) => {
          setTermsAccepted(prev => { const n = [...prev]; n[0] = accepted; return n })
          setStep('terms2')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    )
  }

  if (step === 'terms2') {
    return (
      <FormTerms
        sections={TERMS_PAGES[1]}
        pageIndex={1}
        onAccept={(accepted) => {
          setTermsAccepted(prev => { const n = [...prev]; n[1] = accepted; return n })
          setStep('terms3')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    )
  }

  if (step === 'terms3') {
    return (
      <FormTerms
        sections={TERMS_PAGES[2]}
        pageIndex={2}
        onAccept={(accepted) => {
          setTermsAccepted(prev => { const n = [...prev]; n[2] = accepted; return n })
          setStep('terms4')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    )
  }

  if (step === 'terms4') {
    return (
      <FormTerms
        sections={TERMS_PAGES[3]}
        pageIndex={3}
        onAccept={(accepted) => {
          setTermsAccepted(prev => { const n = [...prev]; n[3] = accepted; return n })
          setCurrentSectionIdx(s => s + 1)
          setStep('filling')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    )
  }

  const currentForm    = forms[currentFormIdx]
  const sections       = FORM_FIELDS[currentForm] ?? []
  const currentSection = sections[currentSectionIdx]

  const isLastSection = currentSectionIdx === sections.length - 1
  const isLastForm    = currentFormIdx === forms.length - 1
  const isFinalStep   = isLastSection && isLastForm
  const isFirstStep   = currentFormIdx === 0 && currentSectionIdx === 0

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

  function validateSection(): boolean {
    const errs: Record<string, string> = {}
    for (const field of currentSection.fields) {
      if (field.required && !values[field.pdfName]) {
        errs[field.pdfName] = `${field.label.length > 40 ? 'This field' : field.label} is required`
      }
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  // True when the NEXT section would be the final section of the final form
  const isAboutToEnterFinalSection =
    isLastForm && currentSectionIdx === sections.length - 2

  async function handleNext() {
    if (!validateSection()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (isFinalStep) {
      // On the last section — submit
      await handleSubmit()
    } else if (isAboutToEnterFinalSection) {
      // One section before the end of the last form — show terms first
      setStep('terms')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (!isLastSection) {
      setCurrentSectionIdx(s => s + 1)
      setFieldErrors({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setCurrentFormIdx(f => f + 1)
      setCurrentSectionIdx(0)
      setFieldErrors({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleBack() {
    setFieldErrors({})
    if (currentSectionIdx > 0) {
      setCurrentSectionIdx(s => s - 1)
    } else if (currentFormIdx > 0) {
      const prevForm     = forms[currentFormIdx - 1]
      const prevSections = FORM_FIELDS[prevForm] ?? []
      setCurrentFormIdx(f => f - 1)
      setCurrentSectionIdx(prevSections.length - 1)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setStep('submitting')
    setSubmitError(null)
    try {
      const filledPdfs: Uint8Array[] = []
      // Store expanded values so the audit page loads them in the correct format
      const storedFieldValues: Record<string, Record<string, string>> = {}

      for (const formName of forms) {
        const vals             = formValues[formName] ?? {}
        const signatureDataUrl = vals['Patient Signature'] || undefined
        const textValues       = { ...vals }
        delete textValues['Patient Signature']

        // Combine split contact name fields into the single PDF field
        let signaturePlacements: SignaturePlacement[] | undefined
        if (formName === 'registration') {
          const cf = textValues['CONTACT FIRST NAME']
          const cl = textValues['CONTACT LAST NAME']
          if (cf || cl) {
            textValues['NAME OF CONTACT'] = `${cf ?? ''} ${cl ?? ''}`.trim()
            delete textValues['CONTACT FIRST NAME']
            delete textValues['CONTACT LAST NAME']
          }

          const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
          signaturePlacements = []

          // terms1: initials (Acknowledge field) — clear if not accepted
          if (termsAccepted[0] !== true) delete textValues['Acknowledge']

          // terms2: patient signature + date on page 3 (0-indexed: 2)
          if (termsAccepted[1] === true) {
            signaturePlacements.push({ pageIndex: 2, x: 70, y: 122, width: 208, height: 23 })
            textValues['Date'] = today
          }

          // terms3: patient signature + date on page 4 (0-indexed: 3)
          if (termsAccepted[2] === true) {
            signaturePlacements.push({ pageIndex: 3, x: 79, y: 367, width: 187, height: 23 })
            textValues['Text4'] = today
          }

          // terms4: patient signature + date on page 5 (0-indexed: 4)
          if (termsAccepted[3] === true) {
            signaturePlacements.push({ pageIndex: 4, x: 38, y: 265, width: 217, height: 32 })
            textValues['Date_3'] = today
          }
        }

        // Expand radio group selections into individual PDF checkbox entries
        const expandedValues = expandRadioValues(formName, textValues)
        const bytes = await loadAndFillPdf(formName, expandedValues, signatureDataUrl, signaturePlacements)
        if (bytes) filledPdfs.push(bytes)

        // Persist expanded values (checkbox keys like "Married: true") so the
        // audit PdfFormFiller can match them to PDF annotation field names
        storedFieldValues[formName] = { ...expandedValues }
        if (signatureDataUrl) storedFieldValues[formName]['Patient Signature'] = signatureDataUrl
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

      fd.append('fieldValues', JSON.stringify(storedFieldValues))

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
    ? 'Submitting…'
    : isFinalStep
    ? 'Submit Forms →'
    : isAboutToEnterFinalSection
    ? 'Review Terms →'
    : isLastSection && !isLastForm
    ? `Next: ${FORM_LABELS[forms[currentFormIdx + 1]] ?? 'Next Form'} →`
    : 'Continue →'

  return (
    <div className="min-h-screen bg-slate-50">
      <FormProgress
        formLabel={FORM_LABELS[currentForm] ?? currentForm}
        formIndex={currentFormIdx}
        totalForms={forms.length}
        sectionIndex={currentSectionIdx}
        totalSections={sections.length}
        onBack={isFirstStep ? undefined : handleBack}
      />

      <div className="max-w-[480px] mx-auto px-5 pt-8 pb-36">
        <FormSection
          section={currentSection}
          values={values}
          onChange={setValue}
          errors={fieldErrors}
          lockedFields={lockedFieldsForForm(currentForm)}
        />

        {submitError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {Object.keys(fieldErrors).length > 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-sm text-amber-700 font-medium">Please fill in all required fields above.</p>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-5 py-4">
        <div className="max-w-[480px] mx-auto">
          <button
            onClick={handleNext}
            disabled={step === 'submitting'}
            className="w-full font-semibold text-base h-14 rounded-2xl transition-all bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white disabled:opacity-60"
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading your forms…</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
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
