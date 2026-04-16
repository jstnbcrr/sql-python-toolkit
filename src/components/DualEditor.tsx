import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SQLEditor, { QueryResult } from './SQLEditor'
import PythonEditor from './PythonEditor'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DualEditorProps {
  week: number
  datasetName: string
  onSageError?: (error: string, code: string, language: 'sql' | 'python') => void
  onMirrorReady?: (code: string, from: 'sql' | 'python') => void
  onCodeSelect?: (code: string, language: 'sql' | 'python') => void
}

type ActiveTab = 'sql' | 'python'

interface MirrorPanel {
  code: string
  from: 'sql' | 'python'
}

// ─── Draggable Divider ────────────────────────────────────────────────────────

interface DividerProps {
  onDrag: (deltaX: number) => void
}

function VerticalDivider({ onDrag }: DividerProps) {
  const isDragging = useRef(false)
  const lastX = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isDragging.current = true
      lastX.current = e.clientX

      const handleMove = (ev: MouseEvent) => {
        if (!isDragging.current) return
        const delta = ev.clientX - lastX.current
        lastX.current = ev.clientX
        onDrag(delta)
      }

      const handleUp = () => {
        isDragging.current = false
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    },
    [onDrag]
  )

  return (
    <div
      className="relative flex-shrink-0 w-2 group cursor-col-resize select-none z-10"
      onMouseDown={handleMouseDown}
      title="Drag to resize"
    >
      {/* Visual line */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border-default group-hover:bg-accent-sql/50 transition-colors duration-150" />
      {/* Drag handle dots */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1 h-1 rounded-full bg-accent-muted" />
        ))}
      </div>
    </div>
  )
}

// ─── Mirror Bridge Panel ──────────────────────────────────────────────────────

interface MirrorBridgePanelProps {
  mirror: MirrorPanel
  onDismiss: () => void
}

