import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfilesStore, Profile } from '@/store/profiles'

type AuthView = 'welcome' | 'select' | 'create' | 'password'

interface AuthScreenProps {
  onAuthenticated: () => void
}

// ── Avatar circle ──────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-500',
  'from-indigo-400 to-blue-500',
]

function avatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function Avatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-12 h-12 text-base' : 'w-8 h-8 text-xs'
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${avatarColor(profile.id)} flex items-center justify-center font-bold text-white shadow-md flex-shrink-0`}>
      {profile.isGuest ? '👤' : profile.avatar}
    </div>
  )
}

// ── Input component ────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoFocus,
  textarea,
  rows,
}: {
  label: string
  hint?: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  textarea?: boolean
  rows?: number
}) {
  const base =
    'w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-sm text-white placeholder-accent-muted/50 focus:outline-none focus:border-accent-sql/50 focus:ring-1 focus:ring-accent-sql/20 transition-colors'

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono text-accent-muted uppercase tracking-wide">
        {label}
      </label>
      {textarea ? (
        <textarea
          className={`${base} resize-none`}
          rows={rows ?? 3}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
      ) : (
        <input
          className={base}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
      )}
      {hint && <p className="text-xs text-accent-muted/70">{hint}</p>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const { profiles, createProfile, loginWithPassword, setActiveProfile } = useProfilesStore()

  const realProfiles = profiles.filter(p => !p.isGuest)
  const hasProfiles = realProfiles.length > 0

  const [view, setView] = useState<AuthView>(hasProfiles ? 'select' : 'welcome')
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  // Create form state
  const [createName, setCreateName] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createConfirm, setCreateConfirm] = useState('')
  const [createContext, setCreateContext] = useState('')
  const [createError, setCreateError] = useState('')

  // ── Handlers ──────────────────────────────────────────────────────────
  function handleProfileClick(profile: Profile) {
    if (!profile.passwordHash) {
      // No password required — log in directly
      setActiveProfile(profile.id)
      onAuthenticated()
    } else {
      setSelectedProfile(profile)
      setPasswordInput('')
      setPasswordError(false)
      setView('password')
    }
  }

  function handlePasswordSubmit() {
    if (!selectedProfile) return
    if (loginWithPassword(selectedProfile.id, passwordInput)) {
      setActiveProfile(selectedProfile.id)
      onAuthenticated()
    } else {
      setPasswordError(true)
      setPasswordInput('')
    }
  }

  function handleCreate() {
    setCreateError('')
    if (!createName.trim()) {
      setCreateError('Please enter your name.')
      return
    }
    if (createPassword && createPassword !== createConfirm) {
      setCreateError('Passwords don\'t match.')
      return
    }
    const profile = createProfile(createName, createPassword, createContext, false)
    setActiveProfile(profile.id)
    onAuthenticated()
  }

  function handleGuest() {
    // Reuse existing guest or create a new one
    const existing = profiles.find(p => p.isGuest)
    if (existing) {
      setActiveProfile(existing.id)
    } else {
      const guest = createProfile('Guest', '', 'a student learning SQL and Python from scratch', true)
      setActiveProfile(guest.id)
    }
    onAuthenticated()
  }

  // ── Views ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50 p-4">
      <AnimatePresence mode="wait">

        {/* ── Welcome ─────────────────────────────────────────── */}
        {view === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md"
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="font-display font-bold text-3xl text-accent-sql text-glow-sql">SQL</span>
                <span className="text-border-strong text-2xl">+</span>
                <span className="font-display font-bold text-3xl text-accent-python">Python</span>
              </div>
              <p className="text-accent-muted text-sm font-mono">with Sage AI Tutor</p>
            </div>

            <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6 shadow-2xl">
              <h2 className="text-white font-display font-bold text-xl mb-1">Welcome</h2>
              <p className="text-accent-muted text-sm mb-6">
                Create a profile so Sage can personalise your learning experience, or jump in as a guest.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setView('create')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-sql/15 border border-accent-sql/30 text-accent-sql font-semibold text-sm hover:bg-accent-sql/25 transition-all"
                >
                  <span>✦</span> Create Account
                </button>
                <button
                  onClick={handleGuest}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-bg-tertiary border border-border-default text-accent-muted font-medium text-sm hover:border-border-strong hover:text-white transition-all"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Select profile ──────────────────────────────────── */}
        {view === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="font-display font-bold text-2xl text-accent-sql text-glow-sql">SQL</span>
                <span className="text-border-strong text-xl">+</span>
                <span className="font-display font-bold text-2xl text-accent-python">Python</span>
              </div>
              <p className="text-accent-muted text-xs font-mono">with Sage AI Tutor</p>
            </div>

            <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6 shadow-2xl">
              <h2 className="text-white font-display font-bold text-lg mb-4">Who's learning today?</h2>

              <div className="flex flex-col gap-2 mb-4">
                {realProfiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileClick(profile)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary border border-border-default hover:border-accent-sql/30 hover:bg-bg-tertiary/80 transition-all text-left group"
                  >
                    <Avatar profile={profile} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm truncate">{profile.name}</div>
                      <div className="text-accent-muted text-xs font-mono truncate">
                        {profile.passwordHash ? '🔒 Password protected' : 'No password'}
                      </div>
                    </div>
                    <span className="text-accent-muted group-hover:text-white transition-colors text-sm">→</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-border-subtle pt-4 flex gap-2">
                <button
                  onClick={() => setView('create')}
                  className="flex-1 px-3 py-2 rounded-lg bg-accent-sql/10 border border-accent-sql/20 text-accent-sql text-xs font-semibold hover:bg-accent-sql/20 transition-all"
                >
                  + Add Profile
                </button>
                <button
                  onClick={handleGuest}
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border-default text-accent-muted text-xs hover:text-white hover:border-border-strong transition-all"
                >
                  Guest Mode
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Password entry ──────────────────────────────────── */}
        {view === 'password' && selectedProfile && (
          <motion.div
            key="password"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm"
          >
            <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6 shadow-2xl">
              <div className="flex flex-col items-center gap-3 mb-6">
                <Avatar profile={selectedProfile} size="lg" />
                <div className="text-center">
                  <div className="text-white font-semibold text-lg">{selectedProfile.name}</div>
                  <div className="text-accent-muted text-xs font-mono">Enter your password</div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Field
                  label="Password"
                  type="password"
                  value={passwordInput}
                  onChange={v => { setPasswordInput(v); setPasswordError(false) }}
                  placeholder="••••••••"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-400 text-xs text-center">Incorrect password. Try again.</p>
                )}

                <button
                  onClick={handlePasswordSubmit}
                  onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                  className="w-full py-2.5 rounded-xl bg-accent-sql/20 border border-accent-sql/40 text-accent-sql font-semibold text-sm hover:bg-accent-sql/30 transition-all"
                >
                  Sign In
                </button>

                <button
                  onClick={() => { setView(hasProfiles ? 'select' : 'welcome'); setPasswordInput('') }}
                  className="text-accent-muted text-xs text-center hover:text-white transition-colors"
                >
                  ← Back
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Create account ──────────────────────────────────── */}
        {view === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md"
          >
            <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6 shadow-2xl">
              <h2 className="text-white font-display font-bold text-xl mb-1">Create Account</h2>
              <p className="text-accent-muted text-sm mb-5">
                Tell Sage a bit about yourself so the examples actually make sense for your life.
              </p>

              <div className="flex flex-col gap-4">
                <Field
                  label="Your name"
                  value={createName}
                  onChange={setCreateName}
                  placeholder="e.g. Alex"
                  autoFocus
                />

                <Field
                  label="About you (optional)"
                  hint='Sage uses this to pick analogies that click for you. E.g. "I manage a restaurant and want to analyse sales data" or "I work in healthcare scheduling".'
                  value={createContext}
                  onChange={setCreateContext}
                  placeholder="Tell Sage about your job, goals, or what you want to build…"
                  textarea
                  rows={3}
                />

                <Field
                  label="Password (optional)"
                  hint="Leave blank if you're the only one using this device."
                  type="password"
                  value={createPassword}
                  onChange={setCreatePassword}
                  placeholder="Choose a password…"
                />

                {createPassword && (
                  <Field
                    label="Confirm password"
                    type="password"
                    value={createConfirm}
                    onChange={setCreateConfirm}
                    placeholder="Repeat password…"
                  />
                )}

                {createError && (
                  <p className="text-red-400 text-xs">{createError}</p>
                )}

                <button
                  onClick={handleCreate}
                  className="w-full py-2.5 rounded-xl bg-accent-sql/20 border border-accent-sql/40 text-accent-sql font-semibold text-sm hover:bg-accent-sql/30 transition-all mt-1"
                >
                  Start Learning →
                </button>

                <button
                  onClick={() => setView(hasProfiles ? 'select' : 'welcome')}
                  className="text-accent-muted text-xs text-center hover:text-white transition-colors"
                >
                  ← Back
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
