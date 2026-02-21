import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let prisma: PrismaClient | null = null

function getDatabasePath(): string {
  const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged
  
  if (isDev) {
    return path.join(process.cwd(), 'prisma', 'family-finance.db')
  }
  
  // In production, store in user's app data folder
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'family-finance.db')
  
  // Copy initial database if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    const sourcePath = path.join(process.resourcesPath, 'prisma', 'family-finance.db')
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, dbPath)
    }
  }
  
  return dbPath
}

export function getDatabase(): PrismaClient {
  if (!prisma) {
    const dbPath = getDatabasePath()
    const dbUrl = `file:${dbPath}`
    
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    })
  }
  return prisma
}

export async function closeDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}

// User operations
export async function getUsers() {
  const db = getDatabase()
  return db.user.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function getUser(id: string) {
  const db = getDatabase()
  return db.user.findUnique({ where: { id } })
}

export async function createUser(data: { name: string; avatar?: string }) {
  const db = getDatabase()
  return db.user.create({ data })
}

export async function updateUser(id: string, data: { name: string; avatar?: string }) {
  const db = getDatabase()
  return db.user.update({
    where: { id },
    data,
  })
}

export async function deleteUser(id: string) {
  const db = getDatabase()
  // Delete user's transactions first
  await db.transaction.deleteMany({ where: { userId: id } })
  // Delete user's budgets
  await db.budget.deleteMany({ where: { userId: id } })
  // Delete user's accounts
  await db.account.deleteMany({ where: { ownerId: id } })
  // Delete user
  return db.user.delete({ where: { id } })
}

// Account operations
export async function getAccounts(userId?: string) {
  const db = getDatabase()
  return db.account.findMany({
    where: userId ? { ownerId: userId } : undefined,
    include: { owner: true },
    orderBy: { name: 'asc' },
  })
}

export async function createAccount(data: {
  name: string
  type: string
  balance: number
  isJoint: boolean
  ownerId: string
}) {
  const db = getDatabase()
  return db.account.create({ data })
}

export async function updateAccountBalance(id: string, balance: number) {
  const db = getDatabase()
  return db.account.update({
    where: { id },
    data: { balance },
  })
}

export async function updateAccount(
  id: string,
  data: {
    name: string
    type: string
    balance: number
    isJoint: boolean
  }
) {
  const db = getDatabase()
  return db.account.update({
    where: { id },
    data,
    include: { owner: true },
  })
}

// Transaction operations
export async function getTransactions(filters?: {
  userId?: string
  accountId?: string
  startDate?: Date
  endDate?: Date
  type?: string
  category?: string
  limit?: number
}) {
  const db = getDatabase()
  const where: Record<string, unknown> = {}

  if (filters?.userId) where.userId = filters.userId
  if (filters?.accountId) where.accountId = filters.accountId
  if (filters?.type) where.type = filters.type
  if (filters?.category) where.category = filters.category
  if (filters?.startDate || filters?.endDate) {
    where.date = {}
    if (filters.startDate) (where.date as Record<string, Date>).gte = filters.startDate
    if (filters.endDate) (where.date as Record<string, Date>).lte = filters.endDate
  }

  return db.transaction.findMany({
    where,
    include: { account: true, user: true },
    orderBy: { date: 'desc' },
    take: filters?.limit,
  })
}

export async function createTransaction(data: {
  amount: number
  date: Date
  description: string
  category: string
  type: string
  ownership: string
  accountId: string
  userId: string
}) {
  const db = getDatabase()
  
  const transaction = await db.transaction.create({
    data,
    include: { account: true, user: true },
  })

  // Update account balance
  const balanceChange = data.type === 'Income' ? data.amount : -data.amount
  await db.account.update({
    where: { id: data.accountId },
    data: { balance: { increment: balanceChange } },
  })

  return transaction
}

export async function updateTransaction(
  id: string,
  data: {
    amount: number
    date: Date
    description: string
    category: string
    type: string
    ownership: string
    accountId: string
  }
) {
  const db = getDatabase()
  
  const oldTransaction = await db.transaction.findUnique({ where: { id } })
  if (!oldTransaction) throw new Error('Transaction not found')

  // Reverse old balance change
  const oldBalanceChange = oldTransaction.type === 'Income' ? -oldTransaction.amount : oldTransaction.amount
  await db.account.update({
    where: { id: oldTransaction.accountId },
    data: { balance: { increment: oldBalanceChange } },
  })

  // Update transaction
  const transaction = await db.transaction.update({
    where: { id },
    data,
    include: { account: true, user: true },
  })

  // Apply new balance change
  const newBalanceChange = data.type === 'Income' ? data.amount : -data.amount
  await db.account.update({
    where: { id: data.accountId },
    data: { balance: { increment: newBalanceChange } },
  })

  return transaction
}

export async function deleteTransaction(id: string) {
  const db = getDatabase()
  
  const transaction = await db.transaction.findUnique({ where: { id } })
  if (!transaction) throw new Error('Transaction not found')

  // Reverse the balance change
  const balanceChange = transaction.type === 'Income' ? -transaction.amount : transaction.amount
  await db.account.update({
    where: { id: transaction.accountId },
    data: { balance: { increment: balanceChange } },
  })

  return db.transaction.delete({ where: { id } })
}

// Budget operations
export async function getBudgets(userId: string, month?: number, year?: number) {
  const db = getDatabase()
  const now = new Date()
  
  return db.budget.findMany({
    where: {
      userId,
      month: month ?? now.getMonth() + 1,
      year: year ?? now.getFullYear(),
    },
    orderBy: { category: 'asc' },
  })
}

export async function createOrUpdateBudget(data: {
  category: string
  limit: number
  month: number
  year: number
  userId: string
}) {
  const db = getDatabase()
  
  return db.budget.upsert({
    where: {
      category_month_year_userId: {
        category: data.category,
        month: data.month,
        year: data.year,
        userId: data.userId,
      },
    },
    update: { limit: data.limit },
    create: data,
  })
}

// Category operations
export async function getCategories(type?: string) {
  const db = getDatabase()
  return db.category.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: 'asc' },
  })
}

