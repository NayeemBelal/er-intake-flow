'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, RotateCcw } from 'lucide-react'

interface PhotoCaptureStepProps {
  onBack: () => void
  onSubmit: (idPhoto: File | null, insurancePhoto: File | null) => void
  isSubmitting: boolean
}

function PhotoCapture({
  label,
  photo,
  onCapture,
  onRetake,
}: {
  label: string
  photo: File | null
  onCapture: (file: File) => void
  onRetake: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrl = photo ? URL.createObjectURL(photo) : null

  return (
    <div>
      <p className="text-slate-300 text-sm font-medium mb-2">{label}</p>
      <div
        className="relative w-full h-44 bg-slate-700/60 border border-slate-600 rounded-xl overflow-hidden cursor-pointer hover:border-slate-500 transition-colors"
        onClick={() => !photo && inputRef.current?.click()}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onRetake()
              }}
              className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Retake
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
            <Camera className="w-8 h-8" />
            <span className="text-sm">Tap to take photo</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onCapture(file)
          e.target.value = ''
        }}
      />
      <div className="mt-1.5 h-5">
        {photo ? (
          <p className="text-emerald-400 text-xs">✓ Photo captured</p>
        ) : (
          <p className="text-slate-600 text-xs">Optional — tap Skip to continue without a photo</p>
        )}
      </div>
    </div>
  )
}

export default function PhotoCaptureStep({ onBack, onSubmit, isSubmitting }: PhotoCaptureStepProps) {
  const [idPhoto, setIdPhoto] = useState<File | null>(null)
  const [insurancePhoto, setInsurancePhoto] = useState<File | null>(null)

  return (
    <motion.div
      key="photos"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="space-y-5"
    >
      <PhotoCapture
        label="Government-issued ID"
        photo={idPhoto}
        onCapture={setIdPhoto}
        onRetake={() => setIdPhoto(null)}
      />
      <PhotoCapture
        label="Insurance Card"
        photo={insurancePhoto}
        onCapture={setInsurancePhoto}
        onRetake={() => setInsurancePhoto(null)}
      />

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg h-14 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => onSubmit(idPhoto, insurancePhoto)}
          disabled={isSubmitting}
          className="flex-1 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-semibold text-lg h-14 rounded-xl transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting…' : 'Submit →'}
        </button>
      </div>
    </motion.div>
  )
}
