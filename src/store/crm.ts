import { create } from 'zustand'

export type ContactStatus =
  | 'networking'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'closed'

export interface Contact {
  id: string
  name: string
  company: string
  role: string
  email: string
  phone: string
  status: ContactStatus
  notes: string
  followUpDate: string
  lastContacted: string
  createdAt: string
}

interface CRMState {
  contacts: Contact[]
  loading: boolean
  fetchContacts: () => Promise<void>
  addContact: (c: Omit<Contact, 'id' | 'createdAt'>) => Promise<Contact>
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  getDueFollowUps: () => Contact[]
}

export const useCRMStore = create<CRMState>()((set, get) => ({
  contacts: [],
  loading: false,

  fetchContacts: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/crm/contacts')
      const contacts = await res.json()
      set({ contacts: Array.isArray(contacts) ? contacts : [], loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addContact: async (c) => {
    const res = await fetch('/api/crm/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    })
    const contact = await res.json()
    set(state => ({ contacts: [...state.contacts, contact] }))
    return contact
  },

  updateContact: async (id, updates) => {
    await fetch(`/api/crm/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    set(state => ({
      contacts: state.contacts.map(c => c.id === id ? { ...c, ...updates } : c),
    }))
  },

  deleteContact: async (id) => {
    await fetch(`/api/crm/contacts/${id}`, { method: 'DELETE' })
    set(state => ({ contacts: state.contacts.filter(c => c.id !== id) }))
  },

  getDueFollowUps: () => {
    const today = new Date().toISOString().split('T')[0]
    return get().contacts.filter(c => c.followUpDate && c.followUpDate <= today)
  },
}))
