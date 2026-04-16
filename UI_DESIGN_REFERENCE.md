# UI Design Reference — SQL + Python Learning App
> Use this document to replicate the shell, layout, and navigation structure in another app.
> Swap out the content (curriculum, datasets, tools) but keep the layout system identical.

---

## Design Philosophy

- **Dark academic aesthetic** — feels like a professional IDE, not a classroom toy
- **Everything on one screen** — no page navigations, just view swaps with `AnimatePresence`
- **Sage is always one tap away** — AI tutor slides in as a side panel (desktop) or bottom sheet (mobile)
- **Mobile-first** — bottom nav, bottom sheet for AI, tabbed editors on small screens

---

## Color System (Tailwind custom tokens)

```
Background:
  bg-primary     #0D1117   (main canvas)
  bg-secondary   #161B22   (panels, sidebar)
  bg-tertiary    #21262D   (toolbars, headers)

Borders:
  border-subtle  #21262D
  border-default #30363D
  border-strong  #484F58

Accent — SQL:
  accent-sql     #00D4FF   (cyan — used for SQL editor, SQL badges)

Accent — Python:
  accent-python  #FFB347   (amber — used for Python editor, Python badges)

Accent — Status:
  accent-success #3FB950
  accent-error   #F85149
  accent-muted   #8B949E   (secondary text)

Typography:
  font-display   Syne (headings, nav labels, logo)
  font-body      Source Serif 4 (lesson text, explanations)
  font-mono      JetBrains Mono (code, badges, numbers)
```

---

## Layout Shell (App.tsx)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER — logo | week/phase/title info | [AI Tutor button]  │  h-auto, flex-none
├───┬─────────────────────────────────────────────┬───────────┤
│   │                                             │           │
│ S │              MAIN CONTENT                  │  AI TUTOR │
│ I │         (view-switched by nav)             │  PANEL    │
│ D │                                             │  360px    │
│ E │                                             │  fixed    │
│ B │                                             │  right    │
│ A │                                             │  (slide)  │
│ R │                                             │           │
│   │                                             │           │
│14w│                                             │           │
└───┴─────────────────────────────────────────────┴───────────┘

On mobile: sidebar collapses → BOTTOM NAV appears
           AI tutor panel → BOTTOM SHEET (75vh, draggable)
```

### Header
- Left: Logo (two-tone text — accent-sql + accent-python) + breadcrumb (week · phase · title)
- Right: Single AI tutor toggle button (pill shape, glows when open)
- `bg-bg-secondary/80 backdrop-blur border-b border-border-subtle z-30`

### Sidebar (desktop only, `w-14`)
- Icon + label nav buttons, stacked vertically
- Active state: `bg-accent-sql/15 text-accent-sql border border-accent-sql/30`
- Disabled state: `text-border-strong cursor-not-allowed`

### Main content area
- `flex-1 overflow-hidden`
- When Sage panel is open: `mr-[360px]` (pushes content left)
- Views swap with `AnimatePresence mode="wait"` + `motion.div` fade+slide

### Sage panel (desktop)
- `absolute right-0 top-0 bottom-0 w-[360px]`
- Slides in from right: `initial={{ x: 360 }} animate={{ x: 0 }}`
- Spring transition: `stiffness: 280, damping: 32`

### Bottom nav (mobile)
- `flex items-center justify-around` across full width
- `border-t border-border-subtle bg-bg-secondary/95 backdrop-blur safe-bottom`

### Bottom sheet (mobile Sage)
- `fixed bottom-0 left-0 right-0 h-[75vh]`
- Drag handle at top (10px wide, 4px tall, `bg-border-strong`)
- Close on drag down > 100px offset
- Semi-transparent backdrop behind it (`bg-bg-primary/70 backdrop-blur-sm`)

---

## Navigation Views

Each nav item maps to a view string. Views are rendered conditionally — only one mounts at a time.

| Nav ID       | Icon | Label    | When disabled              |
|-------------|------|----------|----------------------------|
| `dashboard` | ⌂    | Home     | Never                      |
| `lesson`    | 📖   | Lesson   | Never                      |
| `editor`    | ⌨   | Editor   | Never                      |
| `project`   | 🛠   | Project  | No mini-project for week   |
| `gate`      | 🔒   | Gate     | No phase gate for week     |
| `insights`  | ★    | Insights | Never                      |

---

## View: Dashboard

**Purpose:** Progress overview, week selector, XP/streak display

**Key elements:**
- XP bar with level label (e.g. "Level 3 — Data Wrangler")
- Streak counter (days in a row)
- Phase cards (4 phases, each with week tiles)
- Week tiles: locked/unlocked/completed states
- Clicking an unlocked week → navigates to Lesson view for that week

**Data source:** Zustand store (`useProgressStore`)
- `currentWeek`, `currentPhase`, `xp`, `streak`, `completedWeeks`, `isWeekUnlocked(week)`

---

## View: Lesson

**Purpose:** Read the week's lesson content — SQL concepts + Python concepts side by side

**Key elements:**
- Week title + subtitle header
- Analogy card (highlighted callout — connects SQL/Python to real world)
- Real-world context block
- SQL section: concept explanation, example code blocks (syntax highlighted)
- Python section: same concept, Python equivalent
- Learning objectives checklist
- Clickable terms → opens Sage with that term pre-loaded

**Props:** `week: number`, `track: 'sql' | 'python' | 'both'`

---

## View: Editor

**Purpose:** Live coding environment — SQL and Python editors side by side

**Desktop layout:**
```
┌──────────────────────┬──────────────────────┐
│   SQL EDITOR         │   PYTHON EDITOR       │
│   Monaco + sql.js    │   Monaco + Pyodide    │
│   (left panel)       │   (right panel)       │
│                      │                        │
│   [▶ Run] [Hint]     │   [▶ Run] [Hint]      │
│   ─────────────────  │   ──────────────────   │
│   Results table      │   Output terminal      │
└──────────────────────┴──────────────────────┘
                ↕ draggable divider
