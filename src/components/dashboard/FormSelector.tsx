'use client'

import { Checkbox } from '@/components/ui/checkbox'

const FORMS = [
  { id: 'registration', label: 'Registration Packet', alwaysChecked: true },
  { id: 'mva', label: 'MVA Forms', alwaysChecked: false },
  { id: 'workers_comp', label: "Workers' Comp Forms", alwaysChecked: false },
]

interface FormSelectorProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function FormSelector({ selected, onChange }: FormSelectorProps) {
  const toggle = (id: string) => {
    if (id === 'registration') return
    if (selected.includes(id)) {
      onChange(selected.filter((f) => f !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-3">
      {FORMS.map((form) => {
        const checked = form.alwaysChecked || selected.includes(form.id)
        return (
          <label
            key={form.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${
              checked ? 'bg-slate-50' : 'hover:bg-slate-50'
            } ${form.alwaysChecked ? 'cursor-default opacity-80' : ''}`}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={() => toggle(form.id)}
              disabled={form.alwaysChecked}
              className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
            />
            <span className="text-sm font-medium text-slate-700">{form.label}</span>
            {form.alwaysChecked && (
              <span className="ml-auto text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                Required
              </span>
            )}
          </label>
        )
      })}
    </div>
  )
}
