'use client'

import { LayoutDashboard, Tablet, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import LiveClock from './LiveClock'
import type { Patient, PatientStatus } from '@/types/patient'

const STATUS_LABELS: Record<PatientStatus, string> = {
  waiting_for_forms: 'Waiting',
  filling_forms: 'Filling',
  submitted: 'Submitted',
  audited: 'Audited',
}

const STATUS_DOT_COLORS: Record<PatientStatus, string> = {
  waiting_for_forms: 'bg-amber-400',
  filling_forms: 'bg-blue-400',
  submitted: 'bg-violet-400',
  audited: 'bg-emerald-400',
}

const ALL_STATUSES: PatientStatus[] = ['waiting_for_forms', 'filling_forms', 'submitted', 'audited']

const NAV = [
  { icon: LayoutDashboard, label: 'Queue', href: '/', active: true },
  { icon: Tablet, label: 'Intake Kiosk', href: '/intake', active: false },
  { icon: ClipboardCheck, label: 'Audit', href: '#', active: false },
]

interface SidebarProps {
  patients: Patient[]
}

export default function Sidebar({ patients }: SidebarProps) {
  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = patients.filter((p) => p.status === s).length
    return acc
  }, {} as Record<PatientStatus, number>)

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-slate-900 flex flex-col z-50 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-800 shrink-0">
        <div className="relative w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="absolute inset-0 rounded-lg ring-1 ring-red-500/30" />
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-wide leading-none">ER Intake</p>
          <p className="text-slate-500 text-[11px] mt-0.5 tracking-widest uppercase">System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 pt-6 pb-4 border-b border-slate-800">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
        {NAV.map(({ icon: Icon, label, href, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
            {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400" />}
          </Link>
        ))}
      </nav>

      {/* Status breakdown */}
      <div className="px-3 py-5 border-b border-slate-800">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">Status</p>
        <div className="space-y-1">
          {ALL_STATUSES.map((status) => (
            <div key={status} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[status]}`} />
              <span className="text-slate-400 text-sm flex-1">{STATUS_LABELS[status]}</span>
              <span className="text-slate-300 text-sm font-semibold tabular-nums" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
                {counts[status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="px-6 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-sm">Total today</span>
          <span className="text-white text-lg font-bold tabular-nums" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
            {patients.length}
          </span>
        </div>
      </div>

      {/* Clock at bottom */}
      <div className="mt-auto px-6 py-5 border-t border-slate-800">
        <LiveClock />
      </div>
    </aside>
  )
}
