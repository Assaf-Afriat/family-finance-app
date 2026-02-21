/// <reference types="vite/client" />

interface ElectronAPI {
  platform: string
  
  // Users
  getUsers: () => Promise<User[]>
  getUser: (id: string) => Promise<User | null>
  createUser: (data: { name: string; avatar?: string }) => Promise<User>

  // Accounts
  getAccounts: (userId?: string) => Promise<Account[]>
  createAccount: (data: {
    name: string
    type: string
    balance: number
    isJoint: boolean
    ownerId: string
  }) => Promise<Account>
  updateAccountBalance: (id: string, balance: number) => Promise<Account>

  // Transactions
  getTransactions: (filters?: {
    userId?: string
    accountId?: string
    startDate?: string
    endDate?: string
    type?: string
    category?: string
    limit?: number
  }) => Promise<Transaction[]>
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
  deleteTransaction: (id: string) => Promise<Transaction>

  // Budgets
  getBudgets: (userId: string, month?: number, year?: number) => Promise<Budget[]>
  createOrUpdateBudget: (data: {
    category: string
    limit: number
    month: number
    year: number
    userId: string
  }) => Promise<Budget>

  // Categories
  getCategories: (type?: string) => Promise<Category[]>

  // Dashboard
  getDashboardStats: (userId: string, startDate: string, endDate: string) => Promise<DashboardStats>
  getMonthlyTrends: (userId: string, months?: number) => Promise<MonthlyTrend[]>
}

interface Window {
  electronAPI: ElectronAPI
}

interface User {
  id: string
  name: string
  avatar: string | null
  createdAt: string
  updatedAt: string
}

interface Account {
  id: string
  name: string
  type: string
  balance: number
  isJoint: boolean
  ownerId: string
  createdAt: string
  updatedAt: string
  owner?: User
}

interface Transaction {
  id: string
  amount: number
  date: string
  description: string
  category: string
  type: string
  ownership: string
  accountId: string
  userId: string
  createdAt: string
  updatedAt: string
  account?: Account
  user?: User
}

interface Budget {
  id: string
  category: string
  limit: number
  month: number
  year: number
  userId: string
  spent?: number
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  type: string
  createdAt: string
}

interface DashboardStats {
  netWorth: number
  totalIncome: number
  totalExpenses: number
  remainingBudget: number
  budgetWithSpent: Array<Budget & { spent: number }>
  expensesByCategory: Record<string, number>
}

interface MonthlyTrend {
  month: string
  income: number
  expenses: number
}
