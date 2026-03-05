'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import StepIndicator from '@/components/intake/StepIndicator'
import BasicInfoStep, { type BasicInfoData } from '@/components/intake/BasicInfoStep'
import PhotoCaptureStep from '@/components/intake/PhotoCaptureStep'
import ThankYouScreen from '@/components/intake/ThankYouScreen'

type Step = 'basic-info' | 'photos' | 'thank-you'

export default function IntakePage() {
  const [step, setStep] = useState<Step>('basic-info')
  const [basicInfo, setBasicInfo] = useState<BasicInfoData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const stepNumber = step === 'basic-info' ? 1 : step === 'photos' ? 2 : 3

  function handleBasicInfoContinue(data: BasicInfoData) {
    setBasicInfo(data)
    setStep('photos')
  }

  async function handlePhotoSubmit(idPhoto: File | null, insurancePhoto: File | null) {
    if (!basicInfo) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('name', basicInfo.name)
      formData.append('dob', basicInfo.dob)
      formData.append('phone', basicInfo.phone)
      formData.append('reason', basicInfo.reason)
      if (idPhoto) formData.append('id_photo', idPhoto)
      if (insurancePhoto) formData.append('insurance_photo', insurancePhoto)

      const res = await fetch('/api/patients', { method: 'POST', body: formData })

      if (!res.ok) {
        let errorMsg = 'Submission failed. Please try again.'
        try {
          const data = await res.json()
          if (data.error) errorMsg = data.error
        } catch { /* non-JSON response from server */ }
        throw new Error(errorMsg)
      }

      setStep('thank-you')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleReset() {
    setStep('basic-info')
    setBasicInfo(null)
    setSubmitError(null)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 py-10">
      {step !== 'thank-you' && (
        <div className="w-full max-w-[560px] mb-10 px-2">
          <StepIndicator currentStep={stepNumber} />
        </div>
      )}

      <div className="w-full max-w-[560px]">
        {step === 'thank-you' ? (
          <ThankYouScreen phone={basicInfo?.phone ?? ''} onReset={handleReset} />
        ) : (
          <div className="bg-slate-800 rounded-3xl p-10 shadow-2xl border border-slate-700">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">
                {step === 'basic-info' ? 'Patient Check-In' : 'Upload Documents'}
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                {step === 'basic-info'
                  ? 'Please fill in your information below'
                  : 'Take photos of your ID and insurance card — both optional'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 'basic-info' && (
                <BasicInfoStep
                  key="basic-info"
                  onContinue={handleBasicInfoContinue}
                  initialData={basicInfo ?? undefined}
                />
              )}
              {step === 'photos' && (
                <PhotoCaptureStep
                  key="photos"
                  onBack={() => setStep('basic-info')}
                  onSubmit={handlePhotoSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </AnimatePresence>

            {submitError && (
              <p className="text-red-400 text-sm mt-4 text-center">{submitError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