```

**Mobile layout:** Tabbed — [SQL] [Python] tabs at top, one editor visible at a time

**Each editor panel has:**
- Toolbar: Run button, dataset badge, Hint toggle, "Easier Way?" toggle, Mirror button
- Monaco editor (dark theme, JetBrains Mono, no minimap)
- Hint banner (AnimatePresence slide-down, shows `task` prop text)
- Easier Way banner (AnimatePresence slide-down, generic tip)
- Results area: table (SQL) or terminal output (Python)
- Footer: row count + execution time + mirror button

**Mirror button:** Translates current SQL → Python equivalent (calls Sage API) or vice versa

**Keyboard shortcut:** `Cmd/Ctrl + Enter` runs the query/code

**Runtime loading:**
- SQL: sql.js loaded via CDN `<script>` in index.html, WASM from same CDN
- Python: Pyodide loaded lazily (singleton on `window._pyodideInstance`)
- Both show a loading spinner/bar while runtime initializes

---

## View: Project (Mini-Project)

**Purpose:** Week-specific project challenge with graded test cases

**Key elements:**
- Project briefing card (scenario description)
- Requirements list (checkboxes, checked as completed)
- Embedded SQL and/or Python editors
- Test case runner: runs each test case, shows pass/fail
- Score (0–100) calculated from passing test cases
- Score ≥ 80 → marks week complete, unlocks next week
- "Ask Sage" button for hints

**Data source:** `WeekDefinition.miniProject` from curriculum.ts

---

## View: Gate (Phase Gate)

**Purpose:** End-of-phase assessment before unlocking next phase

**Key elements:**
- Phase summary (what was covered in this phase)
- Multi-part assessment (SQL + Python questions)
- Graded by backend (`/api/assessment/grade`)
- Pass threshold: 75%
- Pass → unlocks next phase + awards XP bonus
- Fail → can retry, Sage available for help

**Trigger:** Only visible when `WeekDefinition.phaseGate === true`
- Phase 2 gate: end of Week 8
- Phase 3 gate: end of Week 12

---

## View: Insights

**Purpose:** "Senior Insight" flash cards — professional wisdom, not just syntax

**Key elements:**
- Grid of insight cards (2-col desktop, 1-col mobile)
- Each card: icon + title + short insight paragraph + "senior take" badge
- Cards are unlocked progressively as weeks complete
- Topics: CTEs, deadly JOINs, vectorization, SQL vs Python decision tree, indexing, etc.
- Close button returns to Dashboard

**Data source:** `src/data/senior_insights.json`

---

## AI Tutor (Sage)

**Purpose:** Streaming AI tutor that knows the curriculum, current week, and selected code

**Personality:** Knowledgeable but direct. Asks questions back. Doesn't just give answers.

**Capabilities (backend routes):**
- `/api/sage/chat` — main SSE streaming chat
- `/api/sage/explain-error` — explain a SQL/Python error in context
- `/api/sage/hint` — give a hint without giving the answer
- `/api/sage/grade` — grade a project submission
- `/api/sage/senior-take` — give the senior engineer perspective
- `/api/sage/easier-way` — suggest a simpler approach
- `/api/sage/mirror` — translate SQL ↔ Python

**Context passed with every message:**
- `currentWeek`, `currentPhase`, `activeTrack`
- `currentTopic` (this week's SQL topic string)
- `selectedCode` (code the user highlighted or ran)

**UI:**
- Chat input at bottom, messages scroll up
- Streaming response renders token by token
- Code blocks in responses are syntax highlighted
- "Clear chat" button at top

---

## XP + Progress System (Zustand store)

```
State:
  currentWeek: number          (1–16)
  currentPhase: 1|2|3|4
  activeTrack: 'sql'|'python'|'both'
  xp: number
  streak: number               (days)
  lastActiveDate: string
  completedWeeks: number[]
  weekProgress: Record<number, WeekProgress>
  phaseGates: Record<number, boolean>   (phase unlocked?)

