import { useEffect } from 'react'
import { motion } from 'framer-motion'

interface Props {
  message:   string
  onDismiss: () => void
  duration?: number
}

export default function Toast({ message, onDismiss, duration = 2400 }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [duration, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 12, scale: 0.92  }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] pointer-events-none"
      style={{ width: 'max-content', maxWidth: 280 }}
    >
      <div
        className="px-4 py-2.5 rounded-2xl text-white text-[13px] font-semibold text-center"
        style={{
          background:    'rgba(26,26,26,0.88)',
          backdropFilter: 'blur(14px)',
          boxShadow:      '0 8px 24px rgba(0,0,0,0.28)',
        }}
      >
        {message}
      </div>
    </motion.div>
  )
}
