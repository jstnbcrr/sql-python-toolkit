import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useProgressStore, LEVEL_NAMES, xpToNextLevel } from '@/store/progress'
import { useProfilesStore } from '@/store/profiles'
import { WEEKS, getWeekByNumber, PHASE_NAMES, PHASE_RANGES } from '@/data/curriculum'
import ProgressBar from './ProgressBar'

// ─── icons (inline SVG to avoid extra deps) ──────────────────────────────────

const FlameIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C10.5 4.5 9 6 9 9c0 1.8.9 3.4 2.3 4.4C11.1 12.2 11 11.1 11 10c0 2 1 4 3 5 .6-1.1.8-2.3.5-3.5C16 13.2 17 15 17 17c0 2.8-2.2 5-5 5s-5-2.2-5-5c0-4 3-7 5-10z" />
  </svg>
)

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1C9.24 1 7 3.24 7 6v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2h-2V6c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V6c0-1.66 1.34-3 3-3zm0 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
  </svg>
)

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// ─── animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 80, damping: 20 },
  },
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Returns a 10-week date range ending today, Sunday-first */
function buildHeatmapGrid(studyCalendar: Record<string, boolean>): Array<{ date: string; active: boolean; inRange: boolean }[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find the Sunday at or before (today - 69 days)
  const start = new Date(today)
  start.setDate(today.getDate() - 69)
  // Roll back to Sunday
  start.setDate(start.getDate() - start.getDay())

  const weeks: Array<{ date: string; active: boolean; inRange: boolean }[]> = []
  const cursor = new Date(start)

  for (let w = 0; w < 10; w++) {
    const week: { date: string; active: boolean; inRange: boolean }[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().split('T')[0]
      const inRange = cursor <= today
      week.push({ date: dateStr, active: !!studyCalendar[dateStr], inRange })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
}

/** Compute SQL + Python mastery percentages from weekProgress */
function computeMastery(weekProgress: Record<number, { sqlExercisesCompleted: number; pythonExercisesCompleted: number; lessonRead: boolean }>): { sql: number; python: number } {
  // Total exercises possible: 5 SQL + 5 Python per week × 16 weeks = 80 each
  const SQL_PER_WEEK = 5
  const PYTHON_PER_WEEK = 5

  let totalSql = 0
  let totalPython = 0

  Object.values(weekProgress).forEach(wp => {
    totalSql += Math.min(wp.sqlExercisesCompleted, SQL_PER_WEEK)
    totalPython += Math.min(wp.pythonExercisesCompleted, PYTHON_PER_WEEK)
  })

  const maxPossible = WEEKS.length * SQL_PER_WEEK
  return {
    sql: Math.min(100, Math.round((totalSql / maxPossible) * 100)),
    python: Math.min(100, Math.round((totalPython / maxPossible) * 100)),
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface WeekDotProps {
  week: number
  status: 'current' | 'completed' | 'available' | 'locked'
  onClick?: () => void
}

const WeekDot: React.FC<WeekDotProps> = ({ week, status, onClick }) => {
  const isClickable = status === 'available' || status === 'current'

  const baseClasses =
    'relative flex items-center justify-center w-9 h-9 rounded-full text-xs font-mono font-semibold transition-all duration-200 select-none'

  const statusClasses: Record<WeekDotProps['status'], string> = {
    current: 'bg-[#00D4FF] text-[#0D1117] shadow-[0_0_16px_rgba(0,212,255,0.7)] ring-2 ring-[#00D4FF]/40 ring-offset-1 ring-offset-[#0D1117]',
    completed: 'bg-[#39D353]/20 text-[#39D353] border border-[#39D353]/50',
    available: 'bg-[#21262D] text-[#8B949E] border border-[#30363D] hover:border-[#00D4FF]/60 hover:text-[#00D4FF] hover:shadow-[0_0_10px_rgba(0,212,255,0.3)]',
    locked: 'bg-[#161B22] text-[#30363D] border border-[#21262D] cursor-not-allowed',
  }

  return (
    <motion.button
      className={`${baseClasses} ${statusClasses[status]} ${isClickable ? 'cursor-pointer' : ''}`}
      onClick={isClickable ? onClick : undefined}
      whileHover={isClickable ? { scale: 1.12 } : {}}
      whileTap={isClickable ? { scale: 0.94 } : {}}
      title={`Week ${week}`}
      aria-label={`Week ${week} — ${status}`}
    >
      {status === 'completed' ? (
        <CheckIcon className="w-4 h-4" />
      ) : status === 'locked' ? (
        <LockIcon className="w-3 h-3" />
      ) : (
        week
      )}
    </motion.button>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  accent?: string
  icon?: React.ReactNode
}

const StatCard: React.FC<StatCardProps> = ({ label, value, accent = '#8B949E', icon }) => (
  <motion.div
    variants={cardVariants}
    className="panel flex flex-col gap-1.5 p-4"
  >
    <div className="flex items-center gap-2 text-[#8B949E]">
      {icon && <span className="opacity-70">{icon}</span>}
      <span className="text-xs font-mono uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-2xl font-display font-bold" style={{ color: accent }}>
      {value}
    </span>
  </motion.div>
)

// ─── main component ───────────────────────────────────────────────────────────

interface DashboardProps {
  onSelectWeek: (week: number) => void
  onViewInsights: () => void
  onOpenSettings: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectWeek, onViewInsights, onOpenSettings }) => {
  const activeProfile = useProfilesStore(s => s.getActiveProfile())
  const displayName = activeProfile?.name || 'Learner'

  const {
    xp,
    level,
    currentStreak,
    currentWeek,
    weekProgress,
    studyCalendar,
    unlockedInsights,
    totalMinutesStudied,
    isWeekUnlocked,
  } = useProgressStore()

  const levelName = LEVEL_NAMES[level - 1] ?? LEVEL_NAMES[0]
  const xpProgress = xpToNextLevel(xp, level)
  const mastery = useMemo(() => computeMastery(weekProgress), [weekProgress])
  const heatmapGrid = useMemo(() => buildHeatmapGrid(studyCalendar), [studyCalendar])
  const currentWeekDef = getWeekByNumber(currentWeek)

  const weeksCompleted = useMemo(() => {
    return Object.entries(weekProgress).filter(([, wp]) => wp.lessonRead).length
  }, [weekProgress])

  const totalStudyHours = Math.round(totalMinutesStudied / 60)

  function getWeekStatus(week: number): 'current' | 'completed' | 'available' | 'locked' {
    if (week === currentWeek) return 'current'
    const wp = weekProgress[week]
    if (wp?.lessonRead) return 'completed'
    if (isWeekUnlocked(week)) return 'available'
    return 'locked'
  }

  // Phase header positions: group weeks 1-4, 5-8, 9-12, 13-16
  const phases = [1, 2, 3, 4] as const

  return (
    <div
      className="min-h-screen bg-[#0D1117] text-white font-body"
      style={{
        backgroundImage: `
          linear-gradient(rgba(48,54,61,0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(48,54,61,0.15) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-white">
              Welcome back,{' '}
              <span className="text-[#00D4FF]">{displayName}</span>
            </h1>
            <p className="text-sm text-[#8B949E] font-mono mt-0.5">
              {formatDate(new Date())}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak badge */}
            <div className="flex items-center gap-1.5 bg-[#161B22] border border-[#30363D] rounded-full px-3 py-1.5">
              <FlameIcon className="w-4 h-4 text-[#FFB347]" />
              <span className="text-sm font-mono font-semibold text-[#FFB347]">
                {currentStreak}
              </span>
              <span className="text-xs text-[#8B949E]">day streak</span>
            </div>

            {/* Level badge */}
            <div className="level-badge">
              <StarIcon className="w-3 h-3" />
              <span>Level {level} — {levelName}</span>
            </div>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 bg-[#161B22] border border-[#30363D] rounded-full px-3 py-1.5 text-[#8B949E] hover:text-white hover:border-[#8B949E] transition-all text-xs font-mono"
              title="Account Settings"
            >
              ⚙ Settings
            </button>
          </div>
        </motion.div>

        {/* ── XP PROGRESS ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
          className="panel p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#8B949E]">Experience Points</p>
              <p className="text-lg font-display font-bold text-white mt-0.5">
                <span className="text-[#00D4FF]">{xp.toLocaleString()}</span>
                <span className="text-[#8B949E] text-sm font-normal"> XP total</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-[#8B949E]">Next: Level {level + 1}</p>
              <p className="text-sm font-mono font-semibold text-[#8B949E] mt-0.5">
                {xpProgress.current.toLocaleString()} / {xpProgress.needed.toLocaleString()} XP
              </p>
            </div>
          </div>

          <ProgressBar
            value={xpProgress.current}
            max={xpProgress.needed}
            color="sql"
            size="lg"
          />

          <p className="text-xs font-mono text-[#8B949E] mt-2 text-right">
            {Math.round(xpProgress.pct)}% to {LEVEL_NAMES[level] ?? 'Max Level'}
          </p>
        </motion.div>

        {/* ── MASTERY METERS ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* SQL Mastery */}
          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#00D4FF]">SQL Mastery</span>
              <span className="ml-auto text-lg font-display font-bold text-[#00D4FF]">{mastery.sql}%</span>
            </div>
            <ProgressBar value={mastery.sql} max={100} color="sql" size="md" />
            <p className="text-xs text-[#8B949E] mt-2">
              Structured Query Language — query, aggregate, transform
            </p>
          </div>

          {/* Python Mastery */}
          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#FFB347] shadow-[0_0_8px_rgba(255,179,71,0.8)]" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#FFB347]">Python Mastery</span>
              <span className="ml-auto text-lg font-display font-bold text-[#FFB347]">{mastery.python}%</span>
            </div>
            <ProgressBar value={mastery.python} max={100} color="python" size="md" />
            <p className="text-xs text-[#8B949E] mt-2">
              Python — scripts, pandas, pipelines, automation
            </p>
          </div>
        </motion.div>

        {/* ── WEEK GRID ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.5, ease: 'easeOut' }}
          className="panel p-5"
        >
          <h2 className="text-sm font-mono uppercase tracking-widest text-[#8B949E] mb-4">
            Course Map
          </h2>

          {/* Phase labels */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {phases.map(phase => (
              <div key={phase} className="text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E] border border-[#30363D] rounded px-2 py-0.5">
                  Phase {phase}: {PHASE_NAMES[phase]}
                </span>
              </div>
            ))}
          </div>

          {/* Week dots: 4 columns × 4 rows (weeks 1-4, 5-8, 9-12, 13-16 per column) */}
          <div className="grid grid-cols-4 gap-3">
            {phases.map(phase => {
              const [startWeek, endWeek] = PHASE_RANGES[phase]
              const phaseWeeks = WEEKS.filter(w => w.week >= startWeek && w.week <= endWeek)
              return (
                <div key={phase} className="flex flex-col gap-2 items-center">
                  {phaseWeeks.map(w => (
                    <WeekDot
                      key={w.week}
                      week={w.week}
                      status={getWeekStatus(w.week)}
                      onClick={() => onSelectWeek(w.week)}
                    />
                  ))}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#21262D]">
            {[
              { dot: 'bg-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.7)]', label: 'Current' },
              { dot: 'bg-[#39D353]/20 border border-[#39D353]/50', label: 'Completed' },
              { dot: 'bg-[#21262D] border border-[#30363D]', label: 'Available' },
              { dot: 'bg-[#161B22] border border-[#21262D]', label: 'Locked' },
            ].map(({ dot, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${dot}`} />
                <span className="text-xs text-[#8B949E] font-mono">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── CURRENT WEEK CARD ───────────────────────────────────────────── */}
        {currentWeekDef && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.5, ease: 'easeOut' }}
            className="panel p-6 border border-[#00D4FF]/20 relative overflow-hidden"
          >
            {/* Glow accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-[#8B949E] uppercase tracking-widest">
                      Week {currentWeek} of 16
                    </span>
                    <span className="text-[10px] bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 rounded px-2 py-0.5 font-mono">
                      CURRENT
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">{currentWeekDef.title}</h3>
                  <p className="text-sm text-[#8B949E] mt-0.5">{currentWeekDef.subtitle}</p>
                </div>
                <button
                  className="btn-sql shrink-0"
                  onClick={() => onSelectWeek(currentWeek)}
                >
                  Go to Lesson →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                <div className="bg-[#0D1117] rounded-lg p-3 border border-[#30363D]">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#00D4FF] mb-1">SQL</p>
                  <p className="text-sm text-white leading-snug">{currentWeekDef.sqlTopic}</p>
                </div>
                <div className="bg-[#0D1117] rounded-lg p-3 border border-[#30363D]">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#FFB347] mb-1">Python</p>
                  <p className="text-sm text-white leading-snug">{currentWeekDef.pythonTopic}</p>
                </div>
                {currentWeekDef.miniProject && (
                  <div className="bg-[#0D1117] rounded-lg p-3 border border-[#30363D]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#39D353] mb-1">Mini-Project</p>
                    <p className="text-sm text-white leading-snug">{currentWeekDef.miniProject.name}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STUDY HEATMAP ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.5, ease: 'easeOut' }}
          className="panel p-5"
        >
          <h2 className="text-sm font-mono uppercase tracking-widest text-[#8B949E] mb-4">
            Study Activity — Last 10 Weeks
          </h2>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-1 shrink-0">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="h-4 w-5 text-[9px] font-mono text-[#8B949E] flex items-center justify-end pr-0.5">
                  {['Mo', 'We', 'Fr'].includes(d) ? d : ''}
                </div>
              ))}
            </div>

            {/* Grid columns (each = 1 week) */}
            {heatmapGrid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1 shrink-0">
                {week.map(day => (
                  <div
                    key={day.date}
                    title={day.date}
                    className={`w-4 h-4 rounded-sm transition-colors duration-150 ${
                      !day.inRange
                        ? 'bg-transparent'
                        : day.active
                        ? 'bg-[#39D353] shadow-[0_0_6px_rgba(57,211,83,0.6)]'
                        : 'bg-[#21262D]'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-[#8B949E] font-mono">Less</span>
            {['bg-[#21262D]', 'bg-[#39D353]/30', 'bg-[#39D353]/60', 'bg-[#39D353]'].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span className="text-[10px] text-[#8B949E] font-mono">More</span>
          </div>
        </motion.div>

        {/* ── STATS GRID ──────────────────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <StatCard
            label="Total XP"
            value={xp.toLocaleString()}
            accent="#00D4FF"
            icon={<StarIcon className="w-4 h-4 text-[#00D4FF]" />}
          />
          <StatCard
            label="Current Streak"
            value={`${currentStreak}d`}
            accent="#FFB347"
            icon={<FlameIcon className="w-4 h-4 text-[#FFB347]" />}
          />
          <StatCard
            label="Weeks Done"
            value={`${weeksCompleted}/16`}
            accent="#39D353"
            icon={<CheckIcon className="w-4 h-4 text-[#39D353]" />}
          />
          <StatCard
            label="Study Hours"
            value={totalStudyHours}
            accent="#8B949E"
          />
        </motion.div>

        {/* ── SENIOR INSIGHTS ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
          className="panel p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h2 className="text-sm font-mono uppercase tracking-widest text-[#8B949E] mb-1">
              Senior Insights
            </h2>
            <p className="text-white font-display font-semibold">
              <span className="text-[#FFB347] text-xl">{unlockedInsights.length}</span>
              {' '}insight{unlockedInsights.length !== 1 ? 's' : ''} unlocked
            </p>
            <p className="text-xs text-[#8B949E] mt-1">
              Real-world wisdom from senior analysts, unlocked as you progress.
            </p>
          </div>
          <button className="btn-ghost shrink-0" onClick={onViewInsights}>
            View Collection →
          </button>
        </motion.div>

      </div>
    </div>
  )
}

export default Dashboard
