'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Phone, Calendar, FileText, ClipboardList, Download, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PhotoThumbnail from './PhotoThumbnail'
import FormSelector from './FormSelector'
import SendFormsButton from './SendFormsButton'
import type { Patient } from '@/types/patient'

interface PatientDetailProps {
  patient: Patient
  onClose: () => void
}

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function PatientDetail({ patient, onClose }: PatientDetailProps) {
  const router = useRouter()
  const [selectedForms, setSelectedForms] = useState<string[]>(
    patient.forms_to_send.length > 0 ? patient.forms_to_send : ['registration']
  )

  // Keep forms in sync if patient updates
  useEffect(() => {
    setSelectedForms(patient.forms_to_send.length > 0 ? patient.forms_to_send : ['registration'])
  }, [patient.forms_to_send])

  const age = calculateAge(patient.dob)
  const timeAgo = formatDistanceToNow(new Date(patient.created_at), { addSuffix: true })
  const dobFormatted = format(new Date(patient.dob), 'MMM d, yyyy')

  const handleDownload = () => {
    window.open(`/api/patients/${patient.id}/download`, '_blank')
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Patient header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 leading-tight">{patient.name}</h2>
        <p className="text-sm text-slate-400 mt-0.5">Registered {timeAgo}</p>
      </div>

      {/* Info grid */}
      <div className="px-6 py-4 border-b border-slate-100 space-y-3">
        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Date of Birth</p>
            <p className="text-sm text-slate-700 font-medium">{dobFormatted} <span className="text-slate-400 font-normal">({age} years)</span></p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Phone</p>
            <p className="text-sm text-slate-700 font-medium">{patient.phone}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Reason for Visit</p>
            <p className="text-sm text-slate-700">{patient.reason}</p>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Documents</p>
        <div className="flex gap-3">
          <PhotoThumbnail url={patient.id_photo_url} label="ID" />
          <PhotoThumbnail url={patient.insurance_photo_url} label="Insurance" />
        </div>
      </div>

      {/* Forms to send */}
      {(patient.status === 'waiting_for_forms' || patient.status === 'filling_forms') && (
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Forms to Send</p>
          <FormSelector selected={selectedForms} onChange={setSelectedForms} />
        </div>
      )}

      {/* CTAs */}
      <div className="px-6 py-4 space-y-3 mt-auto">
        {(patient.status === 'waiting_for_forms' || patient.status === 'filling_forms') && (
          <SendFormsButton
            patientId={patient.id}
            selectedForms={selectedForms}
            onSuccess={onClose}
          />
        )}

        {patient.status === 'submitted' && (
          <button
            onClick={() => router.push(`/audit/${patient.id}`)}
            className="w-full flex items-center justify-center gap-2.5 h-11 rounded-lg bg-violet-600 text-white text-sm font-semibold tracking-wide hover:bg-violet-700 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            Review &amp; Audit Forms
          </button>
        )}

        {patient.status === 'audited' && (
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2.5 h-11 rounded-lg bg-emerald-600 text-white text-sm font-semibold tracking-wide hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Final PDF
          </button>
        )}

        {patient.status === 'audited' && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">Intake complete</span>
          </div>
        )}
      </div>
    </div>
  )
}
