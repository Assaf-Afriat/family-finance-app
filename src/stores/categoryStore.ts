import { create } from 'zustand'

interface CategoryState {
  categories: Category[]
  isLoading: boolean
  setCategories: (categories: Category[]) => void
  setLoading: (loading: boolean) => void
  fetchCategories: () => Promise<void>
  createCategory: (data: { name: string; icon?: string; color?: string; type: string }) => Promise<Category>
  updateCategory: (id: string, data: { name?: string; icon?: string; color?: string; type?: string }) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>
}

const DEFAULT_EXPENSE_CATEGORIES = [
  'Housing', 'Groceries', 'Transportation', 'Utilities', 'Entertainment',
  'Healthcare', 'Dining Out', 'Shopping', 'Education', 'Insurance',
  'Personal Care', 'Subscriptions', 'Travel', 'Gifts', 'Other'
]

const DEFAULT_INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investments', 'Rental Income', 'Business',
  'Bonus', 'Gifts', 'Refunds', 'Other'
]

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,

  setCategories: (categories) => set({ categories }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchCategories: async () => {
    set({ isLoading: true })
    try {
      if (window.electronAPI) {
        const categories = await window.electronAPI.getCategories()
        set({ categories })
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  createCategory: async (data) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const category = await window.electronAPI.createCategory(data)
    set((state) => ({ categories: [...state.categories, category] }))
    return category
  },

  updateCategory: async (id, data) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const category = await window.electronAPI.updateCategory(id, data)
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? category : c)),
    }))
    return category
  },

  deleteCategory: async (id) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    await window.electronAPI.deleteCategory(id)
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }))
  },
}))

export function getCategoriesByType(categories: Category[], type: 'Income' | 'Expense'): string[] {
  const customCategories = categories
    .filter((c) => c.type === type)
    .map((c) => c.name)
  
  const defaults = type === 'Expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES
  
  return [...new Set([...customCategories, ...defaults])]
}

export { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES }
