'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface ThankYouScreenProps {
  phone: string
  onReset: () => void
}

const COUNTDOWN_SECONDS = 30

export default function ThankYouScreen({ phone, onReset }: ThankYouScreenProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onReset()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [onReset])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center text-center gap-8 py-8"
    >
      {/* Checkmark with glow */}
      <div className="relative flex items-center justify-center w-32 h-32">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-3xl scale-150" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className="relative w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-400/60 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-14 h-14" fill="none">
            <motion.path
              d="M4 12.5L9.5 18L20 7"
              stroke="#34d399"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white tracking-tight">You&apos;re all checked in</h2>
        <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
          Watch for a text message at{' '}
          <span className="text-white font-mono">{phone}</span>
          <br />
          with a link to complete your forms.
        </p>
      </div>

      <div className="space-y-3 w-full max-w-xs">
        <button
          onClick={onReset}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold text-base h-12 rounded-xl transition-colors cursor-pointer"
        >
          Return to Start
        </button>
        <p className="text-slate-600 text-sm font-mono">
          Returning to start in {countdown}s…
        </p>
      </div>
    </motion.div>
  )
}
