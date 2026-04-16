import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WeekProgress {
  lessonRead: boolean
  miniProjectStatus: 'not_started' | 'in_progress' | 'submitted' | 'graded'
  miniProjectScore: number | null
  sqlExercisesCompleted: number
  pythonExercisesCompleted: number
  insightsUnlocked: string[]
}

export interface PhaseGate {
  phase: 1 | 2 | 3 | 4
  passed: boolean
  score: number | null
  completedAt: string | null
  retakeAvailableAt: string | null
}

export interface ProgressState {
  // Identity
  studentName: string

  // Current position
  currentWeek: number
  currentPhase: 1 | 2 | 3 | 4

  // XP & Leveling
  xp: number
  level: number

  // Streaks
  currentStreak: number
  longestStreak: number
  lastStudyDate: string | null
  studyCalendar: Record<string, boolean>  // YYYY-MM-DD: true

  // Week data
  weekProgress: Record<number, WeekProgress>

  // Phase gates
  phaseGates: Record<number, PhaseGate>

  // Active track
  activeTrack: 'sql' | 'python' | 'both'

  // Total time studied (minutes)
  totalMinutesStudied: number
  sessionStartTime: number | null

  // Unlocked senior insights
  unlockedInsights: string[]

  // Actions
  addXP: (amount: number, reason: string) => void
  setCurrentWeek: (week: number) => void
  markLessonRead: (week: number) => void
  updateMiniProject: (week: number, status: WeekProgress['miniProjectStatus'], score?: number) => void
  completeExercise: (week: number, track: 'sql' | 'python') => void
  completePhaseGate: (phase: 1 | 2 | 3 | 4, score: number) => void
  failPhaseGate: (phase: 1 | 2 | 3 | 4, score: number) => void
  unlockInsight: (insightId: string) => void
  recordStudySession: () => void
  startSession: () => void
  endSession: () => void
  setActiveTrack: (track: 'sql' | 'python' | 'both') => void
  isWeekUnlocked: (week: number) => boolean
}

const LEVEL_THRESHOLDS = [
  0,     // Level 1: Curious Beginner
  500,   // Level 2: Syntax Explorer
  1200,  // Level 3: Query Builder
  2200,  // Level 4: Data Wrangler
  3500,  // Level 5: Join Master
  5200,  // Level 6: Pipeline Architect
  7500,  // Level 7: Pattern Recognizer
  10500, // Level 8: Performance Thinker
  14500, // Level 9: Systems Analyst
  20000, // Level 10: Senior Analyst
]

export const LEVEL_NAMES = [
  'Curious Beginner',
  'Syntax Explorer',
  'Query Builder',
  'Data Wrangler',
  'Join Master',
  'Pipeline Architect',
  'Pattern Recognizer',
  'Performance Thinker',
  'Systems Analyst',
  'Senior Analyst',
]

function computeLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