// Dashboard aggregations
export async function getDashboardStats(userId: string, startDate: Date, endDate: Date) {
  const db = getDatabase()

  // Get all accounts for net worth
  const accounts = await db.account.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { isJoint: true },
      ],
    },
  })
  const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  // Get transactions for the period
  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      OR: [
        { userId },
        { ownership: 'Joint' },
      ],
    },
  })

  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0)

  // Get budgets and calculate spent
  const budgets = await getBudgets(userId, startDate.getMonth() + 1, startDate.getFullYear())
  const budgetWithSpent = budgets.map(budget => {
    const spent = transactions
      .filter(t => t.type === 'Expense' && t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0)
    return { ...budget, spent }
  })

  const totalBudgetLimit = budgetWithSpent.reduce((sum, b) => sum + b.limit, 0)
  const totalBudgetSpent = budgetWithSpent.reduce((sum, b) => sum + b.spent, 0)
  const remainingBudget = totalBudgetLimit - totalBudgetSpent

  // Expenses by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'Expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  return {
    netWorth,
    totalIncome,
    totalExpenses,
    remainingBudget,
    budgetWithSpent,
    expensesByCategory,
  }
}

export async function getMonthlyTrends(userId: string, months: number = 6) {
  const db = getDatabase()
  const trends: Array<{ month: string; income: number; expenses: number }> = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

    const transactions = await db.transaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        OR: [
          { userId },
          { ownership: 'Joint' },
        ],
      },
    })

    const income = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const monthName = startDate.toLocaleDateString('en-US', { month: 'short' })
    trends.push({ month: monthName, income, expenses })
  }

  return trends
}
