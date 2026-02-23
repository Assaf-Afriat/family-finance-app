import { create } from 'zustand'

interface RecurringTransactionState {
  recurringTransactions: RecurringTransaction[]
  isLoading: boolean
  setRecurringTransactions: (transactions: RecurringTransaction[]) => void
  setLoading: (loading: boolean) => void
  fetchRecurringTransactions: (userId?: string) => Promise<void>
  createRecurringTransaction: (data: {
    amount: number
    description: string
    category: string
    type: string
    ownership: string
    frequency: string
    startDate: string
    endDate?: string | null
    accountId: string
    userId: string
  }) => Promise<RecurringTransaction>
  updateRecurringTransaction: (id: string, data: {
    amount: number
    description: string
    category: string
    type: string
    ownership: string
    frequency: string
    startDate: string
    endDate?: string | null
    isActive: boolean
    accountId: string
  }) => Promise<RecurringTransaction>
  deleteRecurringTransaction: (id: string) => Promise<void>
  processRecurringTransactions: (userId: string) => Promise<Transaction[]>
}

export const useRecurringStore = create<RecurringTransactionState>((set) => ({
  recurringTransactions: [],
  isLoading: false,

  setRecurringTransactions: (recurringTransactions) => set({ recurringTransactions }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchRecurringTransactions: async (userId) => {
    set({ isLoading: true })
    try {
      if (window.electronAPI) {
        const recurringTransactions = await window.electronAPI.getRecurringTransactions(userId)
        set({ recurringTransactions })
      }
    } catch (error) {
      console.error('Failed to fetch recurring transactions:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  createRecurringTransaction: async (data) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const recurring = await window.electronAPI.createRecurringTransaction(data)
    set((state) => ({
      recurringTransactions: [...state.recurringTransactions, recurring],
    }))
    return recurring
  },

  updateRecurringTransaction: async (id, data) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const recurring = await window.electronAPI.updateRecurringTransaction(id, data)
    set((state) => ({
      recurringTransactions: state.recurringTransactions.map((r) =>
        r.id === id ? recurring : r
      ),
    }))
    return recurring
  },

  deleteRecurringTransaction: async (id) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    await window.electronAPI.deleteRecurringTransaction(id)
    set((state) => ({
      recurringTransactions: state.recurringTransactions.filter((r) => r.id !== id),
    }))
  },

  processRecurringTransactions: async (userId) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const transactions = await window.electronAPI.processRecurringTransactions(userId)
    return transactions
  },
}))
