import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface OnboardingTourProps {
  onComplete: () => void
}

interface TourStep {
  icon: string
  iconBg: string
  title: string
  body: string
  cta?: string
}

const STEPS: TourStep[] = [
  {
    icon: '🎓',
    iconBg: '#00D4FF',
    title: 'Your 16-Week Learning Journey',
    body: 'This app walks you through SQL and Python side-by-side — from zero to senior-level thinking. Sage, your AI tutor, is always one click away.',
  },
  {
    icon: '⌂',
    iconBg: '#39D353',
    title: 'Track Your Progress',
    body: 'The Dashboard shows your XP, streak, mastery meters, and a 16-week course map. Green dots = completed weeks. Click any unlocked week to jump to its lesson.',
  },
  {
    icon: '📖',
    iconBg: '#FFB347',
    title: 'Read, Then Practice',
    body: 'Each week has a full lesson covering both SQL and Python. Read it, mark sections you understand, then click "Mark as Read" at the bottom to earn XP.',
  },
  {
    icon: '⌨',
    iconBg: '#00D4FF',
    title: 'Write Real Code',
    body: 'The editor runs SQL (via SQLite in the browser) and Python (via Pyodide). No setup needed — write, run, and get instant feedback.',
  },
  {
    icon: '🛠',
    iconBg: '#FFB347',
    title: 'Mini-Projects: Real Work, Not Exercises',
    body: "Some weeks unlock a Mini-Project — a task framed as a real Slack message from your manager. You plan it, build SQL + Python solutions, test your work, then submit for Sage to grade on correctness, readability, efficiency, and how well you explained your decisions. It's the closest thing to an actual job ticket.",
  },
  {
    icon: '✦',
    iconBg: '#00D4FF',
    title: 'Your Always-On Mentor',
    body: "Sage knows exactly what week and topic you're on. Ask anything — it won't just give you the answer, it'll guide you to find it yourself, using analogies that match your background.",
  },
  {
    icon: '✓',
    iconBg: '#39D353',
    title: "Let's start with Week 1",
    body: 'Your progress is saved automatically. Come back every day to build your streak. Sage is ready whenever you are.',
    cta: 'Start Learning →',
  },
]

const STEP_LABELS = [
  'Welcome',
  'Dashboard',
  'Lessons',
  'Editor',
  'Projects',
  'Sage AI',
  "You're set!",
]

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: -12,
    transition: { duration: 0.18 },
  },
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function handleNext() {
    if (isLast) {
      onComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(4px)' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-md rounded-2xl border p-8"
          style={{
            backgroundColor: '#161B22',
            borderColor: '#30363D',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}
        >
          {/* Skip button */}
          <button
            onClick={onComplete}
            className="absolute top-4 right-4 text-xs font-mono transition-colors"
            style={{ color: '#8B949E' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8B949E')}
          >
            Skip
          </button>

          {/* Step label */}
          <p className="text-xs font-mono mb-6" style={{ color: '#8B949E' }}>
            Step {step + 1} of {STEPS.length} — {STEP_LABELS[step]}
          </p>

          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6"
            style={{
              backgroundColor: `${current.iconBg}18`,
              border: `1.5px solid ${current.iconBg}40`,
              color: current.iconBg,
            }}
          >
            {/* Special treatment for Sage's ✦ icon */}
            {current.icon === '✦' ? (
              <span
                className="text-2xl font-bold"
                style={{ color: '#00D4FF', textShadow: '0 0 12px #00D4FF88' }}
              >
                ✦
              </span>
            ) : (
              <span>{current.icon}</span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-display font-bold mb-3" style={{ color: '#ffffff' }}>
            {current.title}
          </h2>

          {/* Body */}
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#8B949E' }}>
            {current.body}
          </p>

          {/* Step dots */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === step ? '20px' : '8px',
                  height: '8px',
                  backgroundColor: i <= step ? '#00D4FF' : '#30363D',
                }}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* CTA button */}
          <motion.button
            onClick={handleNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-xl text-sm font-mono font-semibold transition-all"
            style={{
              backgroundColor: '#00D4FF',
              color: '#0D1117',
            }}
          >
            {isLast ? (current.cta ?? 'Start Learning →') : 'Next →'}
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
