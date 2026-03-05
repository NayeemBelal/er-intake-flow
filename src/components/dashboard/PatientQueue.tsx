'use client'

import { AnimatePresence } from 'framer-motion'
import { Activity } from 'lucide-react'
import PatientRow from './PatientRow'
import type { Patient } from '@/types/patient'

interface PatientQueueProps {
  patients: Patient[]
  selectedId: string | null
  onSelect: (patient: Patient) => void
  now: Date
}

export default function PatientQueue({ patients, selectedId, onSelect, now }: PatientQueueProps) {
  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <Activity className="w-12 h-12 text-slate-300" />
        <div>
          <p className="text-slate-500 font-medium text-sm">No patients yet today</p>
          <p className="text-slate-400 text-sm mt-1">
            Patients checked in via the intake iPad will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Column headers */}
      <div className="flex items-center gap-5 px-6 py-3 bg-slate-50 border-b border-slate-100">
        <div className="w-11 shrink-0" />
        <div className="flex-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient</div>
        <div className="hidden xl:block w-40 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</div>
        <div className="w-28 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Check-in</div>
        <div className="w-44 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Status</div>
      </div>
      <AnimatePresence initial={false}>
        {patients.map((patient) => (
          <PatientRow
            key={patient.id}
            patient={patient}
            onClick={() => onSelect(patient)}
            isSelected={selectedId === patient.id}
            now={now}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
