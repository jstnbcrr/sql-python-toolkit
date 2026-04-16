import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import rawInsights from '@/data/senior_insights.json'
import { useProgressStore } from '@/store/progress'

// ─── types ────────────────────────────────────────────────────────────────────

interface InsightData {
  id: string
  title: string
  week_unlock: number
  track: 'sql' | 'python' | 'both'
  teaser: string
  content: string
  code_example: string
  senior_tip: string
}

// Assert type from JSON
const ALL_INSIGHTS: InsightData[] = rawInsights as InsightData[]

// ─── icons ────────────────────────────────────────────────────────────────────

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1C9.24 1 7 3.24 7 6v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2h-2V6c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V6c0-1.66 1.34-3 3-3zm0 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
  </svg>
)

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a7 7 0 0 0-7 7c0 2.6 1.42 4.87 3.5 6.12V17a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-1.88C17.58 13.87 19 11.6 19 9a7 7 0 0 0-7-7zm-1 17h2v1h-2v-1z" />
  </svg>
)

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

// ─── syntax-highlighted code block ───────────────────────────────────────────

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON',
  'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'AND', 'OR',
  'NOT', 'IN', 'LIKE', 'IS', 'NULL', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'DISTINCT', 'UNION', 'ALL', 'EXCEPT', 'INTERSECT', 'WITH', 'CASE',
  'WHEN', 'THEN', 'ELSE', 'END', 'INSERT', 'UPDATE', 'DELETE', 'CREATE',
  'TABLE', 'INDEX', 'EXPLAIN', 'PARTITION', 'OVER', 'ROW_NUMBER', 'RANK',
  'LAG', 'LEAD', 'COALESCE', 'NULLIF', 'CAST', 'DATE', 'STRFTIME',
]

const PYTHON_KEYWORDS = [
  'import', 'from', 'def', 'class', 'return', 'if', 'elif', 'else', 'for',
  'while', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'lambda',
  'with', 'as', 'try', 'except', 'finally', 'raise', 'pass', 'break',
  'continue', 'yield', 'async', 'await', 'print',
]

function highlightCode(code: string, isSql: boolean): React.ReactNode[] {
  const keywords = isSql ? SQL_KEYWORDS : PYTHON_KEYWORDS
  const lines = code.split('\n')
  const accentColor = isSql ? '#00D4FF' : '#FFB347'

  return lines.map((line, lineIdx) => {
    // Handle SQL comments
    if (line.trim().startsWith('--') || line.trim().startsWith('#')) {
      return (
        <span key={lineIdx} className="block">
          <span className="text-[#8B949E] italic">{line}</span>
          {lineIdx < lines.length - 1 ? '\n' : ''}
        </span>
      )
    }

    const tokens: React.ReactNode[] = []
    let remaining = line
    let tokenIdx = 0

    while (remaining.length > 0) {
      // String literals
      const strMatch = remaining.match(/^('[^']*'|"[^"]*")/)
      if (strMatch) {
        tokens.push(
          <span key={tokenIdx++} className="text-[#A5D6FF]">{strMatch[0]}</span>
        )
        remaining = remaining.slice(strMatch[0].length)
        continue
      }

      // Numbers
      const numMatch = remaining.match(/^\d+(\.\d+)?/)
      if (numMatch) {
        tokens.push(
          <span key={tokenIdx++} className="text-[#F0A500]">{numMatch[0]}</span>
        )
        remaining = remaining.slice(numMatch[0].length)
        continue
      }

      // Keywords
      const kwMatch = keywords.find(kw => {
        const re = new RegExp(`^${kw}(?=[^a-zA-Z0-9_]|$)`, isSql ? 'i' : '')
        return re.test(remaining)
      })
      if (kwMatch) {
        const actualKw = remaining.slice(0, kwMatch.length)
        tokens.push(
          <span key={tokenIdx++} style={{ color: accentColor }} className="font-semibold">{actualKw}</span>
        )
        remaining = remaining.slice(kwMatch.length)
        continue
      }

      // Function calls (word followed by open paren)
      const fnMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/)
      if (fnMatch) {
        tokens.push(
          <span key={tokenIdx++} className="text-[#D2A8FF]">{fnMatch[0]}</span>
        )
        remaining = remaining.slice(fnMatch[0].length)
        continue
      }

      // Default: consume one character
      tokens.push(remaining[0])
      remaining = remaining.slice(1)
    }

    return (
      <span key={lineIdx} className="block">
        {tokens}
        {lineIdx < lines.length - 1 ? '\n' : ''}
      </span>
    )
  })
}

