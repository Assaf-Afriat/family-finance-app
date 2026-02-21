import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  platform: process.platform,
  
  // Users
  getUsers: () => ipcRenderer.invoke('db:getUsers'),
  getUser: (id: string) => ipcRenderer.invoke('db:getUser', id),
  createUser: (data: { name: string; avatar?: string }) => 
    ipcRenderer.invoke('db:createUser', data),

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
  deleteTransaction: (id: string) => ipcRenderer.invoke('db:deleteTransaction', id),

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

  // Categories
  getCategories: (type?: string) => ipcRenderer.invoke('db:getCategories', type),

  // Dashboard
  getDashboardStats: (userId: string, startDate: string, endDate: string) => 
    ipcRenderer.invoke('db:getDashboardStats', userId, startDate, endDate),
  getMonthlyTrends: (userId: string, months?: number) => 
    ipcRenderer.invoke('db:getMonthlyTrends', userId, months),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