const defaultWeekProgress = (): WeekProgress => ({
  lessonRead: false,
  miniProjectStatus: 'not_started',
  miniProjectScore: null,
  sqlExercisesCompleted: 0,
  pythonExercisesCompleted: 0,
  insightsUnlocked: [],
})

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      studentName: 'Justin',
      currentWeek: 1,
      currentPhase: 1,
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      studyCalendar: {},
      weekProgress: {},
      phaseGates: {},
      activeTrack: 'both',
      totalMinutesStudied: 0,
      sessionStartTime: null,
      unlockedInsights: [],

      addXP: (amount, _reason) => {
        set(state => {
          const newXP = state.xp + amount
          const newLevel = computeLevel(newXP)
          return { xp: newXP, level: newLevel }
        })
      },

      setCurrentWeek: (week) => set({ currentWeek: week }),

      markLessonRead: (week) => {
        set(state => {
          const wp = state.weekProgress[week] || defaultWeekProgress()
          if (!wp.lessonRead) {
            // Award XP for first read
            setTimeout(() => get().addXP(50, 'Completed lesson'), 0)
          }
          return {
            weekProgress: {
              ...state.weekProgress,
              [week]: { ...wp, lessonRead: true }
            }
          }
        })
      },

      updateMiniProject: (week, status, score) => {
        set(state => {
          const wp = state.weekProgress[week] || defaultWeekProgress()
          if (status === 'graded' && score !== undefined) {
            setTimeout(() => get().addXP(150, 'Mini-project graded'), 0)
          }
          return {
            weekProgress: {
              ...state.weekProgress,
              [week]: { ...wp, miniProjectStatus: status, miniProjectScore: score ?? wp.miniProjectScore }
            }
          }
        })
      },

      completeExercise: (week, track) => {
        set(state => {
          const wp = state.weekProgress[week] || defaultWeekProgress()
          return {
            weekProgress: {
              ...state.weekProgress,
              [week]: {
                ...wp,
                sqlExercisesCompleted: track === 'sql' ? wp.sqlExercisesCompleted + 1 : wp.sqlExercisesCompleted,
                pythonExercisesCompleted: track === 'python' ? wp.pythonExercisesCompleted + 1 : wp.pythonExercisesCompleted,
              }
            }
          }
        })
      },

      completePhaseGate: (phase, score) => {
        set(state => {
          const now = new Date().toISOString()
          return {
            phaseGates: {
              ...state.phaseGates,
              [phase]: { phase, passed: true, score, completedAt: now, retakeAvailableAt: null }
            }
          }
        })
        get().addXP(500, `Phase ${phase} gate passed`)
      },

      failPhaseGate: (phase, score) => {
        const retakeAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        set(state => ({
          phaseGates: {
            ...state.phaseGates,
            [phase]: { phase, passed: false, score, completedAt: null, retakeAvailableAt: retakeAt }
          }
        }))
      },

      unlockInsight: (insightId) => {
        set(state => {
          if (state.unlockedInsights.includes(insightId)) return state
          setTimeout(() => get().addXP(100, 'Senior insight unlocked'), 0)
          return { unlockedInsights: [...state.unlockedInsights, insightId] }
        })
      },

      recordStudySession: () => {
        const today = todayStr()
        set(state => {
          const calendar = { ...state.studyCalendar, [today]: true }
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          let streak = state.currentStreak
          if (state.lastStudyDate === yesterday) {
            streak += 1
          } else if (state.lastStudyDate !== today) {
            streak = 1
          }
          const longest = Math.max(streak, state.longestStreak)
          // Streak bonus
          if (streak > 0 && streak % 7 === 0) {
            setTimeout(() => get().addXP(200, '7-day streak bonus!'), 0)
          }
          return {
            studyCalendar: calendar,
            lastStudyDate: today,
            currentStreak: streak,
            longestStreak: longest,
          }
        })
      },

      startSession: () => set({ sessionStartTime: Date.now() }),

      endSession: () => {
        set(state => {
          if (!state.sessionStartTime) return state
          const minutes = Math.floor((Date.now() - state.sessionStartTime) / 60000)
          return {
            totalMinutesStudied: state.totalMinutesStudied + minutes,
            sessionStartTime: null,
          }
        })
        get().recordStudySession()
      },

      setActiveTrack: (track) => set({ activeTrack: track }),

      isWeekUnlocked: (week) => {
        const state = get()
        if (week <= 4) return true
        // Phase 1 gate required for weeks 5-8
        if (week <= 8) return state.phaseGates[1]?.passed === true
        // Phase 2 gate required for weeks 9-12
        if (week <= 12) return state.phaseGates[2]?.passed === true
        // Phase 3 gate required for weeks 13-16
        return state.phaseGates[3]?.passed === true
      },
    }),
    {
      name: 'sage-learning-progress',
      version: 1,
    }
  )
)

export function xpToNextLevel(xp: number, level: number): { current: number; needed: number; pct: number } {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const current = xp - currentThreshold
  const needed = nextThreshold - currentThreshold
  return { current, needed, pct: Math.min(100, (current / needed) * 100) }
}
