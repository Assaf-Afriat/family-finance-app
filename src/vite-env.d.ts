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
  createTransfer: (data: {
    amount: number
    date: string
    description: string
    fromAccountId: string
    toAccountId: string
    userId: string
  }) => Promise<{ withdrawal: Transaction; deposit: Transaction }>

  // Budgets
  getBudgets: (userId: string, month?: number, year?: number) => Promise<Budget[]>
  createOrUpdateBudget: (data: {
    category: string
    limit: number
    month: number
    year: number
    userId: string
  }) => Promise<Budget>
  deleteBudget: (id: string) => Promise<Budget>
  
  // User Management
  updateUser: (id: string, data: { name: string; avatar?: string }) => Promise<User>
  deleteUser: (id: string) => Promise<User>
  
  // Account Management
  updateAccount: (id: string, data: {
    name: string
    type: string
    balance: number
    isJoint: boolean
  }) => Promise<Account>
  
  // Transaction Management
  updateTransaction: (id: string, data: {
    amount: number
    date: string
    description: string
    category: string
    type: string
    ownership: string
    accountId: string
  }) => Promise<Transaction>

  // Categories
  getCategories: (type?: string) => Promise<Category[]>

  // Recurring Transactions
  getRecurringTransactions: (userId?: string) => Promise<RecurringTransaction[]>
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
  deleteRecurringTransaction: (id: string) => Promise<RecurringTransaction>
  processRecurringTransactions: (userId: string) => Promise<Transaction[]>

  // Dashboard
  getDashboardStats: (userId: string, startDate: string, endDate: string) => Promise<DashboardStats>
  getMonthlyTrends: (userId: string, months?: number) => Promise<MonthlyTrend[]>

  // Bills
  getBills: (userId: string) => Promise<Bill[]>
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
  deleteBill: (id: string) => Promise<Bill>
  markBillPaid: (id: string) => Promise<Bill>
  getUpcomingBills: (userId: string, days?: number) => Promise<Bill[]>
  getOverdueBills: (userId: string) => Promise<Bill[]>

  // Backup and Restore
  backupDatabase: () => Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>
  restoreDatabase: () => Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>
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
  icon?: string | null
  color?: string | null
  type: string
  createdAt: string
}

interface Bill {
  id: string
  name: string
  amount: number
  dueDate: string
  category: string
  isPaid: boolean
  paidDate?: string | null
  isRecurring: boolean
  frequency?: string | null
  reminder: number
  notes?: string | null
  userId: string
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

interface RecurringTransaction {
  id: string
  amount: number
  description: string
  category: string
  type: string
  ownership: string
  frequency: string
  startDate: string
  endDate: string | null
  nextDueDate: string
  isActive: boolean
  lastProcessed: string | null
  accountId: string
  userId: string
  createdAt: string
  updatedAt: string
  account?: Account
  user?: User
}
