/// <reference types="vite/client" />

import type {
  Account,
  Bill,
  Budget,
  Category,
  DashboardStats,
  MonthlyTrend,
  RecurringTransaction,
  Transaction,
  TransactionFilters,
  User,
} from '@/types'

interface ElectronAPI {
  platform: string
  getUsers: () => Promise<User[]>
  getUser: (id: string) => Promise<User | null>
  createUser: (data: { name: string; avatar?: string }) => Promise<User>
  updateUser: (id: string, data: { name: string; avatar?: string }) => Promise<User>
  deleteUser: (id: string) => Promise<User>
  getAccounts: (userId: string) => Promise<Account[]>
  createAccount: (data: {
    name: string
    type: string
    balance: number
    isJoint: boolean
    ownerId: string
  }) => Promise<Account>
  updateAccountBalance: (id: string, balance: number) => Promise<Account>
  updateAccount: (id: string, data: {
    name: string
    type: string
    balance: number
    isJoint: boolean
  }) => Promise<Account>
  getTransactions: (filters: TransactionFilters) => Promise<Transaction[]>
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
  updateTransaction: (id: string, data: {
    amount: number
    date: string
    description: string
    category: string
    type: string
    ownership: string
    accountId: string
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
  getBudgets: (userId: string, month?: number, year?: number) => Promise<Budget[]>
  createOrUpdateBudget: (data: {
    category: string
    limit: number
    month: number
    year: number
    userId: string
  }) => Promise<Budget>
  deleteBudget: (id: string) => Promise<Budget>
  getCategories: (type?: string) => Promise<Category[]>
  createCategory: (data: { name: string; icon?: string; color?: string; type: string }) => Promise<Category>
  updateCategory: (id: string, data: { name?: string; icon?: string; color?: string; type?: string }) => Promise<Category>
  deleteCategory: (id: string) => Promise<Category>
  getRecurringTransactions: (userId: string) => Promise<RecurringTransaction[]>
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
  getDashboardStats: (userId: string, startDate: string, endDate: string) => Promise<DashboardStats>
  getMonthlyTrends: (userId: string, months?: number) => Promise<MonthlyTrend[]>
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
  exportTransactionsCSV: (userId: string, targetPath?: string) => Promise<{
    success: boolean
    path?: string
    error?: string
    canceled?: boolean
    rowCount?: number
  }>
  backupDatabase: (targetPath?: string) => Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>
  restoreDatabase: (sourcePath?: string) => Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }

  type User = import('@/types').User
  type Account = import('@/types').Account
  type Transaction = import('@/types').Transaction
  type Budget = import('@/types').Budget
  type Category = import('@/types').Category
  type Bill = import('@/types').Bill
  type RecurringTransaction = import('@/types').RecurringTransaction
  type DashboardStats = import('@/types').DashboardStats
  type MonthlyTrend = import('@/types').MonthlyTrend
}

export {}
