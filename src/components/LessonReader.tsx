import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getWeekByNumber, WeekDefinition } from '@/data/curriculum'
import { getWeekLesson } from '@/data/lessons'

// ─── icons ────────────────────────────────────────────────────────────────────

const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a7 7 0 0 0-7 7c0 2.6 1.42 4.87 3.5 6.12V17a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-1.88C17.58 13.87 19 11.6 19 9a7 7 0 0 0-7-7zm-1 17h2v1h-2v-1zm1-15a5 5 0 0 1 5 5c0 2.05-1.23 3.81-3 4.58V16h-4v-2.42C8.23 12.81 7 11.05 7 9a5 5 0 0 1 5-5z" />
  </svg>
)

const BriefcaseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.98 16.52 1.5 14.86 1.5h-5.72C7.48 1.5 6 2.98 6 4.64c0 .48.11.92.18 1.36H4C2.9 6 2 6.9 2 8v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM9.14 4.64c0-.46.36-.82.82-.82h4.08c.46 0 .82.36.82.82 0 .48-.1.92-.22 1.36H9.36c-.12-.44-.22-.88-.22-1.36zM20 19H4V8h16v11z" />
  </svg>
)

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const QuestionIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
  </svg>
)

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
)

// ─── props ────────────────────────────────────────────────────────────────────

interface LessonReaderProps {
  week: number
  track: 'sql' | 'python' | 'both'
  onLoadCodeToEditor?: (code: string, language: 'sql' | 'python') => void
  onTermClick?: (term: string) => void
  onMarkRead?: () => void
  isRead?: boolean
}

// ─── inline text renderer ─────────────────────────────────────────────────────

function renderInlineText(
  text: string,
  onTermClick?: (term: string) => void
): React.ReactNode[] {
  // Split on **bold**, backtick inline code, "quoted phrases", and CAPS WORDS
  const parts: React.ReactNode[] = []
  // Combined regex: **bold** | backtick code | "quoted phrase" | CAPS (2+ letters)
  const regex = /(\*\*([^*]+)\*\*)|(`[^`]+`)|("([^"]+)")|(\b[A-Z][A-Z_]{1,}[A-Z]\b)/g
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Plain text before this match
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index))
    }

    if (match[1]) {
      // **bold**
      parts.push(
        <strong key={match.index} className="font-bold text-white">
          {match[2]}
        </strong>
      )
    } else if (match[3]) {
      // Inline code
      const code = match[3].slice(1, -1)
      parts.push(
        <code
          key={match.index}
          className="font-mono text-[0.875em] bg-[#0D1117] text-[#00D4FF] border border-[#30363D] rounded px-1 py-0.5"
        >
          {code}
        </code>
      )
    } else if (match[4]) {
      // Quoted phrase — clickable term
      const term = match[5]
      parts.push(
        <span
          key={match.index}
          className="border-b border-dotted border-[#8B949E] cursor-pointer text-white hover:text-[#00D4FF] hover:border-[#00D4FF] transition-colors"
          onClick={() => onTermClick?.(term)}
          title={`Ask Sage about "${term}"`}
        >
          "{term}"
        </span>
      )
    } else if (match[6]) {
      // CAPS term
      const term = match[6]
      parts.push(
        <span
          key={match.index}
          className="border-b border-dotted border-[#8B949E] cursor-pointer text-[#E6EDF3] hover:text-[#00D4FF] hover:border-[#00D4FF] transition-colors font-mono text-sm"
          onClick={() => onTermClick?.(term)}
          title={`Ask Sage about ${term}`}
        >
          {term}
        </span>
      )
    }

    lastIdx = match.index + match[0].length
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx))
  }

  return parts
}

// ─── content section ──────────────────────────────────────────────────────────

interface ContentSectionProps {
  title: string
  content: string
  sectionIndex: number
  onLoadCodeToEditor?: (code: string, language: 'sql' | 'python') => void
  onTermClick?: (term: string) => void
  onUnderstood: (index: number) => void
  onConfused: (index: number) => void
  understood: boolean
  confused: boolean
}

const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  content,
  sectionIndex,
  onLoadCodeToEditor,
  onTermClick,
  onUnderstood,
  onConfused,
  understood,
  confused,
}) => {
  // Parse content into paragraphs and code fences
  const blocks = parseContentBlocks(content)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-bold text-white">{title}</h3>

      {blocks.map((block, i) => {
        if (block.type === 'code') {
          const lang = block.lang as 'sql' | 'python' | undefined
          return (
            <div key={i} className="lesson-code group relative">
              {lang && (
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-widest ${
                      lang === 'sql' ? 'text-[#00D4FF]' : 'text-[#FFB347]'
                    }`}
                  >
                    {lang}
                  </span>
                  {onLoadCodeToEditor && (
                    <button
                      className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border transition-all ${
                        lang === 'sql'
                          ? 'border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10'
                          : 'border-[#FFB347]/30 text-[#FFB347] hover:bg-[#FFB347]/10'
                      }`}
                      onClick={() => onLoadCodeToEditor(block.content, lang)}
                    >
                      <ExternalLinkIcon className="w-3 h-3" />
                      Load in Editor →
                    </button>
                  )}
                </div>
              )}
              <pre className="text-sm text-[#E6EDF3] overflow-x-auto whitespace-pre-wrap">
                {block.content}
              </pre>
            </div>
          )
        }

        return (
          <p key={i} className="text-[#E6EDF3] leading-relaxed font-body">
            {renderInlineText(block.content, onTermClick)}
          </p>
        )
      })}

      {/* Section footer */}
      <div className="flex items-center gap-3 pt-3 border-t border-[#21262D]">
        <button
          className={`flex items-center gap-1.5 text-sm font-mono px-3 py-1.5 rounded border transition-all ${
            understood
              ? 'bg-[#39D353]/10 border-[#39D353]/40 text-[#39D353]'
              : 'border-[#30363D] text-[#8B949E] hover:border-[#39D353]/40 hover:text-[#39D353]'
          }`}
          onClick={() => onUnderstood(sectionIndex)}
        >
          <CheckIcon className="w-3.5 h-3.5" />
          I understand this section {understood ? '✓' : ''}
        </button>
        <button
          className={`flex items-center gap-1.5 text-sm font-mono px-3 py-1.5 rounded border transition-all ${
            confused
              ? 'bg-[#FF4757]/10 border-[#FF4757]/40 text-[#FF4757]'
              : 'border-[#30363D] text-[#8B949E] hover:border-[#FF4757]/40 hover:text-[#FF4757]'
          }`}
          onClick={() => onConfused(sectionIndex)}
        >
          <QuestionIcon className="w-3.5 h-3.5" />
          I'm confused about this ?
        </button>
      </div>
    </div>
  )
}

// ─── content block parser ─────────────────────────────────────────────────────

interface ContentBlock {
  type: 'text' | 'code'
  content: string
  lang?: string
}

function parseContentBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  // Match triple-backtick OR triple-tilde fences
  const fenceRegex = /(?:```|~~~)(\w+)?\n?([\s\S]*?)(?:```|~~~)/g
  // Match 4-space indented code blocks
  const indentRegex = /^(    .+\n?)+/gm

  let processed = content
  const placeholders: Record<string, ContentBlock> = {}
  let idx = 0

  // Replace fenced code blocks
  processed = processed.replace(fenceRegex, (_, lang, code) => {
    const key = `__CODEBLOCK_${idx++}__`
    placeholders[key] = { type: 'code', content: code.trim(), lang: lang || undefined }
    return key
  })

  // Replace 4-space indented blocks
  processed = processed.replace(indentRegex, (match) => {
    const key = `__CODEBLOCK_${idx++}__`
    const code = match
      .split('\n')
      .filter(Boolean)
      .map(line => line.slice(4))
      .join('\n')
    placeholders[key] = { type: 'code', content: code }
    return key
  })

  // Split on paragraphs
  const paragraphs = processed.split(/\n\n+/).filter(p => p.trim())

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (placeholders[trimmed]) {
      blocks.push(placeholders[trimmed])
    } else {
      // Inline code placeholders within paragraph
      blocks.push({ type: 'text', content: trimmed })
    }
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'text', content: content })
  }

  return blocks
}

// ─── main component ───────────────────────────────────────────────────────────

const LessonReader: React.FC<LessonReaderProps> = ({
  week,
  track: initialTrack,
  onLoadCodeToEditor,
  onTermClick,
  onMarkRead,
  isRead = false,
}) => {
  const weekDef = getWeekByNumber(week) as WeekDefinition | undefined
  const [activeTrack, setActiveTrack] = useState<'sql' | 'python'>(
    initialTrack === 'both' ? 'sql' : initialTrack
  )
  const [checkedObjectives, setCheckedObjectives] = useState<Set<number>>(new Set())
  const [understoodSections, setUnderstoodSections] = useState<Set<number>>(new Set())
  const [confusedSections, setConfusedSections] = useState<Set<number>>(new Set())
  const [scrollProgress, setScrollProgress] = useState(0)
  const [reachedBottom, setReachedBottom] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Track scroll position for reading progress
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const max = scrollHeight - clientHeight
    if (max <= 0) {
      setScrollProgress(100)
      setReachedBottom(true)
      return
    }
    const pct = (scrollTop / max) * 100
    setScrollProgress(pct)
    setReachedBottom(pct >= 90)
  }, [])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  if (!weekDef) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-[#8B949E] font-mono">Week {week} not found in curriculum.</p>
      </div>
    )
  }

  const toggleObjective = (i: number) => {
    setCheckedObjectives(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const handleUnderstood = (i: number) => {
    setUnderstoodSections(prev => {
      const next = new Set(prev)
      next.add(i)
      return next
    })
    setConfusedSections(prev => {
      const next = new Set(prev)
      next.delete(i)
      return next
    })
  }

  const handleConfused = (i: number) => {
    setConfusedSections(prev => {
      const next = new Set(prev)
      next.add(i)
      return next
    })
    setUnderstoodSections(prev => {
      const next = new Set(prev)
      next.delete(i)
      return next
    })
  }

  // Load real lesson content
  const lessonData = getWeekLesson(week)
  const sqlSections = lessonData?.sql ?? [
    {
      title: 'SQL: ' + weekDef.sqlTopic,
      content: `Lesson content for ${weekDef.sqlTopic} is coming soon.`,
    },
  ]
  const pythonSections = lessonData?.python ?? [
    {
      title: 'Python: ' + weekDef.pythonTopic,
      content: `Lesson content for ${weekDef.pythonTopic} is coming soon.`,
    },
  ]

  const contentSections =
    activeTrack === 'sql'
      ? sqlSections.map(s => ({ ...s, title: s.title.startsWith('SQL') ? s.title : 'SQL: ' + s.title }))
      : pythonSections.map(s => ({ ...s, title: s.title.startsWith('Python') ? s.title : 'Python: ' + s.title }))

  const trackColor = activeTrack === 'sql' ? '#00D4FF' : '#FFB347'

  return (
    <div className="flex flex-col h-full">
      {/* ── Reading progress bar ─────────────────────────────────────── */}
      <div className="h-0.5 bg-[#21262D] shrink-0 relative">
        <motion.div
          className="h-full absolute left-0 top-0"
          style={{
            background: `linear-gradient(90deg, ${trackColor}, ${trackColor}88)`,
          }}
          animate={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-[#30363D]">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                style={{
                  background: `${trackColor}1A`,
                  color: trackColor,
                  border: `1px solid ${trackColor}40`,
                }}
              >
                WEEK {weekDef.week}
              </span>
              <span className="text-xs font-mono text-[#8B949E] uppercase tracking-widest">
                Phase {weekDef.phase}
              </span>
              {isRead && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#39D353]/10 text-[#39D353] border border-[#39D353]/30">
                  ✓ Read
                </span>
              )}
            </div>
            <h2 className="text-2xl font-display font-bold text-white">{weekDef.title}</h2>
            <p className="text-sm text-[#8B949E] mt-0.5">{weekDef.subtitle}</p>
          </div>

          {/* Track selector (only when both) */}
          {initialTrack === 'both' && (
            <div className="flex items-center gap-1 bg-[#0D1117] border border-[#30363D] rounded-lg p-1">
              <button
                className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                  activeTrack === 'sql'
                    ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30'
                    : 'text-[#8B949E] hover:text-white'
                }`}
                onClick={() => setActiveTrack('sql')}
              >
                SQL
              </button>
              <button
                className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                  activeTrack === 'python'
                    ? 'bg-[#FFB347]/10 text-[#FFB347] border border-[#FFB347]/30'
                    : 'text-[#8B949E] hover:text-white'
                }`}
                onClick={() => setActiveTrack('python')}
              >
                Python
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
      >
        {/* Analogy card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-lg p-4 border"
          style={{
            background: 'rgba(240, 165, 0, 0.05)',
            borderColor: 'rgba(240, 165, 0, 0.3)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <LightbulbIcon className="w-4 h-4 text-[#F0A500] shrink-0" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#F0A500]">
              The Big Picture
            </span>
          </div>
          <p className="text-[#E6EDF3] leading-relaxed font-body italic">
            {renderInlineText(weekDef.analogy, onTermClick)}
          </p>
        </motion.div>

        {/* Real-world context card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <BriefcaseIcon className="w-4 h-4 text-[#8B949E] shrink-0" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#8B949E]">
              This Week's Scenario
            </span>
          </div>
          <p className="text-[#E6EDF3] leading-relaxed font-body">
            {renderInlineText(weekDef.realWorldContext, onTermClick)}
          </p>
        </motion.div>

        {/* Learning objectives */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="panel p-4"
        >
          <h3 className="text-sm font-mono uppercase tracking-widest text-[#8B949E] mb-3">
            Learning Objectives
          </h3>
          <ul className="space-y-2">
            {weekDef.learningObjectives.map((obj, i) => (
              <li
                key={i}
                className="flex items-start gap-3 cursor-pointer group"
                onClick={() => toggleObjective(i)}
              >
                <div
                  className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                    checkedObjectives.has(i)
                      ? 'bg-[#39D353] border-[#39D353]'
                      : 'border-[#30363D] group-hover:border-[#39D353]/50'
                  }`}
                >
                  {checkedObjectives.has(i) && (
                    <CheckIcon className="w-2.5 h-2.5 text-[#0D1117]" />
                  )}
                </div>
                <span
                  className={`text-sm font-body leading-snug transition-colors ${
                    checkedObjectives.has(i) ? 'text-[#8B949E] line-through' : 'text-[#E6EDF3]'
                  }`}
                >
                  {obj}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#8B949E] font-mono mt-3">
            {checkedObjectives.size}/{weekDef.learningObjectives.length} objectives checked
          </p>
        </motion.div>

        {/* Content sections */}
        {contentSections
          .map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="panel p-5"
            >
              <ContentSection
                title={section.title}
                content={section.content}
                sectionIndex={i}
                onLoadCodeToEditor={onLoadCodeToEditor}
                onTermClick={onTermClick}
                onUnderstood={handleUnderstood}
                onConfused={handleConfused}
                understood={understoodSections.has(i)}
                confused={confusedSections.has(i)}
              />
            </motion.div>
          ))}

        {/* Mark as Read button — appears when user reaches bottom */}
        <AnimatePresence>
          {reachedBottom && !isRead && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-center py-4"
            >
              <button
                className="btn-success flex items-center gap-2 px-6 py-3 text-base"
                onClick={onMarkRead}
              >
                <CheckIcon className="w-4 h-4" />
                Mark as Read — Earn 50 XP
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isRead && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-sm font-mono text-[#39D353]">
              <CheckIcon className="w-4 h-4" />
              Lesson marked as read
            </div>
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-8" />
      </div>
    </div>
  )
}

export default LessonReader
