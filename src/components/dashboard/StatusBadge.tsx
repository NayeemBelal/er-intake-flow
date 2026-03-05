import { Check } from 'lucide-react'
import type { PatientStatus } from '@/types/patient'

interface StatusConfig {
  label: string
  dotClass: string
  badgeClass: string
  pulse: boolean
  icon?: typeof Check
}

const STATUS_CONFIG: Record<PatientStatus, StatusConfig> = {
  waiting_for_forms: {
    label: 'Waiting for Forms',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
    pulse: true,
  },
  filling_forms: {
    label: 'Filling Forms',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    pulse: false,
  },
  submitted: {
    label: 'Forms Submitted',
    dotClass: 'bg-violet-500',
    badgeClass: 'bg-violet-50 text-violet-700 border border-violet-200',
    pulse: false,
  },
  audited: {
    label: 'Audited',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pulse: false,
    icon: Check,
  },
}

interface StatusBadgeProps {
  status: PatientStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <span
      className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${config.badgeClass}`}
    >
      <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
        {config.pulse && (
          <span
            className={`badge-pulse-ring absolute inline-flex h-full w-full rounded-full ${config.dotClass} opacity-75`}
          />
        )}
        {Icon ? (
          <Icon className={`h-2.5 w-2.5 ${config.dotClass.replace('bg-', 'text-')}`} strokeWidth={3} />
        ) : (
          <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dotClass}`} />
        )}
      </span>
      {config.label}
    </span>
  )
}
