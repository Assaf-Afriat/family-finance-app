export type AccountType = 'Checking' | 'Savings' | 'Credit' | 'Cash'
export type TransactionType = 'Income' | 'Expense' | 'Transfer'
export type Ownership = 'Personal' | 'Joint'

export interface User {
  id: string
  name: string
  avatar: string | null
  createdAt: string
  updatedAt?: string
}

export interface Account {
  id: string
  name: string
  type: string
  balance: number
  ownerId: string
  isJoint: boolean
  createdAt: string
  updatedAt?: string
  owner?: User
}

export interface Transaction {
  id: string
  amount: number
  date: Date | string
  description: string
  category: string
  type: string
  accountId: string
  userId: string
  ownership: string
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
  type: string
  createdAt: string
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
