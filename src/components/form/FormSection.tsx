'use client'
import { Lock } from 'lucide-react'
import { FormSection as FormSectionType } from '@/lib/pdf-fields'
import { SignatureField } from './SignatureField'

interface FormSectionProps {
  section: FormSectionType
  values: Record<string, string>
  onChange: (name: string, value: string) => void
  errors: Record<string, string>
  lockedFields?: string[]
}

const inputBase =
  'w-full bg-white border rounded-xl px-4 text-base text-slate-900 outline-none transition-colors'
const inputNormal = 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15'
const inputError = 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/15'
const inputLocked = 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'

export function FormSection({
  section,
  values,
  onChange,
  errors,
  lockedFields = [],
}: FormSectionProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
        {section.title}
      </p>

      <div className="space-y-5">
        {section.fields.map(field => {
          const isLocked = lockedFields.includes(field.pdfName)
          const value = values[field.pdfName] ?? ''
          const error = errors[field.pdfName]
          const stateClass = isLocked ? inputLocked : error ? inputError : inputNormal

          if (field.type === 'checkbox') {
            return (
              <div key={field.pdfName}>
                <label
                  className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                    error ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={value === 'true'}
                    onChange={e => onChange(field.pdfName, e.target.checked ? 'true' : '')}
                    className="mt-0.5 w-5 h-5 shrink-0 rounded border-slate-300 text-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 leading-relaxed">{field.label}</span>
                </label>
                {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
              </div>
            )
          }

          if (field.type === 'signature') {
            return (
              <div key={field.pdfName}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <SignatureField value={value || null} onChange={val => onChange(field.pdfName, val ?? '')} />
                {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
              </div>
            )
          }

          return (
            <div key={field.pdfName}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
                {isLocked && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-blue-500 font-normal">
                    <Lock size={10} />
                    Pre-filled
                  </span>
                )}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  value={value}
                  onChange={e => onChange(field.pdfName, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={isLocked}
                  rows={4}
                  className={`${inputBase} ${stateClass} py-3.5 resize-none`}
                />
              ) : (
                <input
                  type={field.type}
                  value={value}
                  onChange={e => onChange(field.pdfName, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={isLocked}
                  className={`${inputBase} ${stateClass} h-14`}
                />
              )}

              {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
