import LiveClock from './LiveClock'
import PatientCountBadge from './PatientCountBadge'

interface DashboardHeaderProps {
  patientCount: number
}

export default function DashboardHeader({ patientCount }: DashboardHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900 flex items-center justify-between px-6 border-b border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
        <span
          className="text-white font-semibold tracking-widest text-sm uppercase"
          style={{ fontFamily: 'var(--font-geist)' }}
        >
          ER Intake System
        </span>
      </div>

      {/* Center: count badge */}
      <PatientCountBadge count={patientCount} />

      {/* Right: live clock */}
      <LiveClock />
    </header>
  )
}