function MirrorBridgePanel({ mirror, onDismiss }: MirrorBridgePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="mx-3 my-2 panel border-accent-muted/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-bg-tertiary border-b border-border-default">
          <div className="flex items-center gap-2">
            <span className="text-accent-muted text-base leading-none">≈</span>
            <span className="text-xs font-display font-semibold text-accent-muted">
              SQL ↔ Python Bridge
            </span>
            <span className="text-xs font-mono text-border-strong">
              from {mirror.from === 'sql' ? 'SQL → Python' : 'Python → SQL'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="btn-ghost text-xs px-2 py-1"
              onClick={() => setIsExpanded(v => !v)}
            >
              {isExpanded ? '▲ Collapse' : '▼ Expand'}
            </button>
            <button
              className="btn-ghost text-xs px-2 py-1"
              onClick={onDismiss}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Code content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <pre className="p-4 text-xs font-mono text-[#E6EDF3] leading-relaxed overflow-x-auto whitespace-pre-wrap break-words bg-bg-primary">
                {mirror.code}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Mobile Tab Bar ───────────────────────────────────────────────────────────

interface TabBarProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
}

function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="relative flex items-center gap-1 p-1 bg-bg-tertiary rounded-full border border-border-default mx-3 mt-3">
      {/* Sliding pill */}
      <motion.div
        layout
        layoutId="tab-pill"
        className={`absolute top-1 bottom-1 rounded-full transition-colors ${
          activeTab === 'sql'
            ? 'bg-accent-sql/10 border border-accent-sql/30'
            : 'bg-accent-python/10 border border-accent-python/30'
        }`}
        style={{
          left: activeTab === 'sql' ? '4px' : '50%',
          right: activeTab === 'sql' ? '50%' : '4px',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      />

      {(['sql', 'python'] as ActiveTab[]).map(tab => (
        <button
          key={tab}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-display font-semibold transition-colors duration-150 ${
            activeTab === tab
              ? tab === 'sql'
                ? 'text-accent-sql'
                : 'text-accent-python'
              : 'text-accent-muted hover:text-white'
          }`}
          onClick={() => onTabChange(tab)}
        >
          {tab === 'sql' ? (
            <>
              <span>⬡</span> SQL
            </>
          ) : (
            <>
              <span>🐍</span> Python
            </>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Dataset Badge ────────────────────────────────────────────────────────────

function DatasetBadge({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border-default bg-bg-primary text-xs font-mono text-accent-muted">
      <DatabaseIcon className="opacity-50" />
      <span>Dataset: {name}</span>
    </div>
  )
}

// ─── Ask Sage Button (floats when text is selected) ───────────────────────────

interface AskSageButtonProps {
  visible: boolean
  onAsk: () => void
}

function AskSageButton({ visible, onAsk }: AskSageButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 4 }}
          transition={{ duration: 0.15 }}
          className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 border-accent-sql/30 text-accent-sql hover:bg-accent-sql/10"
          onClick={onAsk}
        >
          <span>✦</span>
          Ask Sage about this
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// ─── Main DualEditor Component ────────────────────────────────────────────────

export default function DualEditor({
  week,
  datasetName,
  onSageError,
  onMirrorReady,
  onCodeSelect,
}: DualEditorProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('sql')
  const [lastActive, setLastActive] = useState<ActiveTab>('sql')
  const [mirrorPanel, setMirrorPanel] = useState<MirrorPanel | null>(null)
  const [selectedCode, setSelectedCode] = useState<{ text: string; lang: ActiveTab } | null>(null)

  // Resizable panel state (desktop): leftWidth is a percentage 0–100
  const [leftWidthPct, setLeftWidthPct] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDividerDrag = useCallback((deltaX: number) => {
    if (!containerRef.current) return
    const totalWidth = containerRef.current.offsetWidth
    setLeftWidthPct(prev => {
      const newPct = prev + (deltaX / totalWidth) * 100
      return Math.max(25, Math.min(75, newPct))
    })
  }, [])

  // Track which editor is active on interaction
  const handleSQLInteraction = useCallback(() => setLastActive('sql'), [])
  const handlePythonInteraction = useCallback(() => setLastActive('python'), [])

  // Mirror request handlers
  const handleSQLMirror = useCallback(
    (code: string) => {
      setMirrorPanel({ code, from: 'sql' })
      onMirrorReady?.(code, 'sql')
    },
    [onMirrorReady]
  )

  const handlePythonMirror = useCallback(
    (code: string) => {
      setMirrorPanel({ code, from: 'python' })
      onMirrorReady?.(code, 'python')
    },
    [onMirrorReady]
  )

  // Error handlers
  const handleSQLError = useCallback(
    (error: string, code: string) => {
      onSageError?.(error, code, 'sql')
    },
    [onSageError]
  )

  const handlePythonError = useCallback(
    (error: string, code: string) => {
      onSageError?.(error, code, 'python')
    },
    [onSageError]
  )

  // Selection detection via mouseup on the container
  const handleContainerMouseUp = useCallback(
    (lang: ActiveTab) => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setSelectedCode(null)
        return
      }
      const text = selection.toString().trim()
      if (text.length > 3) {
        setSelectedCode({ text, lang })
      } else {
        setSelectedCode(null)
      }
    },
    []
  )

  // Dismiss selected code if user clicks elsewhere
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-editor-container]')) {
        setSelectedCode(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ─── Common editor props ───────────────────────────────────────────────────

  const sqlEditorProps = {
    datasetName,
    week,
    onError: handleSQLError,
    onMirrorRequest: handleSQLMirror,
    height: '300px',
  }

  const pythonEditorProps = {
    datasetName,
    week,
    onError: handlePythonError,
    onMirrorRequest: handlePythonMirror,
    height: '300px',
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: dataset badge + "Ask Sage" button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-default flex-shrink-0">
        <DatasetBadge name={datasetName} />
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-accent-muted font-mono">
            Last active:{' '}
            <span
              className={
                lastActive === 'sql' ? 'text-accent-sql' : 'text-accent-python'
              }
            >
              {lastActive.toUpperCase()}
            </span>
          </span>
          <AskSageButton
            visible={!!selectedCode}
            onAsk={() => {
              if (selectedCode) {
                onCodeSelect?.(selectedCode.text, selectedCode.lang)
                setSelectedCode(null)
              }
            }}
          />
        </div>
      </div>

      {/* Mirror bridge panel (always rendered at top, below toolbar) */}
      <AnimatePresence>
        {mirrorPanel && (
          <MirrorBridgePanel
            mirror={mirrorPanel}
            onDismiss={() => setMirrorPanel(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Desktop layout (md+): side by side ── */}
      <div
        ref={containerRef}
        className="hidden md:flex flex-1 min-h-0 overflow-hidden"
        data-editor-container
      >
        {/* SQL panel */}
        <div
          className="flex flex-col min-w-0 overflow-hidden"
          style={{ width: `${leftWidthPct}%` }}
          onMouseUp={() => handleContainerMouseUp('sql')}
          onClick={handleSQLInteraction}
        >
          {/* Panel header */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary border-b border-accent-sql/20 flex-shrink-0">
            <span className="text-xs font-display font-semibold text-accent-sql tracking-wide uppercase">
              SQL
            </span>
            <span className="text-xs text-accent-muted font-mono">·</span>
            <span className="text-xs text-accent-muted font-mono">sqlite</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SQLEditor {...sqlEditorProps} />
          </div>
        </div>

        {/* Draggable divider */}
        <VerticalDivider onDrag={handleDividerDrag} />

        {/* Python panel */}
        <div
          className="flex flex-col min-w-0 overflow-hidden flex-1"
          onMouseUp={() => handleContainerMouseUp('python')}
          onClick={handlePythonInteraction}
        >
          {/* Panel header */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary border-b border-accent-python/20 flex-shrink-0">
            <span className="text-xs font-display font-semibold text-accent-python tracking-wide uppercase">
              Python
            </span>
            <span className="text-xs text-accent-muted font-mono">·</span>
            <span className="text-xs text-accent-muted font-mono">pandas + pyodide</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PythonEditor {...pythonEditorProps} />
          </div>
        </div>
      </div>

      {/* ── Mobile layout (below md): tabbed ── */}
      <div className="flex md:hidden flex-col flex-1 min-h-0" data-editor-container>
        <TabBar activeTab={activeTab} onTabChange={tab => { setActiveTab(tab); setLastActive(tab) }} />

        <div className="flex-1 overflow-y-auto mt-2">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'sql' ? (
              <motion.div
                key="sql"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                onMouseUp={() => handleContainerMouseUp('sql')}
                onClick={handleSQLInteraction}
              >
                <SQLEditor {...sqlEditorProps} />
              </motion.div>
            ) : (
              <motion.div
                key="python"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                onMouseUp={() => handleContainerMouseUp('python')}
                onClick={handlePythonInteraction}
              >
                <PythonEditor {...pythonEditorProps} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DatabaseIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <ellipse cx="8" cy="4" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 4v4c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 8v4c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
