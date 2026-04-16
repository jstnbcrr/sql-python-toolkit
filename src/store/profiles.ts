import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Profile {
  id: string
  name: string
  passwordHash: string  // '' means no password required
  context: string       // Personalization text for Sage AI
  createdAt: string
  isGuest: boolean
  avatar: string        // Two-letter initials
  hasSeenTour: boolean
}

interface ProfilesState {
  profiles: Profile[]
  activeProfileId: string | null

  createProfile: (name: string, password: string, context: string, isGuest?: boolean) => Profile
  loginWithPassword: (profileId: string, password: string) => boolean
  setActiveProfile: (profileId: string) => void
  getActiveProfile: () => Profile | null
  updateProfile: (id: string, updates: Partial<Pick<Profile, 'name' | 'context' | 'passwordHash'>>) => void
  deleteProfile: (id: string) => void
  logout: () => void
  markTourSeen: (profileId: string) => void
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function hashPassword(password: string, id: string): string {
  if (!password) return ''
  // Simple client-side hash: good enough for a local learning app
  return btoa(`sage-v1-${id}-${password}`)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??'
}

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,

      createProfile: (name, password, context, isGuest = false) => {
        const id = makeId()
        const displayName = name.trim() || (isGuest ? 'Guest' : 'Learner')
        const profile: Profile = {
          id,
          name: displayName,
          passwordHash: hashPassword(password, id),
          context: context.trim(),
          createdAt: new Date().toISOString(),
          isGuest,
          avatar: getInitials(displayName),
          hasSeenTour: false,
        }

        // Migrate existing progress data when creating the very first real profile
        const state = get()
        if (!isGuest && state.profiles.filter(p => !p.isGuest).length === 0) {
          try {
            const oldProgress = localStorage.getItem('sage-learning-progress')
            if (oldProgress) {
              localStorage.setItem(`sage-progress-${id}`, oldProgress)
            }
          } catch {
            // ignore storage errors
          }
        }

        set(state => ({ profiles: [...state.profiles, profile] }))
        return profile
      },

      loginWithPassword: (profileId, password) => {
        const profile = get().profiles.find(p => p.id === profileId)
        if (!profile) return false
        // No password set — open access
        if (!profile.passwordHash) return true
        return profile.passwordHash === hashPassword(password, profileId)
      },

      setActiveProfile: (profileId) => {
        try {
          localStorage.setItem('sage-active-profile', profileId)
        } catch { /* ignore */ }
        set({ activeProfileId: profileId })
      },

      getActiveProfile: () => {
        const { profiles, activeProfileId } = get()
        return profiles.find(p => p.id === activeProfileId) ?? null
      },

      updateProfile: (id, updates) => {
        set(state => ({
          profiles: state.profiles.map(p =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }))
      },

      deleteProfile: (id) => {
        try {
          localStorage.removeItem(`sage-progress-${id}`)
          if (localStorage.getItem('sage-active-profile') === id) {
            localStorage.removeItem('sage-active-profile')
          }
        } catch { /* ignore */ }
        set(state => ({
          profiles: state.profiles.filter(p => p.id !== id),
          activeProfileId: state.activeProfileId === id ? null : state.activeProfileId,
        }))
      },

      logout: () => {
        try {
          localStorage.removeItem('sage-active-profile')
        } catch { /* ignore */ }
        set({ activeProfileId: null })
      },

      markTourSeen: (profileId) => {
        set(state => ({
          profiles: state.profiles.map(p =>
            p.id === profileId ? { ...p, hasSeenTour: true } : p
          ),
        }))
      },
    }),
    { name: 'sage-profiles', version: 1 }
  )
)

// Public helper: hash a password for an existing profile (e.g. when updating)
export function hashProfilePassword(password: string, profileId: string): string {
  return password ? btoa(`sage-v1-${profileId}-${password}`) : ''
}
