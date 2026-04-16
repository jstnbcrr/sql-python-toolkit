import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProgressStore } from '@/store/progress'
import { gradeAssessment } from '@/api/sage'

// ─── icons ────────────────────────────────────────────────────────────────────

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
  </svg>
)

// ─── types ────────────────────────────────────────────────────────────────────

type QuestionType = 'multiple_choice' | 'fill_blank' | 'code'

interface Question {
  id: number
  type: QuestionType
  question: string
  options?: string[]
  answer: string
  hint?: string
}

interface PhaseGateProps {
  phase: 1 | 2 | 3 | 4
  onPass?: (score: number) => void
  onFail?: (score: number) => void
}

type ScreenState = 'pre-start' | 'assessment' | 'review' | 'grading' | 'results'

// ─── Phase 1 questions ────────────────────────────────────────────────────────

const PHASE_1_QUESTIONS: Question[] = [
  {
    id: 1,
    type: 'multiple_choice',
    question: 'What does `SELECT * FROM menu_items WHERE category_id = 2` do?',
    options: [
      'A) Returns all columns from menu_items where category_id equals 2',
      'B) Updates rows where category_id is 2',
      'C) Deletes rows in category 2',
      'D) Creates a new table',
    ],
    answer: 'A',
  },
  {
    id: 2,
    type: 'fill_blank',
    question: 'Complete the query to get all items with price > 5:\n\nSELECT name, price FROM menu_items _____ price > 5',
    answer: 'WHERE',
    hint: 'This keyword filters rows based on a condition.',
  },
  {
    id: 3,
    type: 'multiple_choice',
    question: 'Which JOIN type returns ALL rows from the left table even when there\'s no match in the right table?',
    options: [
      'A) INNER JOIN',
      'B) LEFT JOIN',
      'C) RIGHT JOIN',
      'D) CROSS JOIN',
    ],
    answer: 'B',
  },
  {
    id: 4,
    type: 'code',
    question: 'Write a SQL query that counts how many items are in each category. Use COUNT(*) and GROUP BY.',
    answer: 'SELECT category_id, COUNT(*) FROM menu_items GROUP BY category_id;',
  },
  {
    id: 5,
    type: 'multiple_choice',
    question: 'In Python, what does this return?\n\n`[x for x in [1,2,3,4,5] if x > 3]`',
    options: [
      'A) [1,2,3]',
      'B) [4,5]',
      'C) [3,4,5]',
      'D) [True, True]',
    ],
    answer: 'B',
  },
  {
    id: 6,
    type: 'fill_blank',
    question: "To access the 3rd element of a Python list called 'items', you write:\n\nitems[___]",
    answer: '2',
    hint: 'Python uses zero-based indexing.',
  },
  {
    id: 7,
    type: 'code',
    question: "Write Python code using a for loop to sum all numbers in a list called 'prices'.",
    answer: 'total = 0\nfor p in prices:\n    total += p',
  },
  {
    id: 8,
    type: 'multiple_choice',
    question: 'What does NULL mean in SQL?',
    options: [
      'A) Zero',
      'B) Empty string',
      'C) Missing or unknown value',
      'D) The number -1',
    ],
    answer: 'C',
  },
  {
    id: 9,
    type: 'multiple_choice',
    question: "What's the difference between WHERE and HAVING?",
    options: [
      'A) No difference',
      'B) WHERE filters rows before grouping, HAVING filters groups after GROUP BY',
      'C) HAVING is faster',
      'D) WHERE only works with numbers',
    ],
    answer: 'B',
  },
  {
    id: 10,
    type: 'code',
    question: 'Write a SQL query to find the average price of items in the menu_items table.',
    answer: 'SELECT AVG(price) FROM menu_items;',
  },
]

const TOTAL_SECONDS = 45 * 60 // 45 minutes

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function isAnswerCorrect(question: Question, userAnswer: string): boolean {
  const ua = userAnswer.trim().toLowerCase()
  const expected = question.answer.trim().toLowerCase()
  if (question.type === 'multiple_choice') {
    // Accept just the letter or the full option
    return ua === expected || ua.startsWith(expected)
  }
  if (question.type === 'fill_blank') {
    return ua === expected
  }
  // Code: check if key parts are present (simple heuristic)
  const keywords = expected.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const matchCount = keywords.filter(kw => ua.includes(kw)).length
  return matchCount >= Math.ceil(keywords.length * 0.6)
}

