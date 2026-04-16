import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfilesStore, Profile } from '@/store/profiles'

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

function MiniAvatar({ profile }: { profile: Profile }) {
  return (
    <div
      className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor(profile.id)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
    >
      {profile.isGuest ? '👤' : profile.avatar}
    </div>
  )
}

interface ProfileSwitcherProps {
  onSwitchRequest: () => void // called when user wants the auth screen
}

export default function ProfileSwitcher({ onSwitchRequest }: ProfileSwitcherProps) {
  const { profiles, getActiveProfile, logout } = useProfilesStore()
  const activeProfile = getActiveProfile()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!activeProfile) return null

  const otherProfiles = profiles.filter(p => p.id !== activeProfile.id && !p.isGuest)

  function handleLogout() {
    setOpen(false)
    logout()
    onSwitchRequest()
    // Reload to re-initialise the progress store with the new key
    window.location.reload()
  }

  function handleSwitch(profile: Profile) {
    setOpen(false)
    if (!profile.passwordHash) {
      useProfilesStore.getState().setActiveProfile(profile.id)
      window.location.reload()
    } else {
      // Let auth screen handle the password
      useProfilesStore.getState().logout()
      onSwitchRequest()
      // Small delay so the auth screen sees the new state
      setTimeout(() => window.location.reload(), 50)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border transition-all text-xs font-medium
          ${open
            ? 'bg-bg-tertiary border-border-strong text-white'
            : 'bg-bg-tertiary/60 border-border-subtle text-accent-muted hover:border-border-default hover:text-white'
          }`}
      >
        <MiniAvatar profile={activeProfile} />
        <span className="max-w-[80px] truncate hidden sm:block">{activeProfile.name}</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 bg-bg-secondary border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Current profile header */}
            <div className="px-3 py-2.5 border-b border-border-subtle flex items-center gap-2.5">
              <MiniAvatar profile={activeProfile} />
              <div className="min-w-0">
                <div className="text-white text-xs font-semibold truncate">{activeProfile.name}</div>
                <div className="text-accent-muted text-[10px] font-mono">
                  {activeProfile.isGuest ? 'Guest session' : 'Active profile'}
                </div>
              </div>
            </div>

            {/* Switch to another profile */}
            {otherProfiles.length > 0 && (
              <div className="py-1 border-b border-border-subtle">
                <div className="px-3 py-1 text-[10px] font-mono text-accent-muted/60 uppercase tracking-wide">
                  Switch to
                </div>
                {otherProfiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSwitch(p)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-bg-tertiary transition-colors text-left"
                  >
                    <MiniAvatar profile={p} />
                    <span className="text-accent-muted text-xs truncate hover:text-white">{p.name}</span>
                    {p.passwordHash && <span className="ml-auto text-[10px] text-accent-muted/50">🔒</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={() => { setOpen(false); onSwitchRequest() }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-tertiary transition-colors text-left"
              >
                <span className="text-accent-muted/60 text-sm">＋</span>
                <span className="text-accent-muted text-xs hover:text-white">Add Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-tertiary transition-colors text-left"
              >
                <span className="text-accent-muted/60 text-sm">↩</span>
                <span className="text-accent-muted text-xs hover:text-white">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
