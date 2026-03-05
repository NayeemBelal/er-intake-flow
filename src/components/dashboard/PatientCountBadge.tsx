'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface PatientCountBadgeProps {
  count: number
}

export default function PatientCountBadge({ count }: PatientCountBadgeProps) {
  return (
    <span className="flex items-center gap-1.5 bg-slate-700 text-slate-300 rounded-md px-2.5 py-1 text-sm font-medium tabular-nums overflow-hidden">
      <span className="text-slate-500 text-xs">patients</span>
      <span className="relative flex h-5 items-center overflow-hidden min-w-[1.5ch]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={count}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="block"
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  )
}
