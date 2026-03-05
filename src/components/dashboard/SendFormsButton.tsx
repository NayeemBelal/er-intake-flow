'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Check, AlertCircle } from 'lucide-react'

type ButtonState = 'idle' | 'loading' | 'success' | 'error'

interface SendFormsButtonProps {
  patientId: string
  selectedForms: string[]
  onSuccess: () => void
}

export default function SendFormsButton({ patientId, selectedForms, onSuccess }: SendFormsButtonProps) {
  const [state, setState] = useState<ButtonState>('idle')

  const handleClick = async () => {
    if (state !== 'idle') return
    setState('loading')

    try {
      const res = await fetch('/api/send-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, forms: selectedForms }),
      })

      if (!res.ok) throw new Error('Failed')

      setState('success')
      setTimeout(() => {
        onSuccess()
      }, 1200)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }
  }

  const variants = {
    idle: { backgroundColor: '#0F172A' },
    loading: { backgroundColor: '#1E293B' },
    success: { backgroundColor: '#059669' },
    error: { backgroundColor: '#DC2626' },
  }

  const labels: Record<ButtonState, { icon: React.ReactNode; text: string }> = {
    idle: { icon: <Send className="w-4 h-4" />, text: 'Send Forms via SMS' },
    loading: { icon: <Loader2 className="w-4 h-4 animate-spin" />, text: 'Sending...' },
    success: { icon: <Check className="w-4 h-4" />, text: 'Sent!' },
    error: { icon: <AlertCircle className="w-4 h-4" />, text: 'Failed — Try Again' },
  }

  const { icon, text } = labels[state]

  return (
    <motion.button
      animate={variants[state]}
      transition={{ duration: 0.25 }}
      onClick={handleClick}
      disabled={state === 'loading' || state === 'success'}
      className="w-full flex items-center justify-center gap-2.5 h-11 rounded-lg text-white text-sm font-semibold tracking-wide transition-opacity disabled:opacity-80 cursor-pointer disabled:cursor-not-allowed hover:opacity-90"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2.5"
        >
          {icon}
          {text}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
