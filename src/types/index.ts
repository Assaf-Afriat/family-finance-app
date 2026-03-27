export type AccountType = 'Checking' | 'Savings' | 'Credit' | 'Cash'
export type TransactionType = 'Income' | 'Expense' | 'Transfer'
export type Ownership = 'Personal' | 'Joint'
export type CategoryType = 'Income' | 'Expense'

export interface User {
  id: string
  name: string
  avatar: string | null
  createdAt: string
  updatedAt: string
}

export interface Account {
  id: string
  name: string
  type: AccountType | string
  balance: number
  ownerId: string
  isJoint: boolean
  createdAt: string
  updatedAt: string
  owner?: User
}

export interface Transaction {
  id: string
  amount: number
  date: string | Date
  description: string
  category: string
  type: TransactionType | string
  accountId: string
  userId: string
  ownership: Ownership | string
  createdAt?: string
  updatedAt?: string
  account?: Account
  user?: User
}

export interface Budget {
  id: string
  category: string
  limit: number
  spent?: number
  month: number
  year: number
  userId: string
  createdAt?: string
  updatedAt?: string
}

export interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  type: CategoryType | string
  createdAt: string
}

export interface RecurringTransaction {
  id: string
  amount: number
  description: string
  category: string
  type: TransactionType | string
  ownership: Ownership | string
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

export interface Bill {
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

export interface KPIData {
  netWorth: number
  totalIncome: number
  totalExpenses: number
  remainingBudget: number
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
}

export interface CategoryExpense {
  category: string
  amount: number
  color: string
}

export interface BudgetHealth {
  category: string
  limit: number
  spent: number
  percentage: number
}

export interface DashboardStats {
  netWorth: number
  totalIncome: number
  totalExpenses: number
  remainingBudget: number
  budgetWithSpent: Array<Budget & { spent: number }>
  expensesByCategory: Record<string, number>
}

export interface MonthlyTrend {
  month: string
  income: number
  expenses: number
}

export interface TransactionFilters {
  userId: string
  accountId?: string
  startDate?: string
  endDate?: string
  type?: string
  category?: string
  limit?: number
}
