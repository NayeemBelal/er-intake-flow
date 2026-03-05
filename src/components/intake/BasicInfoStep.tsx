'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export interface BasicInfoData {
  name: string
  dob: string
  phone: string
  reason: string
}

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
  const [name, setName] = useState(initialData?.name ?? '')
  const [dob, setDob] = useState(initialData?.dob ?? '')
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [reason, setReason] = useState(initialData?.reason ?? '')
  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfoData, string>>>({})

  function validate() {
    const errs: Partial<Record<keyof BasicInfoData, string>> = {}
    if (!name.trim()) errs.name = 'Full name is required'
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
      onContinue({ name: name.trim(), dob, phone, reason: reason.trim() })
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
        <div>
          <label className={labelClass}>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Smith"
            className={inputClass}
            autoComplete="name"
          />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
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
