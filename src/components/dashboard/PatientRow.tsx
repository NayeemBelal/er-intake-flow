'use client'

import { motion } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import { Phone } from 'lucide-react'
import StatusBadge from './StatusBadge'
import type { Patient } from '@/types/patient'

const STATUS_BORDER_COLORS: Record<Patient['status'], string> = {
  waiting_for_forms: '#F59E0B',
  filling_forms: '#3B82F6',
  submitted: '#8B5CF6',
  audited: '#10B981',
}

const STATUS_AVATAR_COLORS: Record<Patient['status'], string> = {
  waiting_for_forms: 'bg-amber-100 text-amber-700',
  filling_forms: 'bg-blue-100 text-blue-700',
  submitted: 'bg-violet-100 text-violet-700',
  audited: 'bg-emerald-100 text-emerald-700',
}

interface PatientRowProps {
  patient: Patient
  onClick: () => void
  isSelected: boolean
  now: Date
}

function isNew(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 5 * 60 * 1000
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function PatientRow({ patient, onClick, isSelected }: PatientRowProps) {
  const borderColor = STATUS_BORDER_COLORS[patient.status]
  const avatarColor = STATUS_AVATAR_COLORS[patient.status]
  const timeAgo = formatDistanceToNow(new Date(patient.created_at), { addSuffix: true })
  const timeIn = format(new Date(patient.created_at), 'h:mm a')
  const newPatient = isNew(patient.created_at)

  return (
    <motion.div
      layout
      layoutId={patient.id}
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      onClick={onClick}
      className={`flex items-center gap-5 px-6 py-5 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors duration-150 ${
        isSelected ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50/60'
      }`}
      style={{
        borderLeft: `4px solid ${borderColor}`,
        transition: 'border-color 600ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms',
      }}
    >
      {/* Avatar */}
      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor}`}>
        {getInitials(patient.name)}
      </div>

      {/* Name + reason */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-slate-900 text-base leading-none">{patient.name}</span>
          {newPatient && (
            <span className="text-[9px] font-bold bg-blue-500 text-white rounded-full px-2 py-0.5 uppercase tracking-wide">
              NEW
            </span>
          )}
        </div>
        <p className="text-slate-500 text-sm truncate">{patient.reason}</p>
      </div>

      {/* Phone */}
      <div className="hidden xl:flex items-center gap-1.5 text-slate-400 w-40 shrink-0">
        <Phone className="w-3.5 h-3.5 shrink-0" />
        <span className="text-sm tabular-nums">{patient.phone}</span>
      </div>

      {/* Time */}
      <div className="text-right shrink-0 w-28">
        <p className="text-slate-700 text-sm font-medium tabular-nums" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
          {timeIn}
        </p>
        <p className="text-slate-400 text-xs mt-0.5">{timeAgo}</p>
      </div>

      {/* Status badge */}
      <div className="shrink-0 w-44 flex justify-end">
        <StatusBadge status={patient.status} />
      </div>
    </motion.div>
  )
}
