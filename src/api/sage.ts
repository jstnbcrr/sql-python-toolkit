const BASE = '/api/sage'
const ASSESSMENT_BASE = '/api/assessment'

export interface SageMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface GradeResult {
  correctness: { score: number; feedback: string }
  readability: { score: number; feedback: string }
  efficiency: { score: number; feedback: string }
  explanation: { score: number; feedback: string }
  total: number
  grade: string
  senior_insight: string
  what_to_focus_on_next: string
}

// Build Sage's system prompt for a given week/topic
export function buildSageSystemPrompt(week: number, topic: string, phase: number, lessonContent?: string): string {
  return `You are Sage, a senior data engineer and analyst with 15 years of experience at companies like Airbnb, Stripe, and various retail analytics firms. You are tutoring Justin Becerra, a B.S. Information Systems & Analytics student who wants to relearn SQL and Python from zero but build to senior-level thinking.

Justin's background:
- Retail operations experience (Panda Express manager) — use food/retail analogies often
- Building a transit data capstone (SunTran bus system) — reference operations data when relevant
- Ambitious and driven, learns best with real-world context and WHY-first explanations
- Wants to understand WHY things work, not just HOW to do them

Your teaching rules:
1. NEVER just give the answer. Guide Justin to find it. Ask leading questions.
2. Always explain WHY before HOW. "Here's the problem this solves..." before "here's the syntax"
3. When Justin gets something right, push further: "Good. Now what would happen if..."
4. When Justin is stuck, give a hint using an analogy from retail or operations
5. Occasionally volunteer "senior insights" — things the book doesn't teach but experienced engineers know
6. If Justin asks "is there an easier way?" — ALWAYS answer honestly. Sometimes yes, sometimes no, explain both.
7. Connect SQL and Python constantly: "You just did this in SQL — here's the Python equivalent"
8. Be direct but never condescending. You're a mentor, not a professor.
9. Keep responses conversational and focused. No walls of text.

Current week: ${week}
Current topic: ${topic}
Current phase: ${phase}

${lessonContent ? `Book content for current lesson (use this as context, don't quote it verbatim):\n${lessonContent.slice(0, 3000)}` : ''}`.trim()
}

// Stream Sage's response using SSE
export async function streamSageChat(
  messages: SageMessage[],
  systemPrompt: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt }),
    })

    if (!response.ok) {
      onError(`Server error: ${response.status}`)
      return
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            onDone()
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) onToken(parsed.text)
            if (parsed.error) onError(parsed.error)
          } catch {
            // Skip malformed lines
          }
        }
      }
    }
    onDone()
  } catch (err: unknown) {
    onError(err instanceof Error ? err.message : 'Network error — is the backend running?')
  }
}

export async function explainError(
  error: string,
  code: string,
  language: 'sql' | 'python',
  week: number,
  topic: string
): Promise<string> {
  try {
    const res = await fetch(`${BASE}/explain-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error, code, language, week, topic }),
    })
    const data = await res.json()
    return data.explanation || data.error || 'Could not explain error'
  } catch {
    return 'Could not reach Sage — check that the backend is running.'
  }
}

export async function getHint(
  code: string,
  task: string,
  language: 'sql' | 'python',
  week: number
): Promise<string> {
  try {
    const res = await fetch(`${BASE}/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, task, language, week }),
    })
    const data = await res.json()
    return data.hint || data.error || 'No hint available'
  } catch {
    return 'Could not reach Sage.'
  }
}

export async function gradeProject(params: {
  projectName: string
  week: number
  requirements: string
  sqlCode: string
  pythonCode: string
  explanation: string
  testResults: Record<string, boolean>
}): Promise<GradeResult | null> {
  try {
    const res = await fetch(`${BASE}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    return await res.json()
  } catch {
    return null
  }
}

export async function getSeniorTake(
  code: string,
  language: 'sql' | 'python',
  context: string
): Promise<string> {
  try {
    const res = await fetch(`${BASE}/senior-take`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, context }),
    })
    const data = await res.json()
    return data.seniorTake || data.error || ''
  } catch {
    return 'Could not reach Sage.'
  }
}

export async function getEasierWay(
  code: string,
  language: 'sql' | 'python',
  concept: string
): Promise<string> {
  try {
    const res = await fetch(`${BASE}/easier-way`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, concept }),
    })
    const data = await res.json()
    return data.easierWay || data.error || ''
  } catch {
    return 'Could not reach Sage.'
  }
}

export async function getMirror(
  code: string,
  fromLanguage: 'sql' | 'python',
  toLanguage: 'sql' | 'python'
): Promise<string> {
  try {
    const res = await fetch(`${BASE}/mirror`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, fromLanguage, toLanguage }),
    })
    const data = await res.json()
    return data.mirror || data.error || ''
  } catch {
    return 'Could not reach Sage.'
  }
}

export async function gradeAssessment(params: {
  questions: Array<{ question: string; expected: string }>
  answers: string[]
  week: number
}): Promise<{ scores: Array<{ question: number; correct: boolean; feedback: string }>; total_score: number; passed: boolean; overall_feedback: string; weak_areas: string[]; strong_areas: string[] } | null> {
  try {
    const res = await fetch(`${ASSESSMENT_BASE}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    return await res.json()
  } catch {
    return null
  }
}
