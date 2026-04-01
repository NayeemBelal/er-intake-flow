'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export interface BasicInfoData {
  firstName: string
  lastName: string
  dob: string
  phone: string
  reason: string
  howDidYouHear: string
}

const HOW_DID_YOU_HEAR_OPTIONS = [
  { label: 'Drive By',        value: 'Drive by' },
  { label: 'Internet',        value: 'Internet' },
  { label: 'Doctor',          value: 'Doctor' },
  { label: 'Advertisement',   value: 'Advertisement' },
  { label: 'Friend / Family', value: 'FriendFamily' },
]

interface BasicInfoStepProps {
  onContinue: (data: BasicInfoData) => void
  initialData?: BasicInfoData
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

const inputClass =
  'w-full bg-slate-700/60 border border-slate-600 text-white text-lg rounded-xl px-5 py-4 h-14 focus:border-white focus:ring-2 focus:ring-white/20 focus:outline-none transition-colors placeholder:text-slate-500'
const labelClass = 'block text-slate-300 text-sm font-medium mb-2'
const errorClass = 'text-red-400 text-sm mt-1.5'

export default function BasicInfoStep({ onContinue, initialData }: BasicInfoStepProps) {
  const [firstName, setFirstName] = useState(initialData?.firstName ?? '')
  const [lastName, setLastName] = useState(initialData?.lastName ?? '')
  const [dob, setDob] = useState(initialData?.dob ?? '')
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [reason, setReason] = useState(initialData?.reason ?? '')
  const [howDidYouHear, setHowDidYouHear] = useState(initialData?.howDidYouHear ?? '')
  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfoData, string>>>({})

  function validate() {
    const errs: Partial<Record<keyof BasicInfoData, string>> = {}
    if (!firstName.trim()) errs.firstName = 'First name is required'
    if (!lastName.trim())  errs.lastName  = 'Last name is required'
    if (!dob) errs.dob = 'Date of birth is required'
    if (phone.replace(/\D/g, '').length < 10) errs.phone = 'Enter a valid 10-digit phone number'
    if (!reason.trim()) errs.reason = 'Please describe your reason for visit'
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      onContinue({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob,
        phone,
        reason: reason.trim(),
        howDidYouHear,
      })
    }
  }

  return (
    <motion.div
      key="basic-info"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Jane"
              className={inputClass}
              autoComplete="given-name"
            />
            {errors.firstName && <p className={errorClass}>{errors.firstName}</p>}
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Smith"
              className={inputClass}
              autoComplete="family-name"
            />
            {errors.lastName && <p className={errorClass}>{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Date of Birth</label>
          <input
            type="date"
            value={dob}
            onChange={e => setDob(e.target.value)}
            className={inputClass}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dob && <p className={errorClass}>{errors.dob}</p>}
        </div>

        <div>
          <label className={labelClass}>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            placeholder="(555) 012-3456"
            className={inputClass}
            inputMode="numeric"
          />
          {errors.phone && <p className={errorClass}>{errors.phone}</p>}
        </div>

        <div>
          <label className={labelClass}>Reason for Visit</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Briefly describe your symptoms"
            rows={3}
            className="w-full bg-slate-700/60 border border-slate-600 text-white text-lg rounded-xl px-5 py-4 focus:border-white focus:ring-2 focus:ring-white/20 focus:outline-none transition-colors placeholder:text-slate-500 resize-none"
          />
          {errors.reason && <p className={errorClass}>{errors.reason}</p>}
        </div>

        <div>
          <label className={labelClass}>How Did You Hear About Us? <span className="text-slate-500 font-normal">(optional)</span></label>
          <div className="flex flex-wrap gap-2 mt-1">
            {HOW_DID_YOU_HEAR_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setHowDidYouHear(howDidYouHear === opt.value ? '' : opt.value)}
                className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all min-h-[44px] ${
                  howDidYouHear === opt.value
                    ? 'bg-white border-white text-slate-900'
                    : 'border-slate-600 text-slate-300 hover:border-slate-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-semibold text-lg h-14 rounded-xl transition-colors mt-2 cursor-pointer"
        >
          Continue →
        </button>
      </form>
    </motion.div>
  )
}
