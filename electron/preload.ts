import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  platform: process.platform,
  
  // Users
  getUsers: () => ipcRenderer.invoke('db:getUsers'),
  getUser: (id: string) => ipcRenderer.invoke('db:getUser', id),
  createUser: (data: { name: string; avatar?: string }) => 
    ipcRenderer.invoke('db:createUser', data),
  updateUser: (id: string, data: { name: string; avatar?: string }) =>
    ipcRenderer.invoke('db:updateUser', id, data),
  deleteUser: (id: string) => ipcRenderer.invoke('db:deleteUser', id),

  // Accounts
  getAccounts: (userId?: string) => ipcRenderer.invoke('db:getAccounts', userId),
  createAccount: (data: {
    name: string
    type: string
    balance: number
    isJoint: boolean
    ownerId: string
  }) => ipcRenderer.invoke('db:createAccount', data),
  updateAccountBalance: (id: string, balance: number) => 
    ipcRenderer.invoke('db:updateAccountBalance', id, balance),
  updateAccount: (id: string, data: {
    name: string
    type: string
    balance: number
    isJoint: boolean
  }) => ipcRenderer.invoke('db:updateAccount', id, data),

  // Transactions
  getTransactions: (filters?: {
    userId?: string
    accountId?: string
    startDate?: string
    endDate?: string
    type?: string
    category?: string
    limit?: number
  }) => ipcRenderer.invoke('db:getTransactions', filters),
  createTransaction: (data: {
    amount: number
    date: string
    description: string
    category: string
    type: string
    ownership: string
    accountId: string
    userId: string
  }) => ipcRenderer.invoke('db:createTransaction', {
    ...data,
    date: new Date(data.date),
  }),
  updateTransaction: (id: string, data: {
    amount: number
    date: string
    description: string
    category: string
    type: string
    ownership: string
    accountId: string
  }) => ipcRenderer.invoke('db:updateTransaction', id, data),
  deleteTransaction: (id: string) => ipcRenderer.invoke('db:deleteTransaction', id),
  createTransfer: (data: {
    amount: number
    date: string
    description: string
    fromAccountId: string
    toAccountId: string
    userId: string
  }) => ipcRenderer.invoke('db:createTransfer', data),

  // Budgets
  getBudgets: (userId: string, month?: number, year?: number) => 
    ipcRenderer.invoke('db:getBudgets', userId, month, year),
  createOrUpdateBudget: (data: {
    category: string
    limit: number
    month: number
    year: number
    userId: string
  }) => ipcRenderer.invoke('db:createOrUpdateBudget', data),
  deleteBudget: (id: string) => ipcRenderer.invoke('db:deleteBudget', id),

  // Categories
  getCategories: (type?: string) => ipcRenderer.invoke('db:getCategories', type),

  // Recurring Transactions
  getRecurringTransactions: (userId?: string) => 
    ipcRenderer.invoke('db:getRecurringTransactions', userId),
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
  }) => ipcRenderer.invoke('db:createRecurringTransaction', data),
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
  }) => ipcRenderer.invoke('db:updateRecurringTransaction', id, data),
  deleteRecurringTransaction: (id: string) => 
    ipcRenderer.invoke('db:deleteRecurringTransaction', id),
  processRecurringTransactions: (userId: string) => 
    ipcRenderer.invoke('db:processRecurringTransactions', userId),

  // Dashboard
  getDashboardStats: (userId: string, startDate: string, endDate: string) => 
    ipcRenderer.invoke('db:getDashboardStats', userId, startDate, endDate),
  getMonthlyTrends: (userId: string, months?: number) => 
    ipcRenderer.invoke('db:getMonthlyTrends', userId, months),

  // Bills
  getBills: (userId: string) => ipcRenderer.invoke('db:getBills', userId),
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
  }) => ipcRenderer.invoke('db:createBill', data),
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
  }) => ipcRenderer.invoke('db:updateBill', id, data),
  deleteBill: (id: string) => ipcRenderer.invoke('db:deleteBill', id),
  markBillPaid: (id: string) => ipcRenderer.invoke('db:markBillPaid', id),
  getUpcomingBills: (userId: string, days?: number) => ipcRenderer.invoke('db:getUpcomingBills', userId, days),
  getOverdueBills: (userId: string) => ipcRenderer.invoke('db:getOverdueBills', userId),

  // Backup and Restore
  backupDatabase: () => ipcRenderer.invoke('db:backupDatabase'),
  restoreDatabase: () => ipcRenderer.invoke('db:restoreDatabase'),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
