import React, { useState, useRef, useEffect, useCallback } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { motion, AnimatePresence } from 'framer-motion'

// sql.js is loaded via CDN in index.html — access via window
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const initSqlJs: (config: { locateFile: (f: string) => string }) => Promise<any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = any

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueryResult {
  columns: string[]
  rows: unknown[][]
  rowCount: number
  executionTime: number
}

interface SQLEditorProps {
  initialCode?: string
  datasetName: string
  week: number
  onSuccess?: (result: QueryResult) => void
  onError?: (error: string, code: string) => void
  onMirrorRequest?: (code: string) => void
  height?: string
  readOnly?: boolean
  task?: string
}

// ─── Null Badge ───────────────────────────────────────────────────────────────

function NullBadge() {
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-xs font-mono bg-accent-error/10 text-accent-error/70 border border-accent-error/20">
      NULL
    </span>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="relative w-5 h-5 flex-shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-accent-sql/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-sql animate-spin" />
      </div>
      <span className="text-sm font-mono text-accent-muted animate-pulse">{label}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SQLEditor({
  initialCode = 'SELECT * FROM menu_items LIMIT 10;',
  datasetName,
  week,
  onSuccess,
  onError,
  onMirrorRequest,
  height = '300px',
  readOnly = false,
  task,
}: SQLEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [dbStatus, setDbStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [dbError, setDbError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showEasier, setShowEasier] = useState(false)
  const dbRef = useRef<Database | null>(null)
  const editorRef = useRef<unknown>(null)

  // ── Initialize sql.js ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function initDB() {
      try {
        // Wait for CDN script to expose initSqlJs (it loads asynchronously)
        let attempts = 0
        while (typeof initSqlJs === 'undefined' && attempts < 50) {
          await new Promise(r => setTimeout(r, 100))
          attempts++
        }
        if (typeof initSqlJs === 'undefined') {
          throw new Error('sql.js failed to load from CDN')
        }

        const SQL = await initSqlJs({
          locateFile: (file: string) =>
            `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`,
        })

        const response = await fetch(`/datasets/${datasetName}`)
        if (!response.ok) {
          throw new Error(`Failed to load dataset: ${response.statusText}`)
        }
        const buffer = await response.arrayBuffer()
        const db = new SQL.Database(new Uint8Array(buffer))

        if (!cancelled) {
          dbRef.current = db
          setDbStatus('ready')
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Unknown initialization error'
          setDbError(msg)
          setDbStatus('error')
        }
      }
    }

    initDB()
    return () => {
      cancelled = true
      dbRef.current?.close()
    }
  }, [datasetName])

  // ── Run Query ──────────────────────────────────────────────────────────────
  const runQuery = useCallback(async () => {
    if (!dbRef.current || dbStatus !== 'ready' || isRunning) return

    const currentCode = code.trim()
    if (!currentCode) return

    setIsRunning(true)
    setQueryError(null)
    setQueryResult(null)

    const t0 = performance.now()

    try {
      const results = dbRef.current.exec(currentCode)
      const elapsed = Math.round(performance.now() - t0)

      if (results.length === 0) {
        // DDL / non-SELECT — treat as zero-row success
        const result: QueryResult = {
          columns: [],
          rows: [],
          rowCount: 0,
          executionTime: elapsed,
        }
        setQueryResult(result)
        onSuccess?.(result)
      } else {
        const { columns, values } = results[0]
        const result: QueryResult = {
          columns: columns as string[],
          rows: values as unknown[][],
          rowCount: values.length,
          executionTime: elapsed,
        }
        setQueryResult(result)
        onSuccess?.(result)
      }
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : String(err)
      const cleanMsg = `SQL Error: ${rawMsg}`
      setQueryError(cleanMsg)
      onError?.(cleanMsg, currentCode)
    } finally {
      setIsRunning(false)
    }
  }, [code, dbStatus, isRunning, onSuccess, onError])

  // ── Keyboard shortcut: Ctrl+Enter / Cmd+Enter ──────────────────────────────
  const handleEditorMount = useCallback((editor: unknown) => {
    editorRef.current = editor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = editor as any
    e.addAction({
      id: 'run-query',
      label: 'Run SQL Query',
      keybindings: [
        // Monaco KeyMod.CtrlCmd | Monaco KeyCode.Enter = 2048 | 3
        (2048 | 3) as number,
      ],
      run: () => runQuery(),
    })
  }, [runQuery])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-0 panel-sql overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-bg-tertiary border-b border-border-default">
        {/* Left: Run */}
        <div className="flex items-center gap-2">
          <button
            className="btn-sql flex items-center gap-1.5 text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={runQuery}
            disabled={dbStatus !== 'ready' || isRunning || readOnly}
            title="Run query (Ctrl+Enter)"
          >
            {isRunning ? (
              <span className="inline-block w-3 h-3 border border-accent-sql border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>▶</span>
            )}
            Run
          </button>

          {/* Dataset badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-accent-muted font-mono border border-border-default rounded px-2 py-1 bg-bg-primary">
            <DatabaseIcon />
            {datasetName}
          </span>
        </div>

        {/* Right: secondary actions */}
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
              className="btn-python text-xs px-2.5 py-1.5"
              onClick={() => onMirrorRequest(code)}
              title="Translate this query to Python/pandas"
            >
              Show in Python ⇄
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
            <div className="px-4 py-2.5 bg-accent-sql/5 border-b border-accent-sql/20 text-xs text-accent-muted font-body">
              <span className="text-accent-sql font-semibold">Hint: </span>
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
            <div className="px-4 py-2.5 bg-accent-python/5 border-b border-accent-python/20 text-xs text-accent-muted font-body">
              <span className="text-accent-python font-semibold">Tip: </span>
              Try breaking complex queries into CTEs with <code className="font-mono bg-bg-primary px-1 py-0.5 rounded">WITH name AS (...)</code> for readability.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DB status states */}
      {dbStatus === 'loading' && (
        <div className="bg-bg-primary border-b border-border-default">
          <LoadingSpinner label="Initializing SQLite..." />
        </div>
      )}

      {dbStatus === 'error' && (
        <div className="px-4 py-3 bg-accent-error/10 border-b border-accent-error/30 text-sm text-accent-error font-mono">
          Failed to load database: {dbError}
        </div>
      )}

      {/* Monaco Editor */}
      <div style={{ height }} className="relative">
        <MonacoEditor
          height={height}
          language="sql"
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
            folding: false,
            renderLineHighlight: 'line',
            contextmenu: false,
          }}
        />
      </div>

      {/* Query error */}
      <AnimatePresence>
        {queryError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mx-3 mt-2 px-3 py-2.5 bg-accent-error/10 border border-accent-error/30 rounded-md"
          >
            <p className="text-xs font-mono text-accent-error leading-relaxed whitespace-pre-wrap">
              {queryError}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results table */}
      <AnimatePresence>
        {queryResult && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-3 mt-2 mb-3"
          >
            {queryResult.columns.length > 0 ? (
              <>
                <div
                  className="overflow-auto rounded-md border border-border-default bg-bg-primary"
                  style={{ maxHeight: '240px' }}
                >
                  <table className="w-full text-xs font-mono border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-bg-tertiary">
                        {queryResult.columns.map((col, i) => (
                          <th
                            key={i}
                            className="px-3 py-2 text-left font-semibold text-accent-sql border-b border-border-default whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, ri) => (
                        <tr
                          key={ri}
                          className={ri % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-secondary'}
                        >
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className="px-3 py-1.5 text-[#E6EDF3]/90 border-b border-border-default/40 whitespace-nowrap"
                            >
                              {cell === null || cell === undefined ? (
                                <NullBadge />
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer: row count + time + mirror button */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-mono text-accent-muted">
                    {queryResult.rowCount} {queryResult.rowCount === 1 ? 'row' : 'rows'}
                    {' · '}
                    <span className="text-accent-success">{queryResult.executionTime}ms</span>
                  </span>
                  {onMirrorRequest && (
                    <button
                      className="btn-python text-xs px-2.5 py-1"
                      onClick={() => onMirrorRequest(code)}
                    >
                      Show in Python ⇄
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-accent-success/5 border border-accent-success/20 rounded-md">
                <span className="text-accent-success text-sm">✓</span>
                <span className="text-xs font-mono text-accent-success">
                  Query executed successfully · {queryResult.executionTime}ms
                </span>
              </div>
            )}
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
