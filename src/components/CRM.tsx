import { useState, useEffect } from 'react'
import { useCRMStore, Contact, ContactStatus } from '@/store/crm'

const STATUS_COLORS: Record<ContactStatus, string> = {
  networking:   'text-blue-400 bg-blue-400/10 border-blue-400/30',
  applied:      'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  interviewing: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  offer:        'text-green-400 bg-green-400/10 border-green-400/30',
  rejected:     'text-red-400 bg-red-400/10 border-red-400/30',
  closed:       'text-gray-400 bg-gray-400/10 border-gray-400/30',
}

const STATUS_LABELS: Record<ContactStatus, string> = {
  networking:   'Networking',
  applied:      'Applied',
  interviewing: 'Interviewing',
  offer:        'Offer',
  rejected:     'Rejected',
  closed:       'Closed',
}

const EMPTY: Omit<Contact, 'id' | 'createdAt'> = {
  name: '', company: '', role: '', email: '', phone: '',
  status: 'networking', notes: '', followUpDate: '', lastContacted: '',
}

function ContactForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Contact, 'id' | 'createdAt'>
  onSave: (c: Omit<Contact, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-secondary border border-border-default rounded-xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="font-display font-semibold text-white text-sm">
            {initial.name ? 'Edit Contact' : 'New Contact'}
          </h2>
          <button onClick={onCancel} className="text-accent-muted hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <Field label="Name *" value={form.name} onChange={v => set('name', v)} placeholder="John Smith" />
          <Field label="Company" value={form.company} onChange={v => set('company', v)} placeholder="Hurricane City" />
          <Field label="Role" value={form.role} onChange={v => set('role', v)} placeholder="GIS Analyst" />
          <Field label="Email" value={form.email} onChange={v => set('email', v)} placeholder="john@example.com" type="email" />
          <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} placeholder="435-555-0100" type="tel" />
          <div>
            <label className="block text-xs text-accent-muted mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-sql/50"
            >
              {(Object.keys(STATUS_LABELS) as ContactStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <Field label="Follow-up date" value={form.followUpDate} onChange={v => set('followUpDate', v)} type="date" />
          <Field label="Last contacted" value={form.lastContacted} onChange={v => set('lastContacted', v)} type="date" />
          <div>
            <label className="block text-xs text-accent-muted mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="What did you discuss? What's next?"
              className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-sql/50 resize-none"
            />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border-subtle flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-accent-muted hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={() => form.name.trim() && onSave(form)}
            disabled={!form.name.trim()}
            className="px-4 py-2 text-sm bg-accent-sql/20 text-accent-sql border border-accent-sql/30 rounded-lg hover:bg-accent-sql/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs text-accent-muted mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-white placeholder-border-strong focus:outline-none focus:border-accent-sql/50"
      />
    </div>
  )
}

