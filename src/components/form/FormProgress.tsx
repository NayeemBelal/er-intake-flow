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
  // Show dot indicators only when there are few enough to fit
  const showDots = totalSections <= 7

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 pt-3 pb-3">
      <div className="max-w-[480px] mx-auto">
        <div className="flex items-center justify-between mb-3">
          {/* Back button */}
          <div className="w-16">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-0.5 text-slate-500 text-sm hover:text-slate-800 transition-colors -ml-1 min-h-[36px]"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
          </div>

          {/* Centre: form label + step count */}
          <div className="text-center flex-1 px-2">
            <p className="text-sm font-semibold text-slate-800 truncate">{formLabel}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalForms > 1
                ? `Form ${formIndex + 1} of ${totalForms} · Step ${sectionIndex + 1} of ${totalSections}`
                : `Step ${sectionIndex + 1} of ${totalSections}`}
            </p>
          </div>

          {/* Dot indicators (hidden when too many sections) */}
          <div className="w-16 flex justify-end gap-1.5 flex-wrap">
            {showDots && Array.from({ length: totalSections }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < sectionIndex
                    ? 'bg-blue-300'
                    : i === sectionIndex
                    ? 'bg-blue-500 scale-125'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
