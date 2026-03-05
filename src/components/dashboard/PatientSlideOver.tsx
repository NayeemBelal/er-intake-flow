'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import PatientDetail from './PatientDetail'
import type { Patient } from '@/types/patient'

interface PatientSlideOverProps {
  patient: Patient | null
  onClose: () => void
}

export default function PatientSlideOver({ patient, onClose }: PatientSlideOverProps) {
  return (
    <AnimatePresence>
      {patient && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 z-10 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <PatientDetail patient={patient} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