// ─── track badge ─────────────────────────────────────────────────────────────

const TrackBadge: React.FC<{ track: 'sql' | 'python' | 'both' }> = ({ track }) => {
  if (track === 'both') {
    return (
      <span
        className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border font-bold"
        style={{
          background: 'linear-gradient(90deg, rgba(0,212,255,0.15), rgba(255,179,71,0.15))',
          borderColor: 'rgba(0,212,255,0.3)',
          color: '#E6EDF3',
        }}
      >
        SQL + Python
      </span>
    )
  }
  if (track === 'sql') {
    return (
      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border bg-[#00D4FF]/10 border-[#00D4FF]/30 text-[#00D4FF] font-bold">
        SQL
      </span>
    )
  }
  return (
    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border bg-[#FFB347]/10 border-[#FFB347]/30 text-[#FFB347] font-bold">
      Python
    </span>
  )
}

// ─── SeniorInsightCard props ──────────────────────────────────────────────────

interface SeniorInsightCardProps {
  insight: InsightData
  isUnlocked: boolean
  onUnlock?: () => void
}

// ─── SeniorInsightCard ────────────────────────────────────────────────────────

export const SeniorInsightCard: React.FC<SeniorInsightCardProps> = ({
  insight,
  isUnlocked,
  onUnlock,
}) => {
  const isSql = insight.track === 'sql' || insight.track === 'both'
  const accentColor = insight.track === 'sql' ? '#00D4FF' : insight.track === 'python' ? '#FFB347' : '#00D4FF'

  if (!isUnlocked) {
    return (
      <div className="insight-card relative overflow-hidden opacity-70">
        {/* Blurred content behind */}
        <div className="blur-sm select-none pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <TrackBadge track={insight.track} />
          </div>
          <h3 className="text-base font-display font-bold text-white mb-2">{insight.title}</h3>
          <p className="text-sm text-[#8B949E] leading-relaxed">{insight.content.slice(0, 80)}...</p>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1C2128]/80 backdrop-blur-sm rounded-lg">
          <LockIcon className="w-8 h-8 text-[#8B949E] mb-2" />
          <p className="text-sm font-display font-semibold text-white mb-1">
            Unlocks at Week {insight.week_unlock}
          </p>
          <p className="text-xs text-[#8B949E] font-mono text-center px-4">{insight.teaser}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="panel border transition-all cursor-default"
      style={{ borderColor: `${accentColor}20` }}
      whileHover={{ borderColor: `${accentColor}40` }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#21262D]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <TrackBadge track={insight.track} />
          <span className="text-[10px] font-mono text-[#8B949E]">Unlocks at Week {insight.week_unlock}</span>
        </div>
        <h3 className="text-lg font-display font-bold text-white leading-snug">{insight.title}</h3>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-4">
        <p className="text-sm text-[#E6EDF3] leading-relaxed font-body">{insight.content}</p>

        {/* Code example */}
        {insight.code_example && (
          <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-4 overflow-x-auto">
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: accentColor }}>
              {isSql ? 'SQL Example' : 'Python Example'}
            </p>
            <pre className="text-xs font-mono leading-relaxed whitespace-pre">
              {highlightCode(insight.code_example, isSql)}
            </pre>
          </div>
        )}

        {/* Senior tip */}
        {insight.senior_tip && (
          <div
            className="rounded-lg p-4"
            style={{
              background: 'rgba(240, 165, 0, 0.05)',
              borderLeft: '4px solid #F0A500',
              border: '1px solid rgba(240,165,0,0.20)',
              borderLeftWidth: '4px',
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <LightbulbIcon className="w-3.5 h-3.5 text-[#F0A500] shrink-0" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#F0A500] font-bold">
                Senior Tip
              </span>
            </div>
            <p className="text-sm text-[#E6EDF3] leading-relaxed font-body italic">
              "{insight.senior_tip}"
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4">
        <p className="text-[10px] font-mono text-[#8B949E]">
          Earned at Week {insight.week_unlock} · {insight.track.toUpperCase()} track
        </p>
      </div>
    </motion.div>
  )
}

// ─── SeniorInsightCollection props ───────────────────────────────────────────

interface SeniorInsightCollectionProps {
  onClose: () => void
}

type FilterTab = 'all' | 'sql' | 'python' | 'unlocked'

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sql', label: 'SQL' },
  { id: 'python', label: 'Python' },
  { id: 'unlocked', label: 'Unlocked' },
]

// ─── SeniorInsightCollection ──────────────────────────────────────────────────

export const SeniorInsightCollection: React.FC<SeniorInsightCollectionProps> = ({ onClose }) => {
  const { unlockedInsights, unlockInsight, currentWeek } = useProgressStore()
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  // An insight is accessible if current week >= week_unlock OR explicitly unlocked
  const isUnlocked = (insight: InsightData): boolean =>
    currentWeek >= insight.week_unlock || unlockedInsights.includes(insight.id)

  const filteredInsights = useMemo(() => {
    return ALL_INSIGHTS.filter(insight => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'sql') return insight.track === 'sql' || insight.track === 'both'
      if (activeFilter === 'python') return insight.track === 'python' || insight.track === 'both'
      if (activeFilter === 'unlocked') return isUnlocked(insight)
      return true
    })
  }, [activeFilter, unlockedInsights, currentWeek])

  const unlockedCount = ALL_INSIGHTS.filter(i => isUnlocked(i)).length

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.06 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 80, damping: 18 },
    },
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-[#0D1117]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <div className="shrink-0 relative z-10 px-6 py-5 border-b border-[#30363D] bg-[#161B22]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <StarIcon className="w-6 h-6 text-[#F0A500]" />
            <div>
              <h2 className="text-xl font-display font-bold text-white">Senior Insights</h2>
              <p className="text-xs font-mono text-[#8B949E]">
                Real-world wisdom unlocked as you progress
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#F0A500]/10 border border-[#F0A500]/30 rounded-full px-3 py-1">
              <span className="text-sm font-display font-bold text-[#F0A500]">{unlockedCount}</span>
              <span className="text-xs font-mono text-[#8B949E]">/ {ALL_INSIGHTS.length}</span>
            </div>
          </div>

          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#30363D] text-[#8B949E] hover:text-white hover:border-[#8B949E] transition-all"
            onClick={onClose}
            aria-label="Close insights"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="max-w-5xl mx-auto mt-4 flex items-center gap-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30'
                  : 'text-[#8B949E] border border-transparent hover:text-white hover:border-[#30363D]'
              }`}
              onClick={() => setActiveFilter(tab.id)}
            >
              {tab.label}
              {tab.id === 'unlocked' && (
                <span className="ml-1.5 text-[#F0A500]">{unlockedCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {filteredInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LockIcon className="w-12 h-12 text-[#30363D]" />
              <p className="text-[#8B949E] font-mono text-sm">No insights match this filter.</p>
            </div>
          ) : (
            <motion.div
              key={activeFilter}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredInsights.map(insight => {
                const unlocked = isUnlocked(insight)
                return (
                  <motion.div
                    key={insight.id}
                    variants={itemVariants}
                    className={!unlocked ? 'opacity-50' : ''}
                  >
                    <SeniorInsightCard
                      insight={insight}
                      isUnlocked={unlocked}
                      onUnlock={() => unlockInsight(insight.id)}
                    />
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          <div className="h-8" />
        </div>
      </div>
    </motion.div>
  )
}

export default SeniorInsightCard
