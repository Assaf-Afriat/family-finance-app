import { create } from 'zustand'

interface BillState {
  bills: Bill[]
  upcomingBills: Bill[]
  overdueBills: Bill[]
  isLoading: boolean
  setBills: (bills: Bill[]) => void
  setLoading: (loading: boolean) => void
  fetchBills: (userId: string) => Promise<void>
  fetchUpcomingBills: (userId: string, days?: number) => Promise<void>
  fetchOverdueBills: (userId: string) => Promise<void>
  createBill: (data: {
    name: string
    amount: number
    dueDate: string
    category: string
    isRecurring: boolean
    frequency?: string
    reminder: number
    notes?: string
    userId: string
  }) => Promise<Bill>
  updateBill: (id: string, data: {
    name?: string
    amount?: number
    dueDate?: string
    category?: string
    isPaid?: boolean
    paidDate?: string | null
    isRecurring?: boolean
    frequency?: string
    reminder?: number
    notes?: string
  }) => Promise<Bill>
  deleteBill: (id: string) => Promise<void>
  markBillPaid: (id: string) => Promise<Bill>
}

export const useBillStore = create<BillState>((set, get) => ({
  bills: [],
  upcomingBills: [],
  overdueBills: [],
  isLoading: false,

  setBills: (bills) => set({ bills }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchBills: async (userId) => {
    set({ isLoading: true })
    try {
      if (window.electronAPI) {
        const bills = await window.electronAPI.getBills(userId)
        set({ bills })
      }
    } catch (error) {
      console.error('Failed to fetch bills:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUpcomingBills: async (userId, days = 7) => {
    try {
      if (window.electronAPI) {
        const upcomingBills = await window.electronAPI.getUpcomingBills(userId, days)
        set({ upcomingBills })
      }
    } catch (error) {
      console.error('Failed to fetch upcoming bills:', error)
    }
  },

  fetchOverdueBills: async (userId) => {
    try {
      if (window.electronAPI) {
        const overdueBills = await window.electronAPI.getOverdueBills(userId)
        set({ overdueBills })
      }
    } catch (error) {
      console.error('Failed to fetch overdue bills:', error)
    }
  },

  createBill: async (data) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const bill = await window.electronAPI.createBill(data)
    set((state) => ({ bills: [...state.bills, bill] }))
    return bill
  },

  updateBill: async (id, data) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const bill = await window.electronAPI.updateBill(id, data)
    set((state) => ({
      bills: state.bills.map((b) => (b.id === id ? bill : b)),
    }))
    return bill
  },

  deleteBill: async (id) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    await window.electronAPI.deleteBill(id)
    set((state) => ({
      bills: state.bills.filter((b) => b.id !== id),
    }))
  },

  markBillPaid: async (id) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const bill = await window.electronAPI.markBillPaid(id)
    set((state) => ({
      bills: state.bills.map((b) => (b.id === id ? bill : b)),
    }))
    return bill
  },
}))
