import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProgressStore } from '@/store/progress'
import { getWeekByNumber, PHASE_NAMES } from '@/data/curriculum'
import { useIsMobile } from '@/hooks/useIsMobile'
import ErrorBoundary from '@/components/ErrorBoundary'

// Lazy-load heavy components
const Dashboard = lazy(() => import('@/components/Dashboard'))
const LessonReader = lazy(() => import('@/components/LessonReader'))
const DualEditor = lazy(() => import('@/components/DualEditor'))
const SageTutor = lazy(() => import('@/components/SageTutor'))
const MiniProject = lazy(() => import('@/components/MiniProject'))
const PhaseGate = lazy(() => import('@/components/PhaseGate'))
const SeniorInsightCollection = lazy(() =>
  import('@/components/SeniorInsight').then(m => ({ default: m.SeniorInsightCollection }))
)

type AppView = 'dashboard' | 'lesson' | 'editor' | 'project' | 'gate' | 'insights'

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-accent-sql/30 border-t-accent-sql rounded-full animate-spin" />
      <span className="text-accent-muted text-sm font-mono">Loading...</span>
    </div>
  </div>
)

export default function App() {
  const isMobile = useIsMobile()
  const {
    currentWeek,
    currentPhase,
    activeTrack,
    isWeekUnlocked,
    setCurrentWeek,
    startSession,
    endSession,
  } = useProgressStore()

  const [view, setView] = useState<AppView>('dashboard')
  const [sageOpen, setSageOpen] = useState(!isMobile)
  const [selectedCode, setSelectedCode] = useState<string | undefined>()
  const [selectedCodeLang, setSelectedCodeLang] = useState<'sql' | 'python'>('sql')
  const [mirrorContent, setMirrorContent] = useState<string | undefined>()

  // Bottom sheet state for mobile Sage
  const [sageSheetOpen, setSageSheetOpen] = useState(false)

  const weekDef = getWeekByNumber(currentWeek)
  const phaseName = PHASE_NAMES[currentPhase]

  // Track study session
  useEffect(() => {
    startSession()
    return () => endSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectWeek = useCallback((week: number) => {
    if (!isWeekUnlocked(week)) return
    setCurrentWeek(week)
    setView('lesson')
  }, [isWeekUnlocked, setCurrentWeek])

  const handleCodeSelect = useCallback((code: string, lang: 'sql' | 'python') => {
    setSelectedCode(code)
    setSelectedCodeLang(lang)
    if (isMobile) {
      setSageSheetOpen(true)
    } else {
      setSageOpen(true)
    }
  }, [isMobile])

  const handleSageError = useCallback((_error: string, _code: string, _lang: 'sql' | 'python') => {
    if (isMobile) {
      setSageSheetOpen(true)
    } else {
      setSageOpen(true)
    }
  }, [isMobile])

  const navItems: { id: AppView; label: string; icon: string; disabled?: boolean }[] = [
    { id: 'dashboard', label: 'Home', icon: '⌂' },
    { id: 'lesson', label: 'Lesson', icon: '📖' },
    { id: 'editor', label: 'Editor', icon: '⌨' },
    { id: 'project', label: 'Project', icon: '🛠', disabled: !weekDef?.miniProject },
    { id: 'gate', label: 'Gate', icon: '🔒', disabled: !weekDef?.phaseGate },
    { id: 'insights', label: 'Insights', icon: '★' },
  ]

  return (
    <div className="flex flex-col h-screen bg-bg-primary bg-grid overflow-hidden">

      {/* ── Top nav bar ─────────────────────────────────────────── */}
      <header className="flex-none flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-bg-secondary/80 backdrop-blur z-30">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-lg text-accent-sql text-glow-sql">SQL</span>
            <span className="text-border-strong text-lg">+</span>
            <span className="font-display font-bold text-lg text-accent-python">Python</span>
          </div>
          {!isMobile && (
            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-border-subtle">
              <span className="text-accent-muted text-xs font-mono">
                Week {currentWeek}
              </span>
              <span className="text-border-strong text-xs">·</span>
              <span className="text-accent-muted text-xs font-mono">
                Phase {currentPhase}: {phaseName}
              </span>
              {weekDef && (
                <>
                  <span className="text-border-strong text-xs">·</span>
                  <span className="text-white/70 text-xs truncate max-w-[180px]">{weekDef.title}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isMobile && (
            <span className="text-accent-muted text-xs font-mono">Wk {currentWeek}</span>
          )}
          <button
            onClick={() => isMobile ? setSageSheetOpen(true) : setSageOpen(o => !o)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-semibold
              transition-all border
              ${sageOpen || sageSheetOpen
                ? 'bg-accent-sql/20 text-accent-sql border-accent-sql/40'
                : 'bg-bg-tertiary text-accent-muted border-border-default hover:border-accent-sql/30 hover:text-white'}
            `}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Sage
          </button>
        </div>
      </header>

      {/* ── Main layout ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar nav — desktop only */}
        {!isMobile && (
          <nav className="flex-none w-14 flex flex-col items-center py-4 gap-1 border-r border-border-subtle bg-bg-secondary/50">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => !item.disabled && setView(item.id)}
                disabled={item.disabled}
                title={item.label}
                className={`
                  w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs
                  transition-all duration-150 group
                  ${view === item.id
                    ? 'bg-accent-sql/15 text-accent-sql border border-accent-sql/30'
                    : item.disabled
                      ? 'text-border-strong cursor-not-allowed'
                      : 'text-accent-muted hover:bg-bg-tertiary hover:text-white'
                  }
                `}
              >
                <span className="text-sm leading-none">{item.icon}</span>
                <span className="text-[9px] font-mono leading-none">{item.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden relative">
          <main className={`
            flex-1 overflow-hidden transition-all duration-300
            ${!isMobile && sageOpen ? 'mr-[360px]' : ''}
          `}>
            <Suspense fallback={<LoadingSpinner />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className={view === 'editor' ? 'h-full' : 'h-full overflow-auto'}
                >
                  {view === 'dashboard' && (
                    <Dashboard
                      onSelectWeek={handleSelectWeek}
                      onViewInsights={() => setView('insights')}
                    />
                  )}
                  {view === 'lesson' && (
                    <LessonReader
                      week={currentWeek}
                      track={activeTrack === 'both' ? 'both' : activeTrack}
                      onLoadCodeToEditor={(_code, _lang) => setView('editor')}
                      onTermClick={term => {
                        setSelectedCode(term)
                        if (isMobile) setSageSheetOpen(true)
                        else setSageOpen(true)
                      }}
                    />
                  )}
                  {view === 'editor' && (
                    <div className="h-full flex flex-col">
                      <ErrorBoundary fallback="Editor failed to load — check the browser console for details">
                        <DualEditor
                          week={currentWeek}
                          datasetName={weekDef?.dataset || 'week1_menu.db'}
                          onSageError={handleSageError}
                          onMirrorReady={(code, from) => setMirrorContent(`From ${from}: ${code}`)}
                          onCodeSelect={handleCodeSelect}
                        />
                      </ErrorBoundary>
                    </div>
                  )}
                  {view === 'project' && weekDef?.miniProject && (
                    <div className="h-full overflow-auto p-4">
                      <MiniProject
                        week={currentWeek}
                        onComplete={score => {
                          if (score >= 80) setView('dashboard')
                        }}
                        onSageRequest={msg => {
                          setSelectedCode(msg)
                          if (isMobile) setSageSheetOpen(true)
                          else setSageOpen(true)
                        }}
                      />
                    </div>
                  )}
                  {view === 'gate' && weekDef?.phaseGate && (
                    <div className="h-full overflow-auto p-4">
                      <PhaseGate
                        phase={currentPhase}
                        onPass={() => setView('dashboard')}
                        onFail={() => setView('dashboard')}
                      />
                    </div>
                  )}
                  {view === 'insights' && (
                    <SeniorInsightCollection onClose={() => setView('dashboard')} />
                  )}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </main>

          {/* Desktop Sage panel */}
          {!isMobile && (
            <AnimatePresence>
              {sageOpen && (
                <motion.aside
                  initial={{ x: 360 }}
                  animate={{ x: 0 }}
                  exit={{ x: 360 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 32 }}
                  className="absolute right-0 top-0 bottom-0 w-[360px] border-l border-border-default bg-bg-secondary/95 backdrop-blur z-20"
                >
                  <Suspense fallback={<LoadingSpinner />}>
                    <SageTutor
                      currentWeek={currentWeek}
                      currentTopic={weekDef?.sqlTopic || ''}
                      currentPhase={currentPhase}
                      activeTrack={activeTrack}
                      selectedCode={selectedCodeLang === 'sql' || selectedCodeLang === 'python' ? selectedCode : undefined}
                      isOpen={sageOpen}
                      onToggle={() => setSageOpen(false)}
                    />
                  </Suspense>
                </motion.aside>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ── Mobile bottom navigation ──────────────────────────── */}
      {isMobile && (
        <nav className="flex-none flex items-center justify-around px-2 py-2 border-t border-border-subtle bg-bg-secondary/95 backdrop-blur z-30 safe-bottom">
          {navItems.filter(i => !i.disabled).slice(0, 5).map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all
                ${view === item.id
                  ? 'text-accent-sql'
                  : 'text-accent-muted'}
              `}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] font-mono">{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* ── Mobile Sage bottom sheet ──────────────────────────── */}
      {isMobile && (
        <AnimatePresence>
          {sageSheetOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-bg-primary/70 backdrop-blur-sm z-40"
                onClick={() => setSageSheetOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 35 }}
                className="fixed bottom-0 left-0 right-0 h-[75vh] bg-bg-secondary border-t border-border-default rounded-t-2xl z-50 overflow-hidden"
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.3 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 100) setSageSheetOpen(false)
                }}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-border-strong" />
                </div>
                <Suspense fallback={<LoadingSpinner />}>
                  <SageTutor
                    currentWeek={currentWeek}
                    currentTopic={weekDef?.sqlTopic || ''}
                    currentPhase={currentPhase}
                    activeTrack={activeTrack}
                    selectedCode={selectedCode}
                    isOpen={true}
                    onToggle={() => setSageSheetOpen(false)}
                  />
                </Suspense>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
