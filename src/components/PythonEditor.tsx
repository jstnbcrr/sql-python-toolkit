import React, { useState, useRef, useEffect, useCallback } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PythonEditorProps {
  initialCode?: string
  datasetName: string
  week: number
  onSuccess?: (output: string) => void
  onError?: (error: string, code: string) => void
  onMirrorRequest?: (code: string) => void
  height?: string
  readOnly?: boolean
  task?: string
}

// Pyodide is loaded globally to avoid reloading across component instances
declare global {
  interface Window {
    _pyodideInstance?: PyodideInstance
    _pyodideLoading?: Promise<PyodideInstance>
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideInstance>
  }
}

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>
  loadPackage: (pkgs: string[]) => Promise<void>
  FS: {
    writeFile: (path: string, data: Uint8Array) => void
  }
  globals: {
    set: (key: string, value: unknown) => void
    get: (key: string) => unknown
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMainTableSetupCode(datasetName: string): string {
  // Derive a plausible main table name from the dataset filename
  // e.g. "week1_menu.db" -> "menu"
  const base = datasetName.replace(/\.db$/i, '')
  const parts = base.split(/[_\-]/)
  // Last meaningful part as table name
  const tableName = parts[parts.length - 1] || 'data'
  return tableName
}

async function getPyodide(): Promise<PyodideInstance> {
  if (window._pyodideInstance) return window._pyodideInstance

  if (window._pyodideLoading) return window._pyodideLoading

  // Inject pyodide script if not already present
  if (!window.loadPyodide) {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-pyodide]')
      if (existing) {
        // Already injected, wait briefly
        const check = setInterval(() => {
          if (window.loadPyodide) {
            clearInterval(check)
            resolve()
          }
        }, 100)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js'
      script.dataset.pyodide = 'true'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Pyodide script'))
      document.head.appendChild(script)
    })
  }

  window._pyodideLoading = (async () => {
    const py = await window.loadPyodide!({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
    })
    await py.loadPackage(['pandas', 'numpy', 'micropip'])
    window._pyodideInstance = py
    return py
  })()

  return window._pyodideLoading
}

// ─── Loading Bar ──────────────────────────────────────────────────────────────

function LoadingBar({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-bg-primary border-b border-border-default">
      <div className="flex items-center gap-3">
        <div className="relative w-4 h-4 flex-shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-accent-python/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-python animate-spin" />
        </div>
        <span className="text-xs font-mono text-accent-muted">{label}</span>
      </div>
      <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent-python to-amber-400 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: ['0%', '60%', '80%', '95%'] }}
          transition={{ duration: 5, ease: 'easeInOut', times: [0, 0.4, 0.7, 1] }}
        />
      </div>
    </div>
  )
}

// ─── Output Panel ─────────────────────────────────────────────────────────────

interface OutputPanelProps {
  stdout: string | null
  error: string | null
  executionTime: number | null
  onMirrorRequest?: () => void
  showMirrorButton: boolean
}

