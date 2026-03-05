'use client'

import { motion } from 'framer-motion'

interface StepIndicatorProps {
  currentStep: number // 1, 2, or 3 (done)
}

const steps = ['Basic Info', 'Photos', 'Done']

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-start w-full">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isCompleted = currentStep > stepNum
        const isActive = currentStep === stepNum

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  isCompleted || isActive ? 'bg-white' : 'bg-slate-600'
                }`}
              />
              <span
                className={`text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                  isActive ? 'text-white' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-slate-700 mx-3 relative overflow-hidden mb-5">
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: currentStep > stepNum ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
