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
  'w-full bg-white border-2 rounded-2xl px-4 text-base text-slate-900 outline-none transition-all duration-150'
const inputNormal = 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
const inputError  = 'border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-400/10'
const inputLocked = 'bg-slate-50 text-slate-500 border-slate-150 cursor-not-allowed'

export function FormSection({
  section,
  values,
  onChange,
  errors,
  lockedFields = [],
}: FormSectionProps) {
  return (
    <div>
      {/* Section title */}
      <h2 className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
        {section.title}
      </h2>

      <div className="space-y-6">
        {section.fields.filter(f => !f.hidden).map(field => {
          const isLocked = lockedFields.includes(field.pdfName)
          const value    = values[field.pdfName] ?? ''
          const error    = errors[field.pdfName]

          // ── Checkbox ────────────────────────────────────────────────────
          if (field.type === 'checkbox') {
            return (
              <div key={field.pdfName}>
                <label
                  className={`flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-150 ${
                    value === 'true'
                      ? 'border-blue-500 bg-blue-50'
                      : error
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`mt-0.5 w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ${
                    value === 'true' ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                  }`}>
                    {value === 'true' && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      checked={value === 'true'}
                      onChange={e => onChange(field.pdfName, e.target.checked ? 'true' : '')}
                      className="sr-only"
                    />
                    <span className="text-base text-slate-800 leading-relaxed font-medium">{field.label}</span>
                  </div>
                </label>
                {error && <ErrorMsg text={error} />}
              </div>
            )
          }

          // ── Radio (pill button group) ────────────────────────────────────
          if (field.type === 'radio' && field.options) {
            return (
              <div key={field.pdfName}>
                <FieldLabel label={field.label} required={field.required} />
                <div className="flex flex-wrap gap-2 mt-2">
                  {field.options.map(opt => {
                    const selected = value === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(field.pdfName, selected ? '' : opt.value)}
                        className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-150 min-h-[44px] ${
                          selected
                            ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                            : error
                            ? 'border-red-300 text-slate-700 bg-white hover:border-red-400'
                            : 'border-slate-200 text-slate-700 bg-white hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
                {error && <ErrorMsg text={error} />}
              </div>
            )
          }

          // ── Select (dropdown) ────────────────────────────────────────────
          if (field.type === 'select' && field.options) {
            const stateClass = isLocked ? inputLocked : error ? inputError : inputNormal
            return (
              <div key={field.pdfName}>
                <FieldLabel label={field.label} required={field.required} isLocked={isLocked} />
                <div className="relative">
                  <select
                    value={value}
                    onChange={e => onChange(field.pdfName, e.target.value)}
                    disabled={isLocked}
                    className={`${inputBase} ${stateClass} h-14 appearance-none pr-10`}
                  >
                    <option value="">Select…</option>
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 20 20">
                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                {error && <ErrorMsg text={error} />}
              </div>
            )
          }

          // ── Signature ────────────────────────────────────────────────────
          if (field.type === 'signature') {
            return (
              <div key={field.pdfName}>
                <FieldLabel label={field.label} required={field.required} />
                <p className="text-sm text-slate-400 mb-3">Use your finger or stylus to sign below</p>
                <SignatureField
                  value={value || null}
                  onChange={val => onChange(field.pdfName, val ?? '')}
                />
                {error && <ErrorMsg text={error} />}
              </div>
            )
          }

          // ── Textarea ─────────────────────────────────────────────────────
          if (field.type === 'textarea') {
            const stateClass = isLocked ? inputLocked : error ? inputError : inputNormal
            return (
              <div key={field.pdfName}>
                <FieldLabel label={field.label} required={field.required} isLocked={isLocked} />
                <textarea
                  value={value}
                  onChange={e => onChange(field.pdfName, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={isLocked}
                  rows={4}
                  className={`${inputBase} ${stateClass} py-3.5 resize-none min-h-[120px]`}
                />
                {error && <ErrorMsg text={error} />}
              </div>
            )
          }

          // ── Text / Date / Tel (default) ──────────────────────────────────
          const stateClass = isLocked ? inputLocked : error ? inputError : inputNormal
          return (
            <div key={field.pdfName}>
              <FieldLabel label={field.label} required={field.required} isLocked={isLocked} />
              <input
                type={field.type}
                value={value}
                onChange={e => onChange(field.pdfName, e.target.value)}
                placeholder={field.placeholder}
                disabled={isLocked}
                className={`${inputBase} ${stateClass} h-14`}
              />
              {error && <ErrorMsg text={error} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FieldLabel({
  label,
  required,
  isLocked,
}: {
  label: string
  required?: boolean
  isLocked?: boolean
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {isLocked && (
        <span className="ml-2 inline-flex items-center gap-1 text-xs text-blue-500 font-normal bg-blue-50 px-1.5 py-0.5 rounded-md">
          <Lock size={9} />
          Pre-filled
        </span>
      )}
    </label>
  )
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 12 12">
        <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 4a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 016 5zm0-1.5a.75.75 0 110-1.5.75.75 0 010 1.5z"/>
      </svg>
      {text}
    </p>
  )
}
