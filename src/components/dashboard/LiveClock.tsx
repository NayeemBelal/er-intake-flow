'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function LiveClock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!time) return null

  const dateStr = format(time, 'EEE dd MMM').toUpperCase()
  const timeStr = format(time, 'HH:mm:ss')

  return (
    <span
      className="text-slate-400 text-sm tracking-wider tabular-nums"
      style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}
    >
      {dateStr}&nbsp;&nbsp;{timeStr}
    </span>
  )
}
