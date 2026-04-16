import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getWeekByNumber, MiniProjectDef } from '@/data/curriculum'
import { gradeProject, GradeResult } from '@/api/sage'
import { useProgressStore } from '@/store/progress'

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

const SlackIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.167 0a2.528 2.528 0 0 1 2.521 2.522v6.312zM15.167 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.167 24a2.528 2.528 0 0 1-2.521-2.522v-2.522h2.521zM15.167 17.688a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h6.312A2.528 2.528 0 0 1 24 15.167a2.528 2.528 0 0 1-2.522 2.521h-6.311z" />
  </svg>
)

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

// ─── types ────────────────────────────────────────────────────────────────────

type Stage = 'briefing' | 'planning' | 'building' | 'testing' | 'submission' | 'debrief'

const STAGES: Stage[] = ['briefing', 'planning', 'building', 'testing', 'submission', 'debrief']

const STAGE_LABELS: Record<Stage, string> = {
  briefing: 'Briefing',
  planning: 'Planning',
  building: 'Building',
  testing: 'Testing',
  submission: 'Submission',
  debrief: 'Debrief',
}

interface MiniProjectProps {
  week: number
  onComplete?: (score: number) => void
  onSageRequest?: (message: string) => void
}

// ─── grade color helpers ──────────────────────────────────────────────────────

function gradeColor(grade: string): string {
  if (grade === 'A') return '#39D353'
  if (grade === 'B') return '#00D4FF'
  if (grade === 'C') return '#F0A500'
  if (grade === 'D') return '#FFB347'
  return '#FF4757'
}

function metricPct(score: number, max: number): number {
  return Math.round((score / max) * 100)
}

// ─── stepper ─────────────────────────────────────────────────────────────────

