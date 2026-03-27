import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let prisma: PrismaClient | null = null

function getDatabasePath(): string {
  if (process.env.FAMILY_FINANCE_DB_PATH) {
    return path.resolve(process.env.FAMILY_FINANCE_DB_PATH)
  }

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

export function getDatabasePathExport(): string {
  return getDatabasePath()
}

export async function backupDatabase(targetPath: string): Promise<void> {
  const dbPath = getDatabasePath()
  
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
  
  fs.copyFileSync(dbPath, targetPath)
  
  getDatabase()
}

export async function restoreDatabase(sourcePath: string): Promise<void> {
  const dbPath = getDatabasePath()
  
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
  
  const backupPath = dbPath + '.backup-' + Date.now()
  fs.copyFileSync(dbPath, backupPath)
  
  fs.copyFileSync(sourcePath, dbPath)
  
  getDatabase()
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
export async function getAccounts(userId: string) {
  const db = getDatabase()
  return db.account.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { isJoint: true },
      ],
    },
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
export async function getTransactions(filters: {
  userId: string
  accountId?: string
  startDate?: Date
  endDate?: Date
  type?: string
  category?: string
  limit?: number
}) {
  const db = getDatabase()
  const where: Record<string, unknown> = {}

  where.OR = [
    { userId: filters.userId },
    { ownership: 'Joint' },
  ]

  if (filters.accountId) where.accountId = filters.accountId
  if (filters.type) where.type = filters.type
  if (filters.category) where.category = filters.category
  if (filters.startDate || filters.endDate) {
    where.date = {}
    if (filters.startDate) (where.date as Record<string, Date>).gte = filters.startDate
    if (filters.endDate) (where.date as Record<string, Date>).lte = filters.endDate
  }

  return db.transaction.findMany({
    where,
    include: { account: true, user: true },
    orderBy: { date: 'desc' },
    take: filters.limit,
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

export async function createTransfer(data: {
  amount: number
  date: Date
  description: string
  fromAccountId: string
  toAccountId: string
  userId: string
}) {
  const db = getDatabase()
  
  // Create withdrawal from source account
  const withdrawal = await db.transaction.create({
    data: {
      amount: data.amount,
      date: data.date,
      description: data.description || 'Transfer',
      category: 'Transfer',
      type: 'Expense',
      ownership: 'Personal',
      accountId: data.fromAccountId,
      userId: data.userId,
    },
    include: { account: true, user: true },
  })

  // Create deposit to destination account
  const deposit = await db.transaction.create({
    data: {
      amount: data.amount,
      date: data.date,
      description: data.description || 'Transfer',
      category: 'Transfer',
      type: 'Income',
      ownership: 'Personal',
      accountId: data.toAccountId,
      userId: data.userId,
    },
    include: { account: true, user: true },
  })

  // Update account balances
  await db.account.update({
    where: { id: data.fromAccountId },
    data: { balance: { decrement: data.amount } },
  })

  await db.account.update({
    where: { id: data.toAccountId },
    data: { balance: { increment: data.amount } },
  })

  return { withdrawal, deposit }
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

export async function deleteBudget(id: string) {
  const db = getDatabase()
  return db.budget.delete({ where: { id } })
}

// Category operations
export async function getCategories(type?: string) {
  const db = getDatabase()
  return db.category.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: 'asc' },
  })
}

export async function createCategory(data: {
  name: string
  icon?: string
  color?: string
  type: string
}) {
  const db = getDatabase()
  return db.category.create({ data })
}

export async function updateCategory(id: string, data: {
  name?: string
  icon?: string
  color?: string
  type?: string
}) {
  const db = getDatabase()
  return db.category.update({
    where: { id },
    data,
  })
}

export async function deleteCategory(id: string) {
  const db = getDatabase()
  return db.category.delete({ where: { id } })
}

// Recurring Transaction operations
export async function getRecurringTransactions(userId?: string) {
  const db = getDatabase()
  return db.recurringTransaction.findMany({
    where: userId ? { userId } : undefined,
    include: { account: true, user: true },
    orderBy: { nextDueDate: 'asc' },
  })
}

export async function createRecurringTransaction(data: {
  amount: number
  description: string
  category: string
  type: string
  ownership: string
  frequency: string
  startDate: Date
  endDate?: Date | null
  accountId: string
  userId: string
}) {
  const db = getDatabase()
  
  return db.recurringTransaction.create({
    data: {
      ...data,
      nextDueDate: data.startDate,
    },
    include: { account: true, user: true },
  })
}

export async function updateRecurringTransaction(
  id: string,
  data: {
    amount: number
    description: string
    category: string
    type: string
    ownership: string
    frequency: string
    startDate: Date
    endDate?: Date | null
    isActive: boolean
    accountId: string
  }
) {
  const db = getDatabase()
  return db.recurringTransaction.update({
    where: { id },
    data,
    include: { account: true, user: true },
  })
}

export async function deleteRecurringTransaction(id: string) {
  const db = getDatabase()
  return db.recurringTransaction.delete({ where: { id } })
}

export async function processRecurringTransactions(userId: string) {
  const db = getDatabase()
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  const dueTransactions = await db.recurringTransaction.findMany({
    where: {
      userId,
      isActive: true,
      nextDueDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
  })

  const createdTransactions = []

  for (const recurring of dueTransactions) {
    const transaction = await createTransaction({
      amount: recurring.amount,
      date: recurring.nextDueDate,
      description: recurring.description,
      category: recurring.category,
      type: recurring.type,
      ownership: recurring.ownership,
      accountId: recurring.accountId,
      userId: recurring.userId,
    })

    createdTransactions.push(transaction)

    const nextDate = calculateNextDueDate(recurring.nextDueDate, recurring.frequency)
    
    const shouldDeactivate = recurring.endDate && nextDate > recurring.endDate

    await db.recurringTransaction.update({
      where: { id: recurring.id },
      data: {
        nextDueDate: nextDate,
        lastProcessed: now,
        isActive: !shouldDeactivate,
      },
    })
  }

  return createdTransactions
}

function calculateNextDueDate(currentDate: Date, frequency: string): Date {
  const next = new Date(currentDate)
  
  switch (frequency) {
    case 'Daily':
      next.setDate(next.getDate() + 1)
      break
    case 'Weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'Monthly':
      next.setMonth(next.getMonth() + 1)
      break
    case 'Yearly':
      next.setFullYear(next.getFullYear() + 1)
      break
  }
  
  return next
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

// Bill operations
export async function getBills(userId: string) {
  const db = getDatabase()
  return db.bill.findMany({
    where: { userId },
    orderBy: { dueDate: 'asc' },
  })
}

export async function createBill(data: {
  name: string
  amount: number
  dueDate: Date
  category: string
  isRecurring: boolean
  frequency?: string
  reminder: number
  notes?: string
  userId: string
}) {
  const db = getDatabase()
  return db.bill.create({ data })
}

export async function updateBill(id: string, data: {
  name?: string
  amount?: number
  dueDate?: Date
  category?: string
  isPaid?: boolean
  paidDate?: Date | null
  isRecurring?: boolean
  frequency?: string
  reminder?: number
  notes?: string
}) {
  const db = getDatabase()
  return db.bill.update({
    where: { id },
    data,
  })
}

export async function deleteBill(id: string) {
  const db = getDatabase()
  return db.bill.delete({ where: { id } })
}

export async function markBillPaid(id: string, paidDate: Date = new Date()) {
  const db = getDatabase()
  const bill = await db.bill.findUnique({ where: { id } })
  
  if (!bill) throw new Error('Bill not found')
  
  if (bill.isRecurring && bill.frequency) {
    const nextDueDate = new Date(bill.dueDate)
    switch (bill.frequency) {
      case 'Monthly':
        nextDueDate.setMonth(nextDueDate.getMonth() + 1)
        break
      case 'Quarterly':
        nextDueDate.setMonth(nextDueDate.getMonth() + 3)
        break
      case 'Yearly':
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
        break
    }
    
    return db.bill.update({
      where: { id },
      data: {
        isPaid: false,
        paidDate: null,
        dueDate: nextDueDate,
      },
    })
  }
  
  return db.bill.update({
    where: { id },
    data: { isPaid: true, paidDate },
  })
}

export async function getUpcomingBills(userId: string, days: number = 7) {
  const db = getDatabase()
  const now = new Date()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)
  
  return db.bill.findMany({
    where: {
      userId,
      isPaid: false,
      dueDate: {
        gte: now,
        lte: futureDate,
      },
    },
    orderBy: { dueDate: 'asc' },
  })
}

export async function getOverdueBills(userId: string) {
  const db = getDatabase()
  const now = new Date()
  
  return db.bill.findMany({
    where: {
      userId,
      isPaid: false,
      dueDate: { lt: now },
    },
    orderBy: { dueDate: 'asc' },
  })
}
