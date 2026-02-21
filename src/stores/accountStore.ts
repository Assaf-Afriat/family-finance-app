import { create } from 'zustand'

interface AccountState {
  accounts: Account[]
  isLoading: boolean
  setAccounts: (accounts: Account[]) => void
  setLoading: (loading: boolean) => void
  fetchAccounts: (userId?: string) => Promise<void>
  createAccount: (data: {
    name: string
    type: string
    balance: number
    isJoint: boolean
    ownerId: string
  }) => Promise<Account>
  updateBalance: (id: string, balance: number) => Promise<void>
  updateAccount: (id: string, data: {
    name: string
    type: string
    balance: number
    isJoint: boolean
  }) => Promise<Account>
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  isLoading: false,

  setAccounts: (accounts) => set({ accounts }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchAccounts: async (userId) => {
    set({ isLoading: true })
    try {
      if (window.electronAPI) {
        const accounts = await window.electronAPI.getAccounts(userId)
        set({ accounts })
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  createAccount: async (data) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const account = await window.electronAPI.createAccount(data)
    set((state) => ({ accounts: [...state.accounts, account] }))
    return account
  },

  updateBalance: async (id, balance) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const updated = await window.electronAPI.updateAccountBalance(id, balance)
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? updated : a)),
    }))
  },

  updateAccount: async (id, data) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const updated = await window.electronAPI.updateAccount(id, data)
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? updated : a)),
    }))
    return updated
  },
}))
