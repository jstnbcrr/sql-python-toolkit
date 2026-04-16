# SQL + Python — From Zero to Senior-Level Thinking

An interactive 16-week learning app for SQL and Python, built for Justin Becerra (IS&A, Utah Tech).
Features a live SQL editor, live Python editor, Sage AI tutor, XP/streak system, mini-projects, and phase gate assessments.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Animations | Framer Motion |
| Code editors | Monaco Editor (`@monaco-editor/react`) |
| SQL runtime | sql.js (SQLite WebAssembly via CDN) |
| Python runtime | Pyodide (Python WebAssembly via CDN) |
| State | Zustand + localStorage |
| AI tutor | Claude API (claude-sonnet-4-5) via Express proxy |
| Backend | Node.js + Express (`server/index.cjs`) |
| Fonts | Syne · Source Serif 4 · JetBrains Mono |

---

## Project Structure

```
.
├── index.html                  ← Loads sql.js from CDN, sets Pyodide CDN URL
├── vite.config.ts
├── tailwind.config.js
├── server/
│   └── index.cjs               ← Express API proxy (Claude / Sage)
├── public/
│   └── datasets/               ← 13 SQLite .db files (one per week)
└── src/
    ├── App.tsx                 ← Layout shell, view router, Sage panel
    ├── main.tsx
    ├── components/
    │   ├── Dashboard.tsx       ← Progress overview, week grid, XP bar
    │   ├── LessonReader.tsx    ← Week lesson content renderer
    │   ├── DualEditor.tsx      ← SQL + Python editors side-by-side
    │   ├── SQLEditor.tsx       ← Monaco + sql.js + results table
    │   ├── PythonEditor.tsx    ← Monaco + Pyodide + output terminal
    │   ├── SageTutor.tsx       ← Streaming AI chat panel
    │   ├── MiniProject.tsx     ← Weekly project with graded test cases
    │   ├── PhaseGate.tsx       ← End-of-phase assessment
    │   ├── SeniorInsight.tsx   ← Senior wisdom flash cards
    │   └── ErrorBoundary.tsx   ← Catches and displays component errors
    ├── store/
    │   └── progress.ts         ← Zustand persist (XP, streak, progress)
    ├── data/
    │   ├── curriculum.ts       ← 16 WeekDefinition objects
    │   └── senior_insights.json
    └── hooks/
        └── useIsMobile.ts
```

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Set your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# 3. Start both frontend and backend
npm start
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

> The frontend proxies `/api/*` to the backend via Vite's proxy config.

---

## Datasets

Each week loads a different SQLite database automatically — set by `WeekDefinition.dataset` in `src/data/curriculum.ts`.

| Week | File | Contents |
|---|---|---|
| 1 | `week1_menu.db` | Panda Express menu items |
| 2 | `week2_orders.db` | Orders with NULLs |
| 3 | `week3_sales.db` | Hourly sales data |
| 4 | `week4_customers.db` | Customers + order history |
| 5 | `week5_messy.db` | Messy inventory (for cleaning) |
| 6 | `week6_employees.db` | Employee reviews + departments |
| 7 | `week7_timeseries.db` | 2-year time series |
| 8 | `week8_regional.db` | Regional product rankings |
| 9 | `week9_company_ops.db` | Multi-location operations |
| 10 | `week10_reporting.db` | Reporting pipeline data |
| 11 | `week11_large.db` | Large table for perf optimization |
| 12 | `week12_messy_code.db` | Buggy code review data |
| 13 | `week13_retail.db` | Retail dimensional model |
| 14 | `week14_transit.db` | SunTran bus operations |
| 15 | `week15_anomaly.db` | Transaction data with hidden anomalies |
| 16 | `week16_portfolio.db` | Portfolio defense data |

To regenerate datasets: `python scripts/generate_datasets.py`

---

## Curriculum Structure

16 weeks across 4 phases. SQL and Python concepts are always taught in parallel.

| Phase | Weeks | Theme |
|---|---|---|
| 1 — Foundations | 1–4 | SELECT → WHERE → GROUP BY → JOIN |
| 2 — Intermediate Craft | 5–8 | NULL handling, CTEs, window functions, time series |
| 3 — Integration | 9–12 | Full pipelines, automation, performance, code review |
| 4 — Senior Thinking | 13–16 | Capstone projects, anomaly detection, portfolio defense |

Phase gates at end of Week 8 and Week 12 — must pass to unlock next phase.

---

## Sage AI Tutor

Sage is a streaming AI tutor powered by Claude. It knows your current week, phase, and any code you've highlighted or run.

**Backend routes (`server/index.cjs`):**

| Route | Purpose |
|---|---|
| `POST /api/sage/chat` | Main SSE streaming chat |
| `POST /api/sage/explain-error` | Explain a SQL/Python error |
| `POST /api/sage/hint` | Hint without giving the answer |
| `POST /api/sage/grade` | Grade a project submission |
| `POST /api/sage/senior-take` | Senior engineer perspective |
| `POST /api/sage/easier-way` | Suggest a simpler approach |
| `POST /api/sage/mirror` | Translate SQL ↔ Python |
| `POST /api/assessment/grade` | Grade phase gate assessment |

---

## UI Design Reference

See [`UI_DESIGN_REFERENCE.md`](./UI_DESIGN_REFERENCE.md) for the complete layout spec, color system, component map, and instructions for adapting this shell to another app.

---

## Deployment

- **Frontend:** Vercel — auto-deploys from `main` branch
- **Backend:** Render — Node web service, free tier
- `vercel.json` rewrites `/api/*` to the Render backend URL
- `render.yaml` defines the Render service config

Set `ANTHROPIC_API_KEY` as an environment variable in Render's dashboard (not in the repo).

---

## Design Decisions

**Why sql.js via CDN instead of npm?**
Vite's ESM bundler can't handle sql.js's WASM import structure. Loading it as a `<script>` tag in `index.html` bypasses this entirely.

**Why Pyodide loaded lazily?**
The full Python runtime is ~10MB. It's loaded once on first editor open and cached as `window._pyodideInstance` so it doesn't reload on component remounts.

**Why a separate Express backend?**
The Anthropic API key must never be in the client bundle. The backend is a thin proxy — it only exists to keep the key server-side.

**Why Zustand instead of Redux?**
Simpler API, built-in persistence via `zustand/middleware`, no boilerplate. The progress store is ~100 lines and handles everything.
