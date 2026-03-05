'use client'
import { ChevronLeft } from 'lucide-react'

interface FormProgressProps {
  formLabel: string
  formIndex: number
  totalForms: number
  sectionIndex: number
  totalSections: number
  onBack?: () => void
}

export function FormProgress({
  formLabel,
  formIndex,
  totalForms,
  sectionIndex,
  totalSections,
  onBack,
}: FormProgressProps) {
  const progress = ((formIndex + (sectionIndex + 1) / totalSections) / totalForms) * 100

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 pt-3 pb-3">
      <div className="max-w-[480px] mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="w-16">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-0.5 text-slate-500 text-sm hover:text-slate-800 transition-colors -ml-1"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800">{formLabel}</p>
            {totalForms > 1 && (
              <p className="text-xs text-slate-400 mt-0.5">
                Form {formIndex + 1} of {totalForms}
              </p>
            )}
          </div>

          <div className="w-16 flex justify-end gap-1">
            {Array.from({ length: totalSections }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  i <= sectionIndex ? 'bg-blue-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
