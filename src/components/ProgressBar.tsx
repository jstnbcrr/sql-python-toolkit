import React from 'react'
import { motion } from 'framer-motion'

type ProgressBarColor = 'sql' | 'python' | 'success' | 'warning'
type ProgressBarSize = 'sm' | 'md' | 'lg'

interface ProgressBarProps {
  value: number
  max?: number
  color?: ProgressBarColor
  label?: string
  showValue?: boolean
  size?: ProgressBarSize
}

const COLOR_MAP: Record<ProgressBarColor, { bar: string; glow: string; text: string }> = {
  sql: {
    bar: 'bg-[#00D4FF]',
    glow: 'shadow-[0_0_12px_rgba(0,212,255,0.6)]',
    text: 'text-[#00D4FF]',
  },
  python: {
    bar: 'bg-[#FFB347]',
    glow: 'shadow-[0_0_12px_rgba(255,179,71,0.6)]',
    text: 'text-[#FFB347]',
  },
  success: {
    bar: 'bg-[#39D353]',
    glow: 'shadow-[0_0_12px_rgba(57,211,83,0.6)]',
    text: 'text-[#39D353]',
  },
  warning: {
    bar: 'bg-amber-400',
    glow: 'shadow-[0_0_12px_rgba(251,191,36,0.6)]',
    text: 'text-amber-400',
  },
}

const SIZE_MAP: Record<ProgressBarSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'sql',
  label,
  showValue = false,
  size = 'md',
}) => {
  const clampedValue = Math.min(Math.max(value, 0), max)
  const pct = max > 0 ? (clampedValue / max) * 100 : 0
  const colors = COLOR_MAP[color]
  const heightClass = SIZE_MAP[size]

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs font-mono text-[#8B949E] tracking-wide uppercase">
              {label}
            </span>
          )}
          {showValue && (
            <span className={`text-xs font-mono font-semibold ${colors.text}`}>
              {value}/{max}
            </span>
          )}
        </div>
      )}

      <div
        className={`w-full ${heightClass} rounded-full bg-[#21262D] overflow-hidden`}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <motion.div
          className={`h-full rounded-full ${colors.bar} ${colors.glow}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{
            type: 'spring',
            stiffness: 60,
            damping: 18,
            mass: 0.8,
          }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