// ─── confetti-like celebration ────────────────────────────────────────────────

const ConfettiCircles: React.FC = () => {
  const circles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    color: ['#00D4FF', '#39D353', '#FFB347', '#F0A500', '#FF79C6'][i % 5],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 6 + Math.random() * 14,
    delay: Math.random() * 0.5,
    duration: 0.8 + Math.random() * 0.8,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {circles.map(c => (
        <motion.div
          key={c.id}
          className="absolute rounded-full"
          style={{
            width: c.size,
            height: c.size,
            background: c.color,
            left: `${c.x}%`,
            top: `${c.y}%`,
          }}
          initial={{ scale: 0, opacity: 1, y: 0 }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [1, 0.8, 0],
            y: [-20, -80 - Math.random() * 80],
            x: [0, (Math.random() - 0.5) * 120],
          }}
          transition={{ delay: c.delay, duration: c.duration, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ─── question card ────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: Question
  answer: string
  onChange: (answer: string) => void
  locked?: boolean
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, answer, onChange, locked }) => {
  return (
    <div className="space-y-4">
      {/* Question text */}
      <div className="space-y-2">
        <span
          className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${
            question.type === 'multiple_choice'
              ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20'
              : question.type === 'fill_blank'
              ? 'bg-[#FFB347]/10 text-[#FFB347] border-[#FFB347]/20'
              : 'bg-[#39D353]/10 text-[#39D353] border-[#39D353]/20'
          }`}
        >
          {question.type === 'multiple_choice'
            ? 'Multiple Choice'
            : question.type === 'fill_blank'
            ? 'Fill in the Blank'
            : 'Write Code'}
        </span>
        <p className="text-white font-body leading-relaxed whitespace-pre-wrap">
          {question.question.replace(/`([^`]+)`/g, '').split(/(`[^`]+`)/).map((part, i) => {
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code key={i} className="font-mono text-sm bg-[#0D1117] text-[#00D4FF] border border-[#30363D] rounded px-1 py-0.5">
                  {part.slice(1, -1)}
                </code>
              )
            }
            return <span key={i}>{part}</span>
          })}
        </p>
        {/* Re-render with code formatting */}
        <p className="text-white font-body leading-relaxed whitespace-pre-wrap hidden">
          {question.question}
        </p>
      </div>

      {/* Input based on type */}
      {question.type === 'multiple_choice' && question.options && (
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const letter = opt.charAt(0)
            const isSelected = answer === letter
            return (
              <button
                key={i}
                className={`w-full text-left p-3 rounded-lg border transition-all text-sm font-body ${
                  isSelected
                    ? 'bg-[#00D4FF]/10 border-[#00D4FF]/50 text-white'
                    : 'bg-[#0D1117] border-[#30363D] text-[#8B949E] hover:border-[#00D4FF]/30 hover:text-white'
                } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
                onClick={() => !locked && onChange(letter)}
                disabled={locked}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )}

      {question.type === 'fill_blank' && (
        <div className="space-y-1">
          <input
            type="text"
            className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-2.5 text-sm font-mono text-[#E6EDF3] focus:outline-none focus:border-[#00D4FF]/50 transition-colors placeholder-[#8B949E]/60"
            placeholder="Type your answer..."
            value={answer}
            onChange={e => !locked && onChange(e.target.value)}
            readOnly={locked}
          />
          {question.hint && (
            <p className="text-xs text-[#8B949E] font-mono italic">Hint: {question.hint}</p>
          )}
        </div>
      )}

      {question.type === 'code' && (
        <textarea
          className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-sm text-[#E6EDF3] font-mono resize-none focus:outline-none focus:border-[#39D353]/50 transition-colors placeholder-[#8B949E]/60"
          rows={6}
          placeholder="Write your code here..."
          value={answer}
          onChange={e => !locked && onChange(e.target.value)}
          readOnly={locked}
        />
      )}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

const PhaseGate: React.FC<PhaseGateProps> = ({ phase, onPass, onFail }) => {
  const { completePhaseGate, failPhaseGate } = useProgressStore()

  const questions = phase === 1 ? PHASE_1_QUESTIONS : []

  const [screen, setScreen] = useState<ScreenState>('pre-start')
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Grading result
  const [gradingResult, setGradingResult] = useState<{
    scores: Array<{ question: number; correct: boolean; feedback: string }>
    total_score: number
    passed: boolean
    overall_feedback: string
    weak_areas: string[]
    strong_areas: string[]
  } | null>(null)

  // Timer
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setTimerActive(false)
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerActive])

  const handleAutoSubmit = useCallback(() => {
    setScreen('review')
  }, [])

  const startAssessment = () => {
    setTimerActive(true)
    setScreen('assessment')
    setCurrentQIdx(0)
    setAnswers({})
    setTimeLeft(TOTAL_SECONDS)
  }

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [questions[currentQIdx].id]: answer }))
  }

  const handleNext = () => {
    if (currentQIdx < questions.length - 1) {
      setCurrentQIdx(prev => prev + 1)
    } else {
      setTimerActive(false)
      if (timerRef.current) clearInterval(timerRef.current)
      setScreen('review')
    }
  }

  const handlePrev = () => {
    if (currentQIdx > 0) setCurrentQIdx(prev => prev - 1)
  }

  const handleSubmit = async () => {
    setTimerActive(false)
    if (timerRef.current) clearInterval(timerRef.current)
    setScreen('grading')

    // Quick local scoring for pass/fail
    const localScores = questions.map(q => ({
      question: q.id,
      correct: isAnswerCorrect(q, answers[q.id] || ''),
      feedback: '',
    }))
    const localTotal = Math.round((localScores.filter(s => s.correct).length / questions.length) * 100)

    // Try API grading
    const apiResult = await gradeAssessment({
      questions: questions.map(q => ({ question: q.question, expected: q.answer })),
      answers: questions.map(q => answers[q.id] || ''),
      week: 4, // end of phase 1
    })

    const finalResult = apiResult ?? {
      scores: localScores,
      total_score: localTotal,
      passed: localTotal >= 80,
      overall_feedback: localTotal >= 80
        ? 'Great work! You demonstrated solid understanding of Phase 1 concepts.'
        : 'You\'re close! Review the questions you missed and retake when ready.',
      weak_areas: localScores.filter(s => !s.correct).map(s => `Question ${s.question}`),
      strong_areas: localScores.filter(s => s.correct).map(s => `Question ${s.question}`),
    }

    setGradingResult(finalResult)

    if (finalResult.passed) {
      completePhaseGate(phase, finalResult.total_score)
    } else {
      failPhaseGate(phase, finalResult.total_score)
    }

    setScreen('results')
  }

  const currentQuestion = questions[currentQIdx]
  const answeredCount = Object.keys(answers).length
  const timerUrgent = timeLeft < 300 // < 5 minutes

  // ── Pre-start screen ─────────────────────────────────────────────
  if (phase !== 1) {
    return (
      <div className="panel p-12 flex flex-col items-center justify-center text-center gap-4">
        <ShieldIcon className="w-12 h-12 text-[#8B949E]" />
        <h2 className="text-xl font-display font-bold text-white">Phase {phase} Gate</h2>
        <p className="text-[#8B949E] font-mono text-sm">Coming soon — check back when Phase {phase} content is released.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <AnimatePresence mode="wait">

        {/* ── PRE-START ──────────────────────────────────────────────── */}
        {screen === 'pre-start' && (
          <motion.div
            key="pre-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#00D4FF]/20 rounded-full blur-2xl" />
              <ShieldIcon className="relative w-16 h-16 text-[#00D4FF]" />
            </div>

            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">
                Phase {phase} Gate Assessment
              </h2>
              <p className="text-[#8B949E] font-body text-sm max-w-md mx-auto">
                This assessment checks that you've truly internalized Phase {phase} before moving on.
                You need to demonstrate real understanding — not just memorization.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              {[
                { label: 'Questions', value: '10', icon: '📋' },
                { label: 'Time Limit', value: '45 min', icon: '⏱' },
                { label: 'Pass Score', value: '80%', icon: '🎯' },
              ].map(item => (
                <div key={item.label} className="panel p-4 text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-lg font-display font-bold text-white">{item.value}</div>
                  <div className="text-xs font-mono text-[#8B949E] uppercase tracking-wide">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#F0A500]/5 border border-[#F0A500]/30 rounded-lg p-4 max-w-md w-full text-left">
              <p className="text-sm text-[#F0A500] font-mono font-semibold mb-1">Before you start:</p>
              <ul className="text-xs text-[#8B949E] space-y-1 font-body">
                <li>• Timer starts immediately when you click Start</li>
                <li>• You can navigate back to review previous answers</li>
                <li>• If you fail, you can retake after 24 hours</li>
                <li>• Code questions are graded for correctness, not exact syntax</li>
              </ul>
            </div>

            <button
              className="btn-primary px-8 py-3 text-base font-display font-bold"
              onClick={startAssessment}
            >
              Start Assessment →
            </button>
          </motion.div>
        )}

        {/* ── ASSESSMENT ─────────────────────────────────────────────── */}
        {screen === 'assessment' && currentQuestion && (
          <motion.div
            key="assessment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Top bar */}
            <div className="shrink-0 px-6 pt-4 pb-3 border-b border-[#30363D] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-white font-semibold">
                  Question{' '}
                  <span className="text-[#00D4FF]">{currentQIdx + 1}</span>
                  {' '}of {questions.length}
                </span>
                {/* Progress dots */}
                <div className="flex items-center gap-1">
                  {questions.map((q, i) => (
                    <div
                      key={q.id}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentQIdx
                          ? 'bg-[#00D4FF] w-3'
                          : answers[q.id]
                          ? 'bg-[#39D353]'
                          : 'bg-[#30363D]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div
                className={`flex items-center gap-1.5 font-mono text-sm font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  timerUrgent
                    ? 'bg-[#FF4757]/10 border-[#FF4757]/40 text-[#FF4757]'
                    : 'bg-[#0D1117] border-[#30363D] text-[#8B949E]'
                }`}
              >
                <ClockIcon className={`w-4 h-4 ${timerUrgent ? 'animate-pulse' : ''}`} />
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Question area */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <motion.div
                key={currentQIdx}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="panel p-6 max-w-2xl mx-auto"
              >
                <QuestionCard
                  question={currentQuestion}
                  answer={answers[currentQuestion.id] || ''}
                  onChange={handleAnswer}
                />
              </motion.div>
            </div>

            {/* Navigation */}
            <div className="shrink-0 px-6 py-4 border-t border-[#30363D] flex items-center justify-between">
              <button
                className="btn-ghost"
                onClick={handlePrev}
                disabled={currentQIdx === 0}
              >
                ← Previous
              </button>

              <span className="text-xs font-mono text-[#8B949E]">
                {answeredCount}/{questions.length} answered
              </span>

              {currentQIdx < questions.length - 1 ? (
                <button className="btn-sql" onClick={handleNext}>
                  Next →
                </button>
              ) : (
                <button
                  className="btn-success"
                  onClick={() => {
                    setTimerActive(false)
                    if (timerRef.current) clearInterval(timerRef.current)
                    setScreen('review')
                  }}
                >
                  Review Answers →
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── REVIEW ─────────────────────────────────────────────────── */}
        {screen === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="shrink-0 px-6 pt-5 pb-4 border-b border-[#30363D]">
              <h2 className="text-xl font-display font-bold text-white">Review Your Answers</h2>
              <p className="text-sm text-[#8B949E] font-mono mt-1">
                {answeredCount}/{questions.length} questions answered — you can still edit any answer.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {questions.map((q, i) => {
                const a = answers[q.id] || ''
                const hasAnswer = a.trim().length > 0
                return (
                  <div
                    key={q.id}
                    className={`panel p-4 cursor-pointer border transition-all ${
                      !hasAnswer ? 'border-[#FF4757]/30' : 'border-[#30363D] hover:border-[#00D4FF]/30'
                    }`}
                    onClick={() => {
                      setCurrentQIdx(i)
                      setScreen('assessment')
                      setTimerActive(false)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                          hasAnswer ? 'bg-[#39D353]/20 text-[#39D353]' : 'bg-[#FF4757]/20 text-[#FF4757]'
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#E6EDF3] leading-snug truncate">{q.question.split('\n')[0]}</p>
                        <p className="text-xs font-mono mt-1 truncate">
                          {hasAnswer ? (
                            <span className="text-[#00D4FF]">Answer: {a}</span>
                          ) : (
                            <span className="text-[#FF4757]">No answer — click to edit</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-[#30363D] flex items-center justify-end gap-3">
              <button
                className="btn-ghost"
                onClick={() => {
                  setTimerActive(true)
                  setScreen('assessment')
                }}
              >
                Back to Assessment
              </button>
              <button className="btn-success" onClick={handleSubmit}>
                Submit for Grading →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── GRADING ────────────────────────────────────────────────── */}
        {screen === 'grading' && (
          <motion.div
            key="grading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-6"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#00D4FF]/20 border-t-[#00D4FF] rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-lg font-display font-bold text-white mb-1">Grading your assessment...</p>
              <p className="text-sm text-[#8B949E] font-mono">Sage is reviewing your answers</p>
            </div>
          </motion.div>
        )}

        {/* ── RESULTS ────────────────────────────────────────────────── */}
        {screen === 'results' && gradingResult && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-y-auto"
          >
            {/* Score header */}
            <div className="relative px-6 py-8 text-center border-b border-[#30363D] overflow-hidden">
              {gradingResult.passed && <ConfettiCircles />}
              <div className="relative z-10">
                <div
                  className={`text-6xl font-display font-bold mb-2 ${
                    gradingResult.passed
                      ? 'text-[#39D353]'
                      : 'text-[#FF4757]'
                  }`}
                  style={{
                    textShadow: gradingResult.passed
                      ? '0 0 40px rgba(57,211,83,0.5)'
                      : '0 0 40px rgba(255,71,87,0.5)',
                  }}
                >
                  {gradingResult.total_score}/100
                </div>

                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-display font-bold text-sm ${
                    gradingResult.passed
                      ? 'bg-[#39D353]/10 border border-[#39D353]/40 text-[#39D353]'
                      : 'bg-[#FF4757]/10 border border-[#FF4757]/40 text-[#FF4757]'
                  }`}
                >
                  {gradingResult.passed ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      PASSED — Phase {phase} Unlocked!
                    </>
                  ) : (
                    <>
                      <XIcon className="w-4 h-4" />
                      Not Yet — Retake in 24 Hours
                    </>
                  )}
                </div>

                <p className="text-sm text-[#8B949E] font-body mt-3 max-w-md mx-auto">
                  {gradingResult.overall_feedback}
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Per-question breakdown */}
              <div className="panel p-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8B949E] mb-4">
                  Question Breakdown
                </h3>
                <div className="space-y-3">
                  {gradingResult.scores.map((score, i) => {
                    const q = questions[i]
                    return (
                      <div key={score.question} className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            score.correct ? 'bg-[#39D353]' : 'bg-[#FF4757]'
                          }`}
                        >
                          {score.correct ? (
                            <CheckIcon className="w-3 h-3 text-[#0D1117]" />
                          ) : (
                            <XIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#E6EDF3] leading-snug">
                            Q{i + 1}: {q?.question.split('\n')[0]}
                          </p>
                          {score.feedback && (
                            <p className="text-xs text-[#8B949E] mt-0.5 leading-snug">{score.feedback}</p>
                          )}
                          {!score.correct && q && (
                            <p className="text-xs font-mono text-[#F0A500] mt-0.5">
                              Expected: {q.answer}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Strengths & weaknesses */}
              {(gradingResult.strong_areas.length > 0 || gradingResult.weak_areas.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  {gradingResult.strong_areas.length > 0 && (
                    <div className="bg-[#39D353]/5 border border-[#39D353]/30 rounded-lg p-4">
                      <h4 className="text-xs font-mono uppercase tracking-wide text-[#39D353] mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {gradingResult.strong_areas.slice(0, 4).map(area => (
                          <li key={area} className="text-xs text-[#8B949E]">{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {gradingResult.weak_areas.length > 0 && (
                    <div className="bg-[#FF4757]/5 border border-[#FF4757]/30 rounded-lg p-4">
                      <h4 className="text-xs font-mono uppercase tracking-wide text-[#FF4757] mb-2">Review These</h4>
                      <ul className="space-y-1">
                        {gradingResult.weak_areas.slice(0, 4).map(area => (
                          <li key={area} className="text-xs text-[#8B949E]">{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pb-4">
                {gradingResult.passed ? (
                  <button
                    className="btn-success"
                    onClick={() => onPass?.(gradingResult.total_score)}
                  >
                    Continue to Phase {phase + 1} →
                  </button>
                ) : (
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs font-mono text-[#8B949E] bg-[#FF4757]/5 border border-[#FF4757]/20 rounded px-3 py-1.5">
                      Retake available in 24 hours
                    </div>
                    <button
                      className="btn-ghost"
                      onClick={() => onFail?.(gradingResult.total_score)}
                    >
                      Back to Studying
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

export default PhaseGate