export default function CRM() {
  const { contacts, loading, fetchContacts, addContact, updateContact, deleteContact, getDueFollowUps } = useCRMStore()

  useEffect(() => { fetchContacts() }, [])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [filter, setFilter] = useState<ContactStatus | 'all'>('all')
  const [briefStatus, setBriefStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [telegramStatus, setTelegramStatus] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({})

  const due = getDueFollowUps()
  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.status === filter)

  async function sendReminder(contact: Contact) {
    setTelegramStatus(s => ({ ...s, [contact.id]: 'sending' }))
    let msg = `*Follow-up reminder* \n\n👤 *${contact.name}*`
    if (contact.company) msg += ` @ ${contact.company}`
    if (contact.role) msg += `\n💼 ${contact.role}`
    if (contact.status) msg += `\n📌 Status: ${STATUS_LABELS[contact.status]}`
    if (contact.notes) msg += `\n📝 ${contact.notes}`
    if (contact.email) msg += `\n✉️ ${contact.email}`
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg }),
      })
      setTelegramStatus(s => ({ ...s, [contact.id]: res.ok ? 'sent' : 'error' }))
      setTimeout(() => setTelegramStatus(s => ({ ...s, [contact.id]: 'idle' })), 3000)
    } catch {
      setTelegramStatus(s => ({ ...s, [contact.id]: 'error' }))
    }
  }

  async function sendDailyBrief() {
    setBriefStatus('sending')
    try {
      const res = await fetch('/api/telegram/daily-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      })
      setBriefStatus(res.ok ? 'sent' : 'error')
      setTimeout(() => setBriefStatus('idle'), 3000)
    } catch {
      setBriefStatus('error')
    }
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white">CRM</h1>
          <p className="text-accent-muted text-xs mt-0.5 font-mono">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
            {due.length > 0 && (
              <span className="ml-2 text-yellow-400">· {due.length} follow-up{due.length !== 1 ? 's' : ''} due</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={sendDailyBrief}
            disabled={briefStatus === 'sending' || contacts.length === 0}
            className={`
              px-3 py-1.5 text-xs rounded-lg border transition-all font-mono
              ${briefStatus === 'sent' ? 'text-green-400 border-green-400/30 bg-green-400/10' :
                briefStatus === 'error' ? 'text-red-400 border-red-400/30 bg-red-400/10' :
                'text-accent-muted border-border-default hover:text-white hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed'}
            `}
          >
            {briefStatus === 'sending' ? '...' :
             briefStatus === 'sent' ? '✓ Sent' :
             briefStatus === 'error' ? '✗ Failed' :
             '📱 Daily Brief'}
          </button>
          <button
            onClick={() => { setEditing(null); setFormOpen(true) }}
            className="px-3 py-1.5 text-xs bg-accent-sql/20 text-accent-sql border border-accent-sql/30 rounded-lg hover:bg-accent-sql/30 transition-all font-mono"
          >
            + Add Contact
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {(['all', ...Object.keys(STATUS_LABELS)] as (ContactStatus | 'all')[]).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`
              px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-all font-mono
              ${filter === s
                ? s === 'all'
                  ? 'bg-white/10 text-white border-white/20'
                  : STATUS_COLORS[s as ContactStatus]
                : 'text-accent-muted border-border-subtle hover:text-white'}
            `}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s as ContactStatus]}
            {s !== 'all' && (
              <span className="ml-1 opacity-60">
                {contacts.filter(c => c.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contact list */}
      {loading ? (
        <div className="flex justify-center py-20 text-accent-muted text-sm font-mono">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-accent-muted">
          <div className="text-4xl mb-3 opacity-30">👤</div>
          <p className="text-sm font-mono">
            {contacts.length === 0 ? 'No contacts yet — add your first one' : 'No contacts in this filter'}
          </p>
        </div>
      ) : null}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(contact => {
            const isDue = contact.followUpDate && contact.followUpDate <= new Date().toISOString().split('T')[0]
            const tStatus = telegramStatus[contact.id] || 'idle'
            return (
              <div
                key={contact.id}
                className="bg-bg-secondary border border-border-subtle rounded-xl p-4 hover:border-border-default transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">{contact.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${STATUS_COLORS[contact.status]}`}>
                        {STATUS_LABELS[contact.status]}
                      </span>
                      {isDue && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border font-mono text-yellow-400 bg-yellow-400/10 border-yellow-400/30">
                          Follow up!
                        </span>
                      )}
                    </div>
                    {(contact.company || contact.role) && (
                      <p className="text-xs text-accent-muted mt-0.5 font-mono">
                        {[contact.role, contact.company].filter(Boolean).join(' @ ')}
                      </p>
                    )}
                    {contact.notes && (
                      <p className="text-xs text-white/60 mt-1 line-clamp-2">{contact.notes}</p>
                    )}
                    {contact.followUpDate && (
                      <p className="text-xs text-accent-muted mt-1 font-mono">
                        Follow-up: {contact.followUpDate}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => sendReminder(contact)}
                      disabled={tStatus === 'sending'}
                      title="Send Telegram reminder"
                      className={`
                        px-2 py-1 text-xs rounded-lg border transition-all font-mono
                        ${tStatus === 'sent' ? 'text-green-400 border-green-400/30' :
                          tStatus === 'error' ? 'text-red-400 border-red-400/30' :
                          'text-accent-muted border-border-subtle hover:text-white hover:border-border-default'}
                      `}
                    >
                      {tStatus === 'sending' ? '...' : tStatus === 'sent' ? '✓' : tStatus === 'error' ? '✗' : '📱'}
                    </button>
                    <button
                      onClick={() => { setEditing(contact); setFormOpen(true) }}
                      className="px-2 py-1 text-xs text-accent-muted border border-border-subtle rounded-lg hover:text-white hover:border-border-default transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete ${contact.name}?`)) deleteContact(contact.id).catch(() => {}) }}
                      className="px-2 py-1 text-xs text-accent-muted border border-border-subtle rounded-lg hover:text-red-400 hover:border-red-400/30 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit form */}
      {formOpen && (
        <ContactForm
          initial={editing ?? EMPTY}
          onSave={async data => {
            if (editing) await updateContact(editing.id, data)
            else await addContact(data)
            setFormOpen(false)
            setEditing(null)
          }}
          onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
