import { useState } from 'react'
import { motion } from 'framer-motion'
import { useProfilesStore, hashProfilePassword } from '@/store/profiles'

interface AccountSettingsProps {
  onClose: () => void
  onDeleted: () => void  // called after account is deleted
}

export default function AccountSettings({ onClose, onDeleted }: AccountSettingsProps) {
  const { getActiveProfile, updateProfile, deleteProfile, logout } = useProfilesStore()
  const profile = getActiveProfile()

  const [name, setName] = useState(profile?.name || '')
  const [context, setContext] = useState(profile?.context || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  const [infoSaved, setInfoSaved] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  if (!profile) return null

  function handleSaveInfo() {
    if (!profile) return
    updateProfile(profile.id, { name: name.trim() || profile.name, context: context.trim() })
    setInfoSaved(true)
    setTimeout(() => setInfoSaved(false), 2000)
  }

  function handleChangePassword() {
    if (!profile) return
    setPwError('')
    // Verify current password if one exists
    if (profile.passwordHash) {
      const expected = hashProfilePassword(currentPw, profile.id)
      if (expected !== profile.passwordHash) {
        setPwError('Current password is incorrect.')
        return
      }
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords don\'t match.')
      return
    }
    updateProfile(profile.id, { passwordHash: hashProfilePassword(newPw, profile.id) })
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2000)
  }

  function handleDelete() {
    if (!profile) return
    if (deleteInput.toLowerCase() !== 'delete') return
    deleteProfile(profile.id)
    logout()
    onDeleted()
  }

  const inputClass = 'w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#484F58] focus:outline-none focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/20 transition-colors'
  const labelClass = 'text-xs font-mono text-[#8B949E] uppercase tracking-wide block mb-1.5'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0D1117]/95 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Account Settings</h1>
            <p className="text-[#8B949E] text-sm font-mono mt-0.5">{profile.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8B949E] hover:text-white transition-colors text-sm font-mono border border-[#30363D] rounded-lg px-3 py-1.5 hover:border-[#8B949E]"
          >
            ← Back
          </button>
        </div>

        <div className="space-y-4">

          {/* ── Profile Info ── */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <span className="text-[#00D4FF]">◈</span> Profile Info
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Display Name</label>
                <input
                  className={inputClass}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className={labelClass}>About You — Sage Context</label>
                <p className="text-[10px] text-[#8B949E]/70 mb-2">
                  Sage uses this to pick analogies that click for you. Be specific — job, goals, what you want to build.
                </p>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={4}
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="e.g. I manage a Panda Express and want to build dashboards tracking food costs and labour hours across locations…"
                />
              </div>
              <button
                onClick={handleSaveInfo}
                className="w-full py-2.5 rounded-lg bg-[#00D4FF]/15 border border-[#00D4FF]/30 text-[#00D4FF] font-semibold text-sm hover:bg-[#00D4FF]/25 transition-all"
              >
                {infoSaved ? '✓ Saved' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* ── Password ── */}
          {!profile.isGuest && (
            <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5">
              <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <span className="text-[#FFB347]">🔒</span> Password
              </h2>
              <div className="space-y-3">
                {profile.passwordHash && (
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <input
                      className={inputClass}
                      type="password"
                      value={currentPw}
                      onChange={e => setCurrentPw(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                )}
                <div>
                  <label className={labelClass}>{profile.passwordHash ? 'New Password' : 'Set a Password'}</label>
                  <input
                    className={inputClass}
                    type="password"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="New password (leave blank to remove)"
                  />
                </div>
                {newPw && (
                  <div>
                    <label className={labelClass}>Confirm New Password</label>
                    <input
                      className={inputClass}
                      type="password"
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      placeholder="Repeat new password"
                    />
                  </div>
                )}
                {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
                {pwSaved && <p className="text-green-400 text-xs">✓ Password updated</p>}
                <button
                  onClick={handleChangePassword}
                  className="w-full py-2.5 rounded-lg bg-[#FFB347]/10 border border-[#FFB347]/25 text-[#FFB347] font-semibold text-sm hover:bg-[#FFB347]/20 transition-all"
                >
                  Update Password
                </button>
              </div>
            </div>
          )}

          {/* ── Danger Zone ── */}
          <div className="bg-[#161B22] border border-red-500/20 rounded-xl p-5">
            <h2 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
              <span className="text-red-400">⚠</span> Danger Zone
            </h2>
            <p className="text-[#8B949E] text-xs mb-4">
              Deleting your account removes all progress data permanently. This cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-all"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-[#8B949E] text-xs">
                  Type <span className="text-red-400 font-mono font-bold">delete</span> to confirm.
                </p>
                <input
                  className={inputClass}
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder="Type delete to confirm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleteInput.toLowerCase() !== 'delete'}
                    className="flex-1 py-2.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                    className="flex-1 py-2.5 rounded-lg bg-[#21262D] border border-[#30363D] text-[#8B949E] font-semibold text-sm hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </motion.div>
  )
}
