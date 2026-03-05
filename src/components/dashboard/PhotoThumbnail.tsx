'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ImageOff } from 'lucide-react'
import Image from 'next/image'

interface PhotoThumbnailProps {
  url: string | null
  label: string
}

export default function PhotoThumbnail({ url, label }: PhotoThumbnailProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center w-[140px] h-[90px] rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 gap-1">
        <ImageOff className="w-5 h-5 text-slate-300" />
        <span className="text-[10px] text-slate-400 font-medium">{label}</span>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setLightboxOpen(true)}
        className="relative w-[140px] h-[90px] rounded-lg overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-shadow group"
      >
        <Image
          src={url}
          alt={label}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        <span className="absolute bottom-1 left-1.5 text-[9px] font-semibold text-white bg-black/40 rounded px-1 py-0.5 uppercase tracking-wide">
          {label}
        </span>
      </button>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-8"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full rounded-xl overflow-hidden shadow-2xl"
            >
              <Image src={url} alt={label} width={800} height={600} className="w-full object-contain" />
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
