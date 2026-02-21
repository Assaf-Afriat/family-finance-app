import { create } from 'zustand'

type DateFilter = 'this-month' | 'last-month' | 'this-quarter' | 'ytd' | 'last-year'

interface DashboardState {
  stats: DashboardStats | null
  monthlyTrends: MonthlyTrend[]
  categories: Category[]
  dateFilter: DateFilter
  isLoading: boolean
  setStats: (stats: DashboardStats | null) => void
  setMonthlyTrends: (trends: MonthlyTrend[]) => void
  setCategories: (categories: Category[]) => void
  setDateFilter: (filter: DateFilter) => void
  setLoading: (loading: boolean) => void
  fetchDashboardData: (userId: string) => Promise<void>
  fetchCategories: () => Promise<void>
  getDateRange: () => { startDate: Date; endDate: Date }
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  monthlyTrends: [],
  categories: [],
  dateFilter: 'this-month',
  isLoading: false,

  setStats: (stats) => set({ stats }),
  setMonthlyTrends: (trends) => set({ monthlyTrends: trends }),
  setCategories: (categories) => set({ categories }),
  setDateFilter: (filter) => set({ dateFilter: filter }),
  setLoading: (loading) => set({ isLoading: loading }),

  getDateRange: () => {
    const now = new Date()
    const filter = get().dateFilter
    let startDate: Date
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    switch (filter) {
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        break
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        break
      case 'this-quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterStart, 1)
        endDate = new Date(now.getFullYear(), quarterStart + 3, 0, 23, 59, 59)
        break
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'last-year':
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return { startDate, endDate }
  },

  fetchDashboardData: async (userId) => {
    set({ isLoading: true })
    try {
      if (window.electronAPI) {
        const { startDate, endDate } = get().getDateRange()
        
        const [stats, trends] = await Promise.all([
          window.electronAPI.getDashboardStats(
            userId,
            startDate.toISOString(),
            endDate.toISOString()
          ),
          window.electronAPI.getMonthlyTrends(userId, 6),
        ])
        
        set({ stats, monthlyTrends: trends })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchCategories: async () => {
    try {
      if (window.electronAPI) {
        const categories = await window.electronAPI.getCategories()
        set({ categories })
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  },
}))
