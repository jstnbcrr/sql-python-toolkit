import React, { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { streamSageChat, buildSageSystemPrompt, SageMessage } from '@/api/sage'
import { getWeekLesson } from '@/data/lessons'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SageTutorProps {
  currentWeek: number
  currentTopic: string
  currentPhase: number
  activeTrack: 'sql' | 'python' | 'both'
  selectedCode?: string
  isOpen: boolean
  onToggle: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWelcomeMessage(week: number, topic: string, phase: number): string {
  const phaseLabel = phase === 1 ? 'foundations' : phase === 2 ? 'intermediate work' : 'advanced topics'
  return `Hey — good to see you at Week ${week}. We're deep in **${topic}** right now, which is some of the most important ${phaseLabel} you'll cover.\n\nI'm here whenever you're confused, want a challenge, or just need a second opinion. What are you working through?`
}

function getConnectLabel(activeTrack: 'sql' | 'python' | 'both'): string {
  if (activeTrack === 'sql') return 'Connect to Python'
  if (activeTrack === 'python') return 'Connect to SQL'
  return 'Bridge SQL ↔ Python'
}

// ─── Markdown-ish renderer ────────────────────────────────────────────────────

function renderMarkdown(text: string, isStreaming: boolean): React.ReactNode {
  // Split on code blocks first
  const codeBlockRegex = /```[\w]*\n?([\s\S]*?)```/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{renderInlineMarkdown(text.slice(lastIndex, match.index))}</span>
      )
    }
    parts.push(
      <pre
        key={key++}
        className="my-2 p-3 rounded-md bg-[#0D1117] border border-[#30363D] text-xs font-mono text-[#E6EDF3] overflow-x-auto whitespace-pre-wrap break-all"
      >
        {match[1].trim()}
      </pre>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={key++}>{renderInlineMarkdown(text.slice(lastIndex))}</span>
    )
  }

  return (
    <>
      {parts}
      {isStreaming && <span className="typewriter-cursor" />}
    </>
  )
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Handle **bold** and `inline code`
  const tokenRegex = /(\*\*(.+?)\*\*|`([^`]+)`)/g
  const nodes: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let k = 0

  while ((m = tokenRegex.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(<span key={k++}>{text.slice(last, m.index)}</span>)
    }
    if (m[0].startsWith('**')) {
      nodes.push(<strong key={k++} className="font-semibold text-[#E6EDF3]">{m[2]}</strong>)
    } else {
      nodes.push(
        <code
          key={k++}
          className="px-1 py-0.5 rounded bg-[#0D1117] border border-[#30363D] text-[#00D4FF] text-xs font-mono"
        >
          {m[3]}
        </code>
      )
    }
    last = m.index + m[0].length
  }

  if (last < text.length) {
    nodes.push(<span key={k++}>{text.slice(last)}</span>)
  }

  return nodes
}

// ─── Sage Avatar ──────────────────────────────────────────────────────────────

const SageAvatar: React.FC<{ isPulsing: boolean; size?: number }> = ({ isPulsing, size = 36 }) => (
  <motion.div
    animate={isPulsing ? { filter: ['drop-shadow(0 0 4px #00D4FF)', 'drop-shadow(0 0 10px #00D4FF)', 'drop-shadow(0 0 4px #00D4FF)'] } : { filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.4))' }}
    transition={isPulsing ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
    style={{ width: size, height: size, flexShrink: 0 }}
  >
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="18,2 32,10 32,26 18,34 4,26 4,10"
        fill="#161B22"
        stroke="#00D4FF"
        strokeWidth="1.5"
      />
      <polygon
        points="18,8 27,13 27,23 18,28 9,23 9,13"
        fill="#0D1117"
        stroke="rgba(0,212,255,0.3)"
        strokeWidth="1"
      />
      <circle cx="18" cy="18" r="4" fill="#00D4FF" opacity="0.9" />
      <circle cx="18" cy="18" r="2" fill="#161B22" />
    </svg>
  </motion.div>
)

// ─── Copy button ──────────────────────────────────────────────────────────────

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded text-[10px] font-mono text-[#8B949E] hover:text-[#00D4FF] bg-[#0D1117] border border-[#30363D] hover:border-[#00D4FF]"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ msg: ChatMessage; isStreaming: boolean }> = ({ msg, isStreaming }) => {
  const isUser = msg.role === 'user'
  const timeStr = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20, y: 4 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end mb-3"
      >
        <div className="max-w-[80%]">
          <div className="px-3 py-2 rounded-2xl rounded-tr-sm bg-[#21262D] border border-[#30363D] text-sm text-[#E6EDF3] leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </div>
          <div className="text-right mt-0.5 text-[10px] text-[#8B949E]">{timeStr}</div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-2 mb-4"
    >
      <SageAvatar isPulsing={isStreaming} size={28} />
      <div className="flex-1 min-w-0">
        <div className="relative group pl-3 border-l-2 border-[#00D4FF]/50 text-sm text-[#C9D1D9] leading-relaxed">
          <div className="break-words">
            {renderMarkdown(msg.content, isStreaming)}
          </div>
          {!isStreaming && <CopyButton text={msg.content} />}
        </div>
        <div className="mt-0.5 text-[10px] text-[#8B949E] pl-3">{timeStr}</div>
      </div>
    </motion.div>
  )
}

// ─── Welcome Card ─────────────────────────────────────────────────────────────

const WelcomeCard: React.FC<{ week: number; topic: string; phase: number }> = ({ week, topic, phase }) => {
  const msg = getWelcomeMessage(week, topic, phase)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-2 mb-4 p-4 rounded-xl bg-[#1C2128] border border-[#00D4FF]/20"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <SageAvatar isPulsing={false} size={32} />
        <div>
          <div className="text-sm font-semibold text-[#E6EDF3]" style={{ fontFamily: "'Syne', sans-serif" }}>
            Sage
          </div>
          <div className="text-[10px] text-[#8B949E]">Ready to help</div>
        </div>
      </div>
      <div className="text-sm text-[#C9D1D9] leading-relaxed pl-1">
        {renderMarkdown(msg, false)}
      </div>
    </motion.div>
  )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

interface QuickActionsProps {
  activeTrack: 'sql' | 'python' | 'both'
  onAction: (action: string) => void
  disabled: boolean
}

const QuickActions: React.FC<QuickActionsProps> = ({ activeTrack, onAction, disabled }) => {
  const actions = [
    'Explain differently',
    'Give me an analogy',
    'What would a senior do?',
    "I'm stuck — hint",
    'Quiz me',
    'Easier way?',
    getConnectLabel(activeTrack),
  ]

  return (
    <div className="flex gap-2 overflow-x-auto py-2 px-3 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {actions.map((action) => (
        <button
          key={action}
          onClick={() => onAction(action)}
          disabled={disabled}
          className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium text-[#8B949E] border border-[#30363D] bg-[#161B22] hover:border-[#00D4FF] hover:text-[#00D4FF] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {action}
        </button>
      ))}
    </div>
  )
}

// ─── Selected Code Banner ─────────────────────────────────────────────────────

const SelectedCodeBanner: React.FC<{ code: string }> = ({ code }) => {
  const preview = code.length > 80 ? code.slice(0, 77) + '…' : code
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="mx-3 mb-2 px-3 py-2 rounded-lg bg-[#0D1117] border border-[#00D4FF]/30"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
        <span className="text-[10px] font-medium text-[#00D4FF] uppercase tracking-wide">
          Code selected — ask Sage about it
        </span>
      </div>
      <pre className="text-[10px] font-mono text-[#8B949E] truncate">{preview}</pre>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SageTutor: React.FC<SageTutorProps> = ({
  currentWeek,
  currentTopic,
  currentPhase,
  activeTrack,
  selectedCode,
  isOpen,
  onToggle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingSelectedCode = useRef<string | undefined>(undefined)

  // Track selected code to include in next message
  useEffect(() => {
    if (selectedCode) {
      pendingSelectedCode.current = selectedCode
    }
  }, [selectedCode])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const lineHeight = 20
    const maxHeight = lineHeight * 4 + 16
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px'
  }, [inputValue])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      // Prepend selected code context if present
      let fullContent = trimmed
      const codeCtx = pendingSelectedCode.current
      if (codeCtx) {
        fullContent = `[Selected code]\n\`\`\`\n${codeCtx}\n\`\`\`\n\n${trimmed}`
        pendingSelectedCode.current = undefined
      }

      const userMsg: ChatMessage = {
        role: 'user',
        content: fullContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInputValue('')
      setIsLoading(true)

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      const weekLesson = getWeekLesson(currentWeek)
      const lessonContent = weekLesson
        ? [...(weekLesson.sql || []), ...(weekLesson.python || [])]
            .map(s => `${s.title}\n${s.content}`)
            .join('\n\n')
        : ''
      const systemPrompt = buildSageSystemPrompt(currentWeek, currentTopic, currentPhase, lessonContent)

      const history: SageMessage[] = messages
        .concat(userMsg)
        .map((m) => ({ role: m.role, content: m.content }))

      await streamSageChat(
        history,
        systemPrompt,
        (token: string) => {
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: last.content + token }
            }
            return updated
          })
        },
        () => {
          setIsLoading(false)
        },
        (err: string) => {
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last.role === 'assistant' && last.content === '') {
              updated[updated.length - 1] = {
                ...last,
                content: `Sorry, I hit an error: ${err}`,
              }
            }
            return updated
          })
          setIsLoading(false)
        }
      )
    },
    [isLoading, messages, currentWeek, currentTopic, currentPhase]
  )

  const handleSubmit = useCallback(() => {
    sendMessage(inputValue)
  }, [inputValue, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleQuickAction = useCallback(
    (action: string) => {
      sendMessage(action)
    },
    [sendMessage]
  )

  const handleClearChat = useCallback(() => {
    setMessages([])
    setInputValue('')
  }, [])

  // ── Closed sliver ───────────────────────────────────────────────────────────

  if (!isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-between h-full w-10 bg-[#161B22] border-l border-[#30363D] py-4 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex flex-col items-center gap-1">
          <SageAvatar isPulsing={false} size={24} />
        </div>

        <div
          className="flex-1 flex items-center justify-center"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          <span
            className="text-xs font-bold tracking-[0.25em] text-[#00D4FF]"
            style={{ fontFamily: "'Syne', sans-serif", transform: 'rotate(180deg)' }}
          >
            SAGE
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-7 h-7 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/40 flex items-center justify-center"
          style={{ boxShadow: '0 0 8px rgba(0,212,255,0.35)' }}
          onClick={(e) => { e.stopPropagation(); onToggle() }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3 2L6 5L3 8" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </motion.div>
    )
  }

  // ── Open panel ──────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ width: 40, opacity: 0.5 }}
      animate={{ width: 360, opacity: 1 }}
      exit={{ width: 40, opacity: 0.5 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="flex flex-col h-full bg-[#161B22] border-l border-[#30363D] overflow-hidden"
      style={{ minWidth: 360, maxWidth: 360 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#30363D] bg-[#1C2128] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <SageAvatar isPulsing={isLoading} size={36} />
          <div>
            <div
              className="text-sm font-bold text-[#E6EDF3] leading-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Sage
            </div>
            <div className="text-[10px] text-[#8B949E]">Senior Data Engineer · 15 yrs</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isLoading && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="flex gap-1 items-center px-2 py-0.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20"
            >
              <div className="w-1 h-1 rounded-full bg-[#00D4FF]" />
              <span className="text-[9px] text-[#00D4FF] font-medium">thinking</span>
            </motion.div>
          )}
          <button
            onClick={onToggle}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#21262D] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Context pill — week/topic */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#21262D] flex-shrink-0">
        <span className="text-[10px] text-[#8B949E]">Week {currentWeek}</span>
        <span className="text-[#30363D]">·</span>
        <span className="text-[10px] text-[#8B949E] truncate">{currentTopic}</span>
        <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wide border"
          style={
            activeTrack === 'sql'
              ? { color: '#00D4FF', borderColor: 'rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.06)' }
              : activeTrack === 'python'
              ? { color: '#FFB347', borderColor: 'rgba(255,179,71,0.3)', background: 'rgba(255,179,71,0.06)' }
              : { color: '#39D353', borderColor: 'rgba(57,211,83,0.3)', background: 'rgba(57,211,83,0.06)' }
          }
        >
          {activeTrack}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 pt-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#30363D transparent' }}
      >
        {messages.length === 0 ? (
          <WelcomeCard week={currentWeek} topic={currentTopic} phase={currentPhase} />
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                isStreaming={isLoading && i === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}
          </AnimatePresence>
        )}
        {/* Scroll anchor */}
        <div className="h-2" />
      </div>

      {/* Selected code banner */}
      <AnimatePresence>
        {selectedCode && (
          <SelectedCodeBanner code={selectedCode} key="code-banner" />
        )}
      </AnimatePresence>

      {/* Quick actions */}
      <div className="flex-shrink-0 border-t border-[#21262D]">
        <QuickActions activeTrack={activeTrack} onAction={handleQuickAction} disabled={isLoading} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-[#30363D] bg-[#1C2128] px-3 py-2.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Sage anything…"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#00D4FF]/60 transition-colors leading-5 disabled:opacity-50"
            style={{ minHeight: 36, maxHeight: 100, scrollbarWidth: 'none' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: inputValue.trim() && !isLoading ? '#00D4FF' : 'rgba(0,212,255,0.12)',
              boxShadow: inputValue.trim() && !isLoading ? '0 0 10px rgba(0,212,255,0.4)' : 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8L14 2L10 8L14 14L2 8Z"
                fill={inputValue.trim() && !isLoading ? '#0D1117' : '#00D4FF'}
                stroke="none"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-[#8B949E]">Shift+Enter for newline</span>
          <button
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="text-[10px] text-[#8B949E] hover:text-[#E6EDF3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Clear chat
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default SageTutor
