import { create } from 'zustand'

interface BudgetState {
  budgets: Budget[]
  isLoading: boolean
  setBudgets: (budgets: Budget[]) => void
  setLoading: (loading: boolean) => void
  fetchBudgets: (userId: string, month?: number, year?: number) => Promise<void>
  createOrUpdateBudget: (data: {
    category: string
    limit: number
    month: number
    year: number
    userId: string
  }) => Promise<Budget>
  deleteBudget: (id: string) => Promise<void>
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],
  isLoading: false,

  setBudgets: (budgets) => set({ budgets }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchBudgets: async (userId, month, year) => {
    set({ isLoading: true })
    try {
      if (window.electronAPI) {
        const budgets = await window.electronAPI.getBudgets(userId, month, year)
        set({ budgets })
      }
    } catch (error) {
      console.error('Failed to fetch budgets:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  createOrUpdateBudget: async (data) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const budget = await window.electronAPI.createOrUpdateBudget(data)
    set((state) => {
      const existing = state.budgets.findIndex(
        (b) => b.category === data.category && b.month === data.month && b.year === data.year
      )
      if (existing >= 0) {
        const updated = [...state.budgets]
        updated[existing] = budget
        return { budgets: updated }
      }
      return { budgets: [...state.budgets, budget] }
    })
    return budget
  },

  deleteBudget: async (id: string) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    await window.electronAPI.deleteBudget(id)
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }))
  },
}))
