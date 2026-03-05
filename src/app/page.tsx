'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Clock, Users, FileText, CheckCircle2, Hourglass } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/dashboard/Sidebar'
import PatientQueue from '@/components/dashboard/PatientQueue'
import PatientSlideOver from '@/components/dashboard/PatientSlideOver'
import type { Patient, PatientStatus } from '@/types/patient'

const STAT_CARDS: {
  label: string
  status: PatientStatus | 'all'
  icon: React.ElementType
  color: string
  bg: string
  border: string
}[] = [
  { label: 'Total Today', status: 'all', icon: Users, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  { label: 'Waiting', status: 'waiting_for_forms', icon: Hourglass, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { label: 'Filling Forms', status: 'filling_forms', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { label: 'Submitted', status: 'submitted', icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  { label: 'Audited', status: 'audited', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
]

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setPatients(data as Patient[])
    }
    fetchPatients()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('patients-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'patients' }, (payload) => {
        setPatients((prev) => [payload.new as Patient, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'patients' }, (payload) => {
        const updated = payload.new as Patient
        setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        setSelectedPatient((prev) => (prev?.id === updated.id ? updated : prev))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleSelectPatient = useCallback((patient: Patient) => {
    setSelectedPatient((prev) => (prev?.id === patient.id ? null : patient))
  }, [])

  const handleCloseSlideOver = useCallback(() => setSelectedPatient(null), [])

  const getCount = (status: PatientStatus | 'all') =>
    status === 'all' ? patients.length : patients.filter((p) => p.status === status).length

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F1F5F9', fontFamily: 'var(--font-geist)' }}>
      {/* Sidebar */}
      <Sidebar patients={patients} />

      {/* Main */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 bg-white/60 backdrop-blur-sm sticky top-0 z-30">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Today&apos;s Queue</h1>
            <p className="text-slate-500 text-sm mt-0.5">{format(now, 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 py-6 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-5 gap-4">
            {STAT_CARDS.map(({ label, status, icon: Icon, color, bg, border }) => (
              <div
                key={status}
                className={`rounded-2xl border ${border} ${bg} px-5 py-4`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-500">{label}</span>
                  <div className={`w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p
                  className={`text-3xl font-bold tabular-nums ${color}`}
                  style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}
                >
                  {getCount(status)}
                </p>
              </div>
            ))}
          </div>

          {/* Patient table */}
          <PatientQueue
            patients={patients}
            selectedId={selectedPatient?.id ?? null}
            onSelect={handleSelectPatient}
            now={now}
          />
        </div>
      </main>

      {/* Slide-over */}
      <PatientSlideOver patient={selectedPatient} onClose={handleCloseSlideOver} />
    </div>
  )
}
