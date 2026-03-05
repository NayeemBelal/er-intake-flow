'use client'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export function FormThankYou({ patientName }: { patientName: string }) {
  const firstName = patientName.split(' ')[0]

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center max-w-sm"
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
          className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Check size={40} className="text-emerald-500" strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Forms submitted!</h1>
          <p className="text-slate-500 leading-relaxed">
            Thank you, {firstName}. Your forms have been received and are being reviewed.
          </p>
          <p className="text-slate-400 text-sm mt-5">You can close this window.</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
