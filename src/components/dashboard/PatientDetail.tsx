'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Phone, Calendar, FileText, ClipboardList, Download, Search, Check, Copy } from 'lucide-react'
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

const PROVIDERS = [
  'REDDY, VIDYASAGAR, MD',
]

function ChecklistItem({
  checked,
  onToggle,
  children,
}: {
  checked: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
          checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>
      <div className={`flex-1 transition-opacity ${checked ? 'opacity-50' : ''}`}>{children}</div>
    </div>
  )
}

export default function PatientDetail({ patient, onClose }: PatientDetailProps) {
  const router = useRouter()
  const [selectedForms, setSelectedForms] = useState<string[]>(
    patient.forms_to_send.length > 0 ? patient.forms_to_send : ['registration']
  )

  // Phase 1 checklist state
  const [ePowerDocsAdded, setEPowerDocsAdded] = useState(false)
  const [mrn, setMrn] = useState('')
  const [acct, setAcct] = useState('')
  const [providerSelected, setProviderSelected] = useState(false)
  const [provider, setProvider] = useState('')
  const [teamNotified, setTeamNotified] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [copied, setCopied] = useState(false)

  // Phase 2 checklist state
  const [idCollected, setIdCollected] = useState(false)
  const [insuranceCollected, setInsuranceCollected] = useState(false)
  const [formsCompleted, setFormsCompleted] = useState(false)
  const [availityPulled, setAvailityPulled] = useState(false)

  // Phase 3 checklist state
  const [demographicsReviewed, setDemographicsReviewed] = useState(false)
  const [insuranceLogUpdated, setInsuranceLogUpdated] = useState(false)
  const [insuranceLogCopied, setInsuranceLogCopied] = useState(false)
  const [faceSheetPrinted, setFaceSheetPrinted] = useState(false)

  // Phase 4 checklist state
  const [chartAssembled, setChartAssembled] = useState(false)
  const [scannedIntoEPowerDocs, setScannedIntoEPowerDocs] = useState(false)
  const [chartReadyForAudit, setChartReadyForAudit] = useState(false)

  // Keep forms in sync if patient updates
  useEffect(() => {
    setSelectedForms(patient.forms_to_send.length > 0 ? patient.forms_to_send : ['registration'])
  }, [patient.forms_to_send])

  const age = calculateAge(patient.dob)
  const timeAgo = formatDistanceToNow(new Date(patient.created_at), { addSuffix: true })
  const dobFormatted = format(new Date(patient.dob), 'MMM d, yyyy')
  const visitTime = format(new Date(patient.created_at), 'h:mm a')

  const notificationText = `${patient.name}\n${visitTime}\n${age}Y\n${patient.reason}`
  const insuranceLogNote = `${format(new Date(), 'M/d/yyyy')} SB IN ACTIVE. ERCOPY 0.`

  const handleDownload = () => {
    window.open(`/api/patients/${patient.id}/download`, '_blank')
  }

  const handleCopyNotification = () => {
    navigator.clipboard.writeText(notificationText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyInsuranceLog = () => {
    navigator.clipboard.writeText(insuranceLogNote)
    setInsuranceLogCopied(true)
    setTimeout(() => setInsuranceLogCopied(false), 2000)
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

      {/* Intake Checklist */}
      <div className="px-6 py-4 border-b border-slate-100">
        {/* Phase 1 — Check-In */}
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Phase 1 — Check-In</p>
        <div className="space-y-5">

          {/* 1. Add to ePowerDocs */}
          <ChecklistItem checked={ePowerDocsAdded} onToggle={() => setEPowerDocsAdded(!ePowerDocsAdded)}>
            <p className="text-sm font-medium text-slate-700">Add patient to ePowerDocs board</p>
            <p className="text-xs text-slate-400 mt-0.5">After adding, enter the MRN and ACCT # from ePowerDocs:</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-xs text-slate-400 font-medium">MRN</label>
                <input
                  value={mrn}
                  onChange={e => setMrn(e.target.value)}
                  placeholder="e.g. 14966"
                  className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">ACCT #</label>
                <input
                  value={acct}
                  onChange={e => setAcct(e.target.value)}
                  placeholder="e.g. 10022"
                  className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
          </ChecklistItem>

          {/* 2. Select provider & print labels */}
          <ChecklistItem checked={providerSelected} onToggle={() => setProviderSelected(!providerSelected)}>
            <p className="text-sm font-medium text-slate-700">Select provider &amp; print labels</p>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="w-full mt-2 px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white text-slate-700"
            >
              <option value="">Select provider...</option>
              {PROVIDERS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </ChecklistItem>

          {/* 3. Send team notification */}
          <ChecklistItem checked={teamNotified} onToggle={() => setTeamNotified(!teamNotified)}>
            <p className="text-sm font-medium text-slate-700">Send team notification</p>
            <div className="mt-2 p-2.5 bg-slate-50 rounded-md border border-slate-200">
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">{notificationText}</pre>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCopyNotification}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-500 rounded-md hover:bg-teal-600 transition-colors">
                Post to Comms
              </button>
            </div>
          </ChecklistItem>

          {/* 4. Send registration link */}
          <ChecklistItem checked={linkSent} onToggle={() => setLinkSent(!linkSent)}>
            <p className="text-sm font-medium text-slate-700">Send registration link to patient</p>
            <p className="text-xs text-slate-400 mt-0.5">Patient will complete forms on their phone.</p>
            {!linkSent && (
              <button
                onClick={() => setLinkSent(true)}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 transition-colors"
              >
                <Check className="w-3 h-3" />
                Mark Link Sent
              </button>
            )}
          </ChecklistItem>
        </div>

        {/* Phase 2 — Document Collection */}
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-6 mb-4">Phase 2 — Document Collection</p>
        <div className="space-y-3">
          <ChecklistItem checked={idCollected} onToggle={() => setIdCollected(!idCollected)}>
            <p className="text-sm font-medium text-slate-700">ID collected</p>
          </ChecklistItem>
          <ChecklistItem checked={insuranceCollected} onToggle={() => setInsuranceCollected(!insuranceCollected)}>
            <p className="text-sm font-medium text-slate-700">Insurance card collected</p>
          </ChecklistItem>
          <ChecklistItem checked={formsCompleted} onToggle={() => setFormsCompleted(!formsCompleted)}>
            <p className="text-sm font-medium text-slate-700">Registration forms completed</p>
          </ChecklistItem>
          <ChecklistItem checked={availityPulled} onToggle={() => setAvailityPulled(!availityPulled)}>
            <p className="text-sm font-medium text-slate-700">Availity verification pulled</p>
          </ChecklistItem>
        </div>

        {/* Phase 3 — Admin Review */}
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-6 mb-4">Phase 3 — Admin Review</p>
        <div className="space-y-5">
          <ChecklistItem checked={demographicsReviewed} onToggle={() => setDemographicsReviewed(!demographicsReviewed)}>
            <p className="text-sm font-medium text-slate-700">Review demographics in ePowerDocs</p>
          </ChecklistItem>
          <ChecklistItem checked={insuranceLogUpdated} onToggle={() => setInsuranceLogUpdated(!insuranceLogUpdated)}>
            <p className="text-sm font-medium text-slate-700">Update insurance log note</p>
            <div className="flex gap-2 mt-2 items-center">
              <div className="flex-1 px-2.5 py-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md font-mono">
                {insuranceLogNote}
              </div>
              <button
                onClick={handleCopyInsuranceLog}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors flex-shrink-0"
              >
                {insuranceLogCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {insuranceLogCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </ChecklistItem>
          <ChecklistItem checked={faceSheetPrinted} onToggle={() => setFaceSheetPrinted(!faceSheetPrinted)}>
            <p className="text-sm font-medium text-slate-700">Print face sheet</p>
          </ChecklistItem>
        </div>

        {/* Phase 4 — Chart Assembly & Scan */}
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-6 mb-4">Phase 4 — Chart Assembly &amp; Scan</p>
        <div className="space-y-3">
          <ChecklistItem checked={chartAssembled} onToggle={() => setChartAssembled(!chartAssembled)}>
            <p className="text-sm font-medium text-slate-700">Assemble chart &amp; sticker pages</p>
          </ChecklistItem>
          <ChecklistItem checked={scannedIntoEPowerDocs} onToggle={() => setScannedIntoEPowerDocs(!scannedIntoEPowerDocs)}>
            <p className="text-sm font-medium text-slate-700">Scan into ePowerDocs</p>
          </ChecklistItem>
          <ChecklistItem checked={chartReadyForAudit} onToggle={() => setChartReadyForAudit(!chartReadyForAudit)}>
            <p className="text-sm font-medium text-slate-700">Chart ready for audit</p>
          </ChecklistItem>
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

        {(patient.status === 'submitted' || patient.status === 'audited') && (
          <button
            onClick={() => router.push(`/audit/${patient.id}`)}
            className="w-full flex items-center justify-center gap-2.5 h-11 rounded-lg bg-violet-600 text-white text-sm font-semibold tracking-wide hover:bg-violet-700 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            {patient.status === 'audited' ? 'Re-Audit Forms' : 'Review & Audit Forms'}
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