const StageStepper: React.FC<{ current: Stage }> = ({ current }) => {
  const currentIdx = STAGES.indexOf(current)
  return (
    <div className="flex items-center gap-0 shrink-0">
      {STAGES.map((stage, i) => {
        const isDone = i < currentIdx
        const isActive = i === currentIdx
        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  isDone
                    ? 'bg-[#39D353]/20 text-[#39D353] border border-[#39D353]/40'
                    : isActive
                    ? 'bg-[#00D4FF] text-[#0D1117] shadow-[0_0_12px_rgba(0,212,255,0.5)]'
                    : 'bg-[#21262D] text-[#8B949E] border border-[#30363D]'
                }`}
              >
                {isDone ? <CheckIcon className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={`text-[9px] font-mono uppercase tracking-wide hidden sm:block ${
                  isActive ? 'text-[#00D4FF]' : isDone ? 'text-[#39D353]' : 'text-[#8B949E]'
                }`}
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={`h-0.5 w-6 sm:w-10 mx-1 transition-colors ${
                  i < currentIdx ? 'bg-[#39D353]/40' : 'bg-[#30363D]'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── metric bar ──────────────────────────────────────────────────────────────

const MetricBar: React.FC<{
  label: string
  score: number
  max: number
  feedback: string
}> = ({ label, score, max, feedback }) => {
  const pct = metricPct(score, max)
  const color = pct >= 80 ? '#39D353' : pct >= 60 ? '#F0A500' : '#FF4757'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wide text-[#8B949E]">{label}</span>
        <span className="text-sm font-mono font-bold" style={{ color }}>
          {score}/{max}
        </span>
      </div>
      <div className="h-2 bg-[#21262D] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-[#8B949E] leading-snug">{feedback}</p>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

const MiniProject: React.FC<MiniProjectProps> = ({ week, onComplete, onSageRequest }) => {
  const weekDef = getWeekByNumber(week)
  const project: MiniProjectDef | null = weekDef?.miniProject ?? null

  const { updateMiniProject, addXP } = useProgressStore()

  const [stage, setStage] = useState<Stage>('briefing')
  const [checkedRequirements, setCheckedRequirements] = useState<Set<number>>(new Set())

  // Planning stage state
  const [planDataNeeded, setPlanDataNeeded] = useState('')
  const [planApproach, setPlanApproach] = useState('')
  const [planSuccessCriteria, setPlanSuccessCriteria] = useState('')
  const [planApproved, setPlanApproved] = useState(false)

  // Building stage state
  const [sqlCode, setSqlCode] = useState('')
  const [pythonCode, setPythonCode] = useState('')

  // Testing stage state
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [autoCheckDone, setAutoCheckDone] = useState(false)
  const [autoCheckPassed, setAutoCheckPassed] = useState(false)

  // Submission stage state
  const [explanation, setExplanation] = useState('')
  const [grading, setGrading] = useState(false)
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)
  const [gradeError, setGradeError] = useState('')

  if (!project) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-[#8B949E] font-mono">No mini-project for Week {week}.</p>
      </div>
    )
  }

  const canSubmitPlan =
    planDataNeeded.trim().length >= 20 &&
    planApproach.trim().length >= 20 &&
    planSuccessCriteria.trim().length >= 20

  const runAutoCheck = () => {
    const passed = sqlCode.trim().length >= 50 && pythonCode.trim().length >= 50
    setAutoCheckPassed(passed)
    setAutoCheckDone(true)
  }

  const handleSubmitForGrading = async () => {
    if (!project) return
    setGrading(true)
    setGradeError('')
    try {
      const result = await gradeProject({
        projectName: project.name,
        week,
        requirements: project.requirements.join('\n'),
        sqlCode,
        pythonCode,
        explanation,
        testResults,
      })
      if (result) {
        setGradeResult(result)
        updateMiniProject(week, 'graded', result.total)
        setStage('debrief')
      } else {
        setGradeError('Could not reach Sage — check that the backend is running.')
      }
    } catch {
      setGradeError('Grading request failed. Please try again.')
    } finally {
      setGrading(false)
    }
  }

  const xpEarned = gradeResult ? Math.round(gradeResult.total * 1.5) : 0

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-[#30363D]">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-[#8B949E] uppercase tracking-widest">
                  Week {week} — Mini-Project
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-white">{project.name}</h2>
            </div>
          </div>
          <StageStepper current={stage} />
        </div>
      </div>

      {/* ── Scrollable stage content ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <AnimatePresence mode="wait">

          {/* ── BRIEFING ─────────────────────────────────────────────── */}
          {stage === 'briefing' && (
            <motion.div
              key="briefing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Slack-style DM card */}
              <div className="bg-[#1C2128] border border-[#30363D] rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#4A154B] flex items-center justify-center shrink-0">
                    <SlackIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-display font-bold text-white">Your Manager</span>
                      <span className="text-[10px] font-mono text-[#8B949E]">Today at 9:14 AM</span>
                      <span className="text-[9px] bg-[#4A154B]/40 text-[#B088B0] border border-[#4A154B]/60 rounded px-1.5 py-0.5 font-mono uppercase tracking-wide">
                        Slack DM
                      </span>
                    </div>
                    <p className="text-sm text-[#E6EDF3] leading-relaxed whitespace-pre-line font-body">
                      {project.briefing}
                    </p>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="panel p-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8B949E] mb-3">
                  Requirements
                </h3>
                <ul className="space-y-2">
                  {project.requirements.map((req, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 cursor-pointer group"
                      onClick={() => {
                        setCheckedRequirements(prev => {
                          const next = new Set(prev)
                          if (next.has(i)) next.delete(i)
                          else next.add(i)
                          return next
                        })
                      }}
                    >
                      <div
                        className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                          checkedRequirements.has(i)
                            ? 'bg-[#39D353] border-[#39D353]'
                            : 'border-[#30363D] group-hover:border-[#39D353]/50'
                        }`}
                      >
                        {checkedRequirements.has(i) && (
                          <CheckIcon className="w-2.5 h-2.5 text-[#0D1117]" />
                        )}
                      </div>
                      <span className="text-sm text-[#E6EDF3] leading-snug">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  className="btn-sql"
                  onClick={() => {
                    updateMiniProject(week, 'in_progress')
                    setStage('planning')
                  }}
                >
                  Ready to Plan →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── PLANNING ─────────────────────────────────────────────── */}
          {stage === 'planning' && (
            <motion.div
              key="planning"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="panel p-4">
                <h3 className="text-sm font-display font-bold text-white mb-1">
                  Before you write any code, answer three questions.
                </h3>
                <p className="text-xs text-[#8B949E] font-mono">
                  Senior engineers plan before they type. Each answer needs at least 20 characters.
                </p>
              </div>

              {[
                {
                  label: 'What data do I need?',
                  value: planDataNeeded,
                  setter: setPlanDataNeeded,
                  placeholder: 'Describe which tables, columns, and filters you need...',
                },
                {
                  label: "What's my approach — SQL first or Python first?",
                  value: planApproach,
                  setter: setPlanApproach,
                  placeholder: 'Explain your strategy and why...',
                },
                {
                  label: 'What does a successful result look like?',
                  value: planSuccessCriteria,
                  setter: setPlanSuccessCriteria,
                  placeholder: 'Describe the expected output or validation criteria...',
                },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label} className="panel p-4 space-y-2">
                  <label className="text-sm font-display font-semibold text-white block">
                    {label}
                  </label>
                  <textarea
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-sm text-[#E6EDF3] font-body resize-none focus:outline-none focus:border-[#00D4FF]/50 transition-colors placeholder-[#8B949E]/60"
                    rows={3}
                    placeholder={placeholder}
                    value={value}
                    onChange={e => setter(e.target.value)}
                  />
                  <div className="flex justify-between">
                    <span
                      className={`text-xs font-mono ${
                        value.trim().length >= 20 ? 'text-[#39D353]' : 'text-[#8B949E]'
                      }`}
                    >
                      {value.trim().length}/20 min chars
                    </span>
                    {value.trim().length >= 20 && (
                      <CheckIcon className="w-3.5 h-3.5 text-[#39D353]" />
                    )}
                  </div>
                </div>
              ))}

              {/* Sage approval message */}
              <AnimatePresence>
                {planApproved && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#39D353]/5 border border-[#39D353]/30 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-mono text-[#00D4FF] font-bold">S</span>
                      </div>
                      <div>
                        <p className="text-sm font-display font-semibold text-[#39D353] mb-1">
                          Sage reviewed your plan
                        </p>
                        <p className="text-sm text-[#E6EDF3] leading-relaxed">
                          Good planning. You've identified what you need, chosen a strategy, and defined success criteria. That's the right order of operations. One note: make sure your SQL approach handles NULL values — they'll bite you if you don't think about them upfront. Go build it.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3 justify-end">
                {!planApproved ? (
                  <button
                    className={`btn-sql ${!canSubmitPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!canSubmitPlan}
                    onClick={() => {
                      if (canSubmitPlan) {
                        onSageRequest?.(`I'm planning my Week ${week} mini-project: "${project.name}". Here's my plan:\n1. Data needed: ${planDataNeeded}\n2. Approach: ${planApproach}\n3. Success looks like: ${planSuccessCriteria}`)
                        setPlanApproved(true)
                      }
                    }}
                  >
                    Submit Plan to Sage
                  </button>
                ) : (
                  <button
                    className="btn-success"
                    onClick={() => setStage('building')}
                  >
                    Start Building →
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── BUILDING ─────────────────────────────────────────────── */}
          {stage === 'building' && (
            <motion.div
              key="building"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-lg p-4">
                <p className="text-sm text-[#00D4FF] font-mono">
                  Switch to the editor panels to write your code, or draft it here for submission capture.
                </p>
              </div>

              {/* Requirements sidebar summary */}
              <div className="panel p-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8B949E] mb-3">
                  Requirements Checklist
                </h3>
                <ul className="space-y-1.5">
                  {project.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#30363D] mt-2 shrink-0" />
                      <span className="text-xs text-[#8B949E] leading-snug">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SQL code area */}
              <div className="panel p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#00D4FF]" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[#00D4FF]">SQL Code</span>
                </div>
                <textarea
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-sm text-[#E6EDF3] font-mono resize-none focus:outline-none focus:border-[#00D4FF]/50 transition-colors placeholder-[#8B949E]/60"
                  rows={8}
                  placeholder="-- Write your SQL queries here..."
                  value={sqlCode}
                  onChange={e => setSqlCode(e.target.value)}
                />
                <p className="text-xs text-[#8B949E] font-mono">{sqlCode.length} chars</p>
              </div>

              {/* Python code area */}
              <div className="panel p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#FFB347]" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[#FFB347]">Python Code</span>
                </div>
                <textarea
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-sm text-[#E6EDF3] font-mono resize-none focus:outline-none focus:border-[#FFB347]/50 transition-colors placeholder-[#8B949E]/60"
                  rows={8}
                  placeholder="# Write your Python code here..."
                  value={pythonCode}
                  onChange={e => setPythonCode(e.target.value)}
                />
                <p className="text-xs text-[#8B949E] font-mono">{pythonCode.length} chars</p>
              </div>

              <div className="flex justify-end">
                <button
                  className="btn-python"
                  onClick={() => setStage('testing')}
                >
                  Mark as Built →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── TESTING ──────────────────────────────────────────────── */}
          {stage === 'testing' && (
            <motion.div
              key="testing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="panel p-4">
                <h3 className="text-sm font-display font-bold text-white mb-1">Test Your Work</h3>
                <p className="text-xs text-[#8B949E] font-mono">
                  Self-report each test case, then run the automated check.
                </p>
              </div>

              {/* Test cases */}
              <div className="panel p-4 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8B949E] mb-3">
                  Test Cases
                </h3>
                {project.testCases.map(tc => {
                  const passed = testResults[tc.id]
                  const failed = testResults[tc.id] === false
                  const neutral = testResults[tc.id] === undefined
                  return (
                    <div key={tc.id} className="flex items-start gap-3 py-2 border-b border-[#21262D] last:border-0">
                      <div className={`w-4 h-4 mt-0.5 rounded-full flex items-center justify-center shrink-0 ${
                        passed ? 'bg-[#39D353]' : failed ? 'bg-[#FF4757]' : 'bg-[#21262D] border border-[#30363D]'
                      }`}>
                        {passed && <CheckIcon className="w-2.5 h-2.5 text-[#0D1117]" />}
                        {failed && <XIcon className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#E6EDF3] leading-snug">{tc.description}</p>
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded mt-1 inline-block ${
                            tc.type === 'sql'
                              ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20'
                              : tc.type === 'python'
                              ? 'bg-[#FFB347]/10 text-[#FFB347] border border-[#FFB347]/20'
                              : 'bg-[#8B949E]/10 text-[#8B949E] border border-[#8B949E]/20'
                          }`}
                        >
                          {tc.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className={`text-xs font-mono px-2 py-1 rounded border transition-all ${
                            passed
                              ? 'bg-[#39D353]/10 border-[#39D353]/40 text-[#39D353]'
                              : 'border-[#30363D] text-[#8B949E] hover:border-[#39D353]/40 hover:text-[#39D353]'
                          }`}
                          onClick={() => setTestResults(prev => ({ ...prev, [tc.id]: true }))}
                        >
                          Pass
                        </button>
                        <button
                          className={`text-xs font-mono px-2 py-1 rounded border transition-all ${
                            failed
                              ? 'bg-[#FF4757]/10 border-[#FF4757]/40 text-[#FF4757]'
                              : 'border-[#30363D] text-[#8B949E] hover:border-[#FF4757]/40 hover:text-[#FF4757]'
                          }`}
                          onClick={() => setTestResults(prev => ({ ...prev, [tc.id]: false }))}
                        >
                          Fail
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Automated check */}
              <div className="panel p-4 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8B949E] mb-2">
                  Automated Check
                </h3>
                <p className="text-xs text-[#8B949E]">
                  Validates that your SQL and Python code are both non-empty (at least 50 characters each).
                </p>
                <button className="btn-ghost" onClick={runAutoCheck}>
                  Run Automated Check
                </button>

                <AnimatePresence>
                  {autoCheckDone && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-2 p-3 rounded-lg border ${
                        autoCheckPassed
                          ? 'bg-[#39D353]/5 border-[#39D353]/30'
                          : 'bg-[#FF4757]/5 border-[#FF4757]/30'
                      }`}
                    >
                      {autoCheckPassed ? (
                        <CheckIcon className="w-4 h-4 text-[#39D353] shrink-0" />
                      ) : (
                        <XIcon className="w-4 h-4 text-[#FF4757] shrink-0" />
                      )}
                      <span className={`text-sm font-mono ${autoCheckPassed ? 'text-[#39D353]' : 'text-[#FF4757]'}`}>
                        {autoCheckPassed
                          ? 'Both SQL and Python code are present. Ready to submit.'
                          : `Code too short — SQL: ${sqlCode.trim().length} chars, Python: ${pythonCode.trim().length} chars (need 50+ each)`}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-end">
                <button
                  className="btn-sql"
                  onClick={() => setStage('submission')}
                >
                  Proceed to Submission →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── SUBMISSION ───────────────────────────────────────────── */}
          {stage === 'submission' && (
            <motion.div
              key="submission"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="panel p-4">
                <h3 className="text-sm font-display font-bold text-white mb-1">Explain Your Work</h3>
                <p className="text-xs text-[#8B949E] font-mono">
                  Senior engineers document their decisions. Write at least 3 sentences explaining what you built and the key decisions you made.
                </p>
              </div>

              <div className="panel p-4 space-y-2">
                <label className="text-sm font-display font-semibold text-white block">
                  What did you build and what were the key decisions?
                </label>
                <textarea
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-sm text-[#E6EDF3] font-body resize-none focus:outline-none focus:border-[#00D4FF]/50 transition-colors placeholder-[#8B949E]/60"
                  rows={8}
                  placeholder="Explain what you built, why you made the choices you did, and what you learned..."
                  value={explanation}
                  onChange={e => setExplanation(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono ${
                      explanation.length >= 100 ? 'text-[#39D353]' : 'text-[#8B949E]'
                    }`}
                  >
                    {explanation.length} / 100 min characters
                  </span>
                  {explanation.length >= 100 && (
                    <span className="text-xs font-mono text-[#39D353]">✓ Ready to submit</span>
                  )}
                </div>
              </div>

              {gradeError && (
                <div className="bg-[#FF4757]/5 border border-[#FF4757]/30 rounded-lg p-3">
                  <p className="text-sm text-[#FF4757] font-mono">{gradeError}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  className={`btn-success flex items-center gap-2 ${
                    explanation.length < 100 || grading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={explanation.length < 100 || grading}
                  onClick={handleSubmitForGrading}
                >
                  {grading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Grading...
                    </>
                  ) : (
                    'Submit for Grading →'
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── DEBRIEF ──────────────────────────────────────────────── */}
          {stage === 'debrief' && gradeResult && (
            <motion.div
              key="debrief"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Grade card */}
              <div className="panel p-6 text-center relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${gradeColor(gradeResult.grade)}, transparent 70%)`,
                  }}
                />
                <div className="relative z-10">
                  <p className="text-xs font-mono uppercase tracking-widest text-[#8B949E] mb-2">Grade</p>
                  <div
                    className="text-8xl font-display font-bold mb-3"
                    style={{
                      color: gradeColor(gradeResult.grade),
                      textShadow: `0 0 40px ${gradeColor(gradeResult.grade)}60`,
                    }}
                  >
                    {gradeResult.grade}
                  </div>
                  <p className="text-2xl font-display font-bold text-white">
                    {gradeResult.total}/100
                  </p>
                </div>
              </div>

              {/* Metric bars */}
              <div className="panel p-5 space-y-5">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8B949E]">
                  Score Breakdown
                </h3>
                <MetricBar
                  label="Correctness"
                  score={gradeResult.correctness.score}
                  max={40}
                  feedback={gradeResult.correctness.feedback}
                />
                <MetricBar
                  label="Readability"
                  score={gradeResult.readability.score}
                  max={20}
                  feedback={gradeResult.readability.feedback}
                />
                <MetricBar
                  label="Efficiency"
                  score={gradeResult.efficiency.score}
                  max={20}
                  feedback={gradeResult.efficiency.feedback}
                />
                <MetricBar
                  label="Explanation"
                  score={gradeResult.explanation.score}
                  max={20}
                  feedback={gradeResult.explanation.feedback}
                />
              </div>

              {/* Senior insight */}
              <div className="insight-card">
                <div className="flex items-center gap-2 mb-2">
                  <StarIcon className="w-4 h-4 text-[#F0A500]" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[#F0A500]">
                    Senior Insight
                  </span>
                </div>
                <p className="text-sm text-[#E6EDF3] leading-relaxed">{gradeResult.senior_insight}</p>
              </div>

              {/* What to focus on */}
              <div className="panel p-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8B949E] mb-2">
                  What to Focus on Next
                </h3>
                <p className="text-sm text-[#E6EDF3] leading-relaxed">{gradeResult.what_to_focus_on_next}</p>
              </div>

              {/* XP earned */}
              <div className="bg-[#39D353]/5 border border-[#39D353]/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-[#8B949E] uppercase tracking-wide">XP Earned</p>
                  <p className="text-2xl font-display font-bold text-[#39D353]">+{xpEarned} XP</p>
                </div>
                <div className="text-3xl">🎯</div>
              </div>

              <div className="flex justify-end">
                <button
                  className="btn-success"
                  onClick={() => {
                    addXP(xpEarned, 'Mini-project completed')
                    onComplete?.(gradeResult.total)
                  }}
                >
                  Continue to Next Week →
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default MiniProject