Key logic:
  isWeekUnlocked(week) → checks phaseGates before allowing access
  addXP(amount) → updates level automatically
  completeWeek(week) → marks complete, adds XP, checks phase unlock
  startSession() / endSession() → streak tracking

XP levels (10 total):
  0      → "Raw Query"
  100    → "Data Apprentice"
  300    → "Table Turner"
  600    → "Join Jockey"
  1000   → "Query Craftsman"
  1500   → "Data Wrangler"
  2200   → "Pipeline Pro"
  3000   → "Analytics Engineer"
  4000   → "Senior Analyst"
  5500   → "Data Architect"
```

---

## Component File Map

```
src/
├── App.tsx                  ← Layout shell, view router, Sage panel
├── components/
│   ├── Dashboard.tsx        ← Progress, week grid, XP bar
│   ├── LessonReader.tsx     ← Week lesson content renderer
│   ├── DualEditor.tsx       ← SQL + Python editors side-by-side
│   ├── SQLEditor.tsx        ← Monaco + sql.js, results table
│   ├── PythonEditor.tsx     ← Monaco + Pyodide, output terminal
│   ├── SageTutor.tsx        ← AI chat panel (streaming)
│   ├── MiniProject.tsx      ← Project view with test cases
│   ├── PhaseGate.tsx        ← Phase assessment
│   ├── SeniorInsight.tsx    ← Insight cards grid
│   └── ErrorBoundary.tsx    ← Catches component crashes
├── store/
│   └── progress.ts          ← Zustand persist store
├── data/
│   ├── curriculum.ts        ← 16 WeekDefinition objects
│   └── senior_insights.json ← 10 insight cards
└── hooks/
    └── useIsMobile.ts       ← window.innerWidth < 768
```

---

## Backend (Express proxy — server/index.cjs)

**Only purpose:** Proxy Claude API calls (keep API key off the client)

```
POST /api/sage/chat          → SSE stream (claude-sonnet-4-5)
POST /api/sage/explain-error → JSON
POST /api/sage/hint          → JSON
POST /api/sage/grade         → JSON { score, feedback, passed }
POST /api/sage/senior-take   → JSON
POST /api/sage/easier-way    → JSON
POST /api/sage/mirror        → JSON { translatedCode, explanation }
POST /api/assessment/grade   → JSON { score, passed, breakdown }
```

**Model:** `claude-sonnet-4-5`
**Auth:** `x-api-key` header from `process.env.ANTHROPIC_API_KEY`

---

## Adapting This to Another App

To replicate this shell for a different subject or domain:

1. **Keep identical:** App.tsx shell, sidebar/bottom-nav structure, Sage panel slide behavior, color tokens, font stack
2. **Replace:** curriculum.ts (your content), senior_insights.json (your wisdom cards), dataset files in public/datasets/
3. **Rename:** "SQL + Python" logo text → your subject, view labels if needed
4. **Tune Sage:** Change the system prompt in server/index.cjs to reflect your domain and persona
5. **Optional:** Remove the Mirror button if your app doesn't have dual editors
