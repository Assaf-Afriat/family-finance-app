import { create } from 'zustand'
import type { Transaction, TransactionFilters } from '@/types'
import { useUserStore } from '@/stores/userStore'

interface TransactionState {
  transactions: Transaction[]
  recentTransactions: Transaction[]
  isLoading: boolean
  filters: TransactionFilters
  setTransactions: (transactions: Transaction[]) => void
  setRecentTransactions: (transactions: Transaction[]) => void
  setLoading: (loading: boolean) => void
  setFilters: (filters: Partial<TransactionFilters>) => void
  fetchTransactions: (filters?: Partial<TransactionFilters>) => Promise<void>
  fetchRecentTransactions: (userId?: string, limit?: number) => Promise<void>
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
  updateTransaction: (id: string, data: {
    amount: number
    date: string
    description: string
    category: string
    type: string
    ownership: string
    accountId: string
  }) => Promise<Transaction>
  deleteTransaction: (id: string) => Promise<void>
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  recentTransactions: [],
  isLoading: false,
  filters: { userId: '' },

  setTransactions: (transactions) => set({ transactions }),
  setRecentTransactions: (transactions) => set({ recentTransactions: transactions }),
  setLoading: (loading) => set({ isLoading: loading }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  fetchTransactions: async (filters) => {
    set({ isLoading: true })
    try {
      const currentUserId = useUserStore.getState().currentUser?.id
      if (window.electronAPI) {
        const nextFilters = {
          ...get().filters,
          ...filters,
          userId: filters?.userId ?? (get().filters.userId || currentUserId || ''),
        }
        if (!nextFilters.userId) {
          throw new Error('User ID is required to fetch transactions')
        }
        const transactions = await window.electronAPI.getTransactions(nextFilters)
        set({ transactions, filters: nextFilters })
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchRecentTransactions: async (userId, limit = 5) => {
    try {
      const scopedUserId = userId ?? useUserStore.getState().currentUser?.id
      if (window.electronAPI && scopedUserId) {
        const transactions = await window.electronAPI.getTransactions({ userId: scopedUserId, limit })
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

  updateTransaction: async (id, data) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const transaction = await window.electronAPI.updateTransaction(id, data)
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? transaction : t)),
      recentTransactions: state.recentTransactions.map((t) => (t.id === id ? transaction : t)),
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
