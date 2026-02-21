import { create } from 'zustand'

interface TransactionFilters {
  userId?: string
  accountId?: string
  startDate?: string
  endDate?: string
  type?: string
  category?: string
  limit?: number
}

interface TransactionState {
  transactions: Transaction[]
  recentTransactions: Transaction[]
  isLoading: boolean
  filters: TransactionFilters
  setTransactions: (transactions: Transaction[]) => void
  setRecentTransactions: (transactions: Transaction[]) => void
  setLoading: (loading: boolean) => void
  setFilters: (filters: TransactionFilters) => void
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>
  fetchRecentTransactions: (limit?: number) => Promise<void>
  createTransaction: (data: {
    amount: number
    date: string
    description: string
    category: string
    type: string
    ownership: string
    accountId: string
    userId: string
  }) => Promise<Transaction>
  deleteTransaction: (id: string) => Promise<void>
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  recentTransactions: [],
  isLoading: false,
  filters: {},

  setTransactions: (transactions) => set({ transactions }),
  setRecentTransactions: (transactions) => set({ recentTransactions: transactions }),
  setLoading: (loading) => set({ isLoading: loading }),
  setFilters: (filters) => set({ filters }),

  fetchTransactions: async (filters) => {
    set({ isLoading: true })
    try {
      if (window.electronAPI) {
        const transactions = await window.electronAPI.getTransactions(filters || get().filters)
        set({ transactions })
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchRecentTransactions: async (limit = 5) => {
    try {
      if (window.electronAPI) {
        const transactions = await window.electronAPI.getTransactions({ limit })
        set({ recentTransactions: transactions })
      }
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error)
    }
  },

  createTransaction: async (data) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const transaction = await window.electronAPI.createTransaction(data)
    set((state) => ({
      transactions: [transaction, ...state.transactions],
      recentTransactions: [transaction, ...state.recentTransactions].slice(0, 5),
    }))
    return transaction
  },

  deleteTransaction: async (id) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    await window.electronAPI.deleteTransaction(id)
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
      recentTransactions: state.recentTransactions.filter((t) => t.id !== id),
    }))
  },
}))