function OutputPanel({ stdout, error, executionTime, onMirrorRequest, showMirrorButton }: OutputPanelProps) {
  const hasOutput = (stdout && stdout.trim().length > 0) || error

  return (
    <div className="mx-3 mb-3 mt-2">
      <div
        className="relative rounded-md border border-border-default bg-bg-primary overflow-hidden scanline"
        style={{ maxHeight: '300px' }}
      >
        {/* Terminal header bar */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary border-b border-border-default">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-error/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-python/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-success/60" />
          <span className="ml-2 text-xs font-mono text-accent-muted">output</span>
          {executionTime !== null && (
            <span className="ml-auto text-xs font-mono text-accent-success">
              {executionTime}ms
            </span>
          )}
        </div>

        {/* Output content */}
        <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
          <div className="p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {!hasOutput && (
              <span className="text-accent-muted italic">No output</span>
            )}
            {stdout && stdout.trim().length > 0 && (
              <span style={{ color: '#E6EDF3' }}>{stdout}</span>
            )}
            {error && (
              <span className="text-accent-error">{error}</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {(executionTime !== null || showMirrorButton) && (
        <div className="flex items-center justify-between mt-2">
          {executionTime !== null && !error && (
            <span className="text-xs font-mono text-accent-muted">
              Ran in <span className="text-accent-success">{executionTime}ms</span>
            </span>
          )}
          {showMirrorButton && onMirrorRequest && (
            <button
              className="btn-sql text-xs px-2.5 py-1 ml-auto"
              onClick={onMirrorRequest}
            >
              Show in SQL ⇄
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PythonEditor({
  initialCode = 'print(df.head())',
  datasetName,
  week,
  onSuccess,
  onError,
  onMirrorRequest,
  height = '300px',
  readOnly = false,
  task,
}: PythonEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [pyStatus, setPyStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [pyError, setPyError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [stdout, setStdout] = useState<string | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [showMirrorButton, setShowMirrorButton] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showEasier, setShowEasier] = useState(false)
  const pyRef = useRef<PyodideInstance | null>(null)

  // ── Initialize Pyodide & dataset ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const py = await getPyodide()
        if (cancelled) return
        pyRef.current = py

        // Load the dataset file into Pyodide FS
        const response = await fetch(`/datasets/${datasetName}`)
        if (!response.ok) throw new Error(`Dataset not found: ${datasetName}`)
        const buf = await response.arrayBuffer()
        py.FS.writeFile('/dataset.db', new Uint8Array(buf))

        // Set up pandas DataFrame from the first table
        const tableName = getMainTableSetupCode(datasetName)
        await py.runPythonAsync(`
import sqlite3
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

_conn = sqlite3.connect('/dataset.db')
_cursor = _conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
_tables = [row[0] for row in _cursor.fetchall()]
_main_table = '${tableName}' if '${tableName}' in _tables else (_tables[0] if _tables else None)

if _main_table:
    df = pd.read_sql(f"SELECT * FROM {_main_table} LIMIT 1000", _conn)
else:
    df = pd.DataFrame()

_conn.close()
`)

        if (!cancelled) {
          setPyStatus('ready')
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to initialize Python runtime'
          setPyError(msg)
          setPyStatus('error')
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [datasetName])

  // ── Run code ───────────────────────────────────────────────────────────────
  const runCode = useCallback(async () => {
    if (!pyRef.current || pyStatus !== 'ready' || isRunning) return

    const currentCode = code.trim()
    if (!currentCode) return

    setIsRunning(true)
    setStdout(null)
    setRunError(null)
    setExecutionTime(null)
    setShowMirrorButton(false)

    const t0 = performance.now()

    try {
      // Capture stdout via io.StringIO redirect
      const wrappedCode = `
import sys
import io as _io

_stdout_capture = _io.StringIO()
_stderr_capture = _io.StringIO()
_old_stdout = sys.stdout
_old_stderr = sys.stderr
sys.stdout = _stdout_capture
sys.stderr = _stderr_capture

try:
    import traceback as _tb
    try:
${currentCode.split('\n').map(l => '        ' + l).join('\n')}
    except Exception as _e:
        sys.stdout = _old_stdout
        sys.stderr = _old_stderr
        _captured = _stdout_capture.getvalue()
        raise _e
    finally:
        sys.stdout = _old_stdout
        sys.stderr = _old_stderr
except Exception as _e2:
    raise _e2
finally:
    sys.stdout = _old_stdout
    sys.stderr = _old_stderr

_captured_out = _stdout_capture.getvalue()
_captured_err = _stderr_capture.getvalue()
_captured_out + ("\\n" + _captured_err if _captured_err else "")
`

      const result = await pyRef.current.runPythonAsync(wrappedCode)
      const elapsed = Math.round(performance.now() - t0)

      const output = result != null ? String(result) : ''
      setStdout(output || '(no output)')
      setExecutionTime(elapsed)

      // Show mirror button if output looks like DataFrame or table
      if (output.includes('  ') || output.includes('\t')) {
        setShowMirrorButton(true)
      }

      onSuccess?.(output)
    } catch (err) {
      const elapsed = Math.round(performance.now() - t0)
      // Extract clean traceback
      const raw = err instanceof Error ? err.message : String(err)
      // Pyodide wraps Python errors; try to get clean traceback
      const cleaned = raw
        .replace(/^.*PythonError:\s*/s, '')
        .replace(/File "<exec>", /g, '')
        .trim()
      const errorMsg = cleaned || raw

      setRunError(errorMsg)
      setExecutionTime(elapsed)
      onError?.(errorMsg, currentCode)
    } finally {
      setIsRunning(false)
    }
  }, [code, pyStatus, isRunning, onSuccess, onError])

  // ── Keyboard shortcut ──────────────────────────────────────────────────────
  const handleEditorMount = useCallback((editor: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = editor as any
    e.addAction({
      id: 'run-python',
      label: 'Run Python Code',
      keybindings: [(2048 | 3) as number],
      run: () => runCode(),
    })
  }, [runCode])

  const hasRanOnce = stdout !== null || runError !== null

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-0 panel-python overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-bg-tertiary border-b border-border-default">
        <div className="flex items-center gap-2">
          <button
            className="btn-python flex items-center gap-1.5 text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={runCode}
            disabled={pyStatus !== 'ready' || isRunning || readOnly}
            title="Run code (Ctrl+Enter)"
          >
            {isRunning ? (
              <span className="inline-block w-3 h-3 border border-accent-python border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>▶</span>
            )}
            Run
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-accent-muted font-mono border border-border-default rounded px-2 py-1 bg-bg-primary">
            <DatabaseIcon />
            {datasetName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {task && (
            <button
              className="btn-ghost text-xs px-2.5 py-1.5"
              onClick={() => setShowHint(v => !v)}
            >
              {showHint ? 'Hide Hint' : 'Hint'}
            </button>
          )}
          <button
            className="btn-ghost text-xs px-2.5 py-1.5"
            onClick={() => setShowEasier(v => !v)}
          >
            Easier Way?
          </button>
          {onMirrorRequest && (
            <button
              className="btn-sql text-xs px-2.5 py-1.5"
              onClick={() => onMirrorRequest(code)}
              title="Translate this code to SQL"
            >
              Show in SQL ⇄
            </button>
          )}
        </div>
      </div>

      {/* Hint banner */}
      <AnimatePresence>
        {showHint && task && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-2.5 bg-accent-python/5 border-b border-accent-python/20 text-xs text-accent-muted font-body">
              <span className="text-accent-python font-semibold">Hint: </span>
              {task}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Easier way banner */}
      <AnimatePresence>
        {showEasier && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-2.5 bg-accent-sql/5 border-b border-accent-sql/20 text-xs text-accent-muted font-body">
              <span className="text-accent-sql font-semibold">Tip: </span>
              Use <code className="font-mono bg-bg-primary px-1 py-0.5 rounded">df.query("column == value")</code> for concise filtering, or method chaining with <code className="font-mono bg-bg-primary px-1 py-0.5 rounded">.pipe()</code>.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Python loading state */}
      {pyStatus === 'loading' && (
        <LoadingBar label="Loading Python runtime... (~5s)" />
      )}

      {pyStatus === 'error' && (
        <div className="px-4 py-3 bg-accent-error/10 border-b border-accent-error/30 text-sm text-accent-error font-mono">
          Failed to initialize Python: {pyError}
        </div>
      )}

      {/* Monaco Editor */}
      <div style={{ height }}>
        <MonacoEditor
          height={height}
          language="python"
          theme="vs-dark"
          value={code}
          onChange={val => setCode(val ?? '')}
          onMount={handleEditorMount}
          options={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 14,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            readOnly,
            padding: { top: 12, bottom: 12 },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
            lineDecorationsWidth: 8,
            glyphMargin: false,
            folding: true,
            renderLineHighlight: 'line',
            contextmenu: false,
          }}
        />
      </div>

      {/* Output panel */}
      <AnimatePresence>
        {hasRanOnce && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <OutputPanel
              stdout={stdout}
              error={runError}
              executionTime={executionTime}
              onMirrorRequest={onMirrorRequest ? () => onMirrorRequest(code) : undefined}
              showMirrorButton={showMirrorButton && !!onMirrorRequest}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Database SVG icon ────────────────────────────────────────────────────────

function DatabaseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-60"
    >
      <ellipse cx="8" cy="4" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 4v4c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 8v4c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
