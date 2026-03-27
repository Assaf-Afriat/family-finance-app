import fs from 'fs'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDatabase } from '../../prisma/testDb'

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: () => path.resolve(process.cwd(), 'prisma'),
  },
}))

type DatabaseModule = typeof import('../../electron/database')

async function loadDatabaseModule(): Promise<DatabaseModule> {
  vi.resetModules()
  return import('../../electron/database')
}

describe('electron database integration', () => {
  let db: DatabaseModule
  let testDbPath: string

  beforeEach(async () => {
    testDbPath = path.resolve(
      process.cwd(),
      'prisma',
      `family-finance.test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`
    )
    process.env.FAMILY_FINANCE_DB_PATH = testDbPath
    await resetDatabase(testDbPath)
    db = await loadDatabaseModule()
  })

  afterEach(async () => {
    if (db) {
      await db.closeDatabase()
    }
    delete process.env.FAMILY_FINANCE_DB_PATH
    if (testDbPath) {
      await new Promise((resolve) => setTimeout(resolve, 25))
      fs.rmSync(testDbPath, { force: true })
      fs.rmSync(`${testDbPath}-journal`, { force: true })
    }
  })

  it('scopes transactions to the active profile plus joint records', async () => {
    const assafTransactions = await db.getTransactions({ userId: 'user-assaf' })
    const partnerTransactions = await db.getTransactions({ userId: 'user-partner' })

    const assafDescriptions = assafTransactions.map((tx) => tx.description)
    const partnerDescriptions = partnerTransactions.map((tx) => tx.description)

    expect(assafDescriptions).toContain('Monthly Salary')
    expect(assafDescriptions).toContain('Monthly Rent')
    expect(assafDescriptions).not.toContain('Partner Salary')
    expect(assafDescriptions).not.toContain('Partner Shopping')

    expect(partnerDescriptions).toContain('Partner Salary')
    expect(partnerDescriptions).toContain('Monthly Rent')
    expect(partnerDescriptions).not.toContain('Monthly Salary')
    expect(partnerDescriptions).not.toContain('Gas & Parking')
  })

  it('updates account balances across transaction create, update, and delete', async () => {
    const before = await db.getAccounts('user-assaf')
    const checkingBefore = before.find((account) => account.id === 'account-checking')
    expect(checkingBefore).toBeTruthy()

    const created = await db.createTransaction({
      amount: 100,
      date: new Date('2026-03-01T12:00:00.000Z'),
      description: 'Test Expense',
      category: 'Groceries',
      type: 'Expense',
      ownership: 'Personal',
      accountId: 'account-checking',
      userId: 'user-assaf',
    })

    let accounts = await db.getAccounts('user-assaf')
    expect(accounts.find((account) => account.id === 'account-checking')?.balance).toBe((checkingBefore?.balance || 0) - 100)

    await db.updateTransaction(created.id, {
      amount: 60,
      date: new Date('2026-03-01T12:00:00.000Z'),
      description: 'Updated Test Expense',
      category: 'Groceries',
      type: 'Expense',
      ownership: 'Personal',
      accountId: 'account-checking',
    })

    accounts = await db.getAccounts('user-assaf')
    expect(accounts.find((account) => account.id === 'account-checking')?.balance).toBe((checkingBefore?.balance || 0) - 60)

    await db.deleteTransaction(created.id)

    accounts = await db.getAccounts('user-assaf')
    expect(accounts.find((account) => account.id === 'account-checking')?.balance).toBe(checkingBefore?.balance)
  })

  it('creates paired transfer records and updates both balances once', async () => {
    const before = await db.getAccounts('user-assaf')
    const checkingBefore = before.find((account) => account.id === 'account-checking')!
    const savingsBefore = before.find((account) => account.id === 'account-savings')!

    const transfer = await db.createTransfer({
      amount: 500,
      date: new Date('2026-03-02T12:00:00.000Z'),
      description: 'Savings transfer',
      fromAccountId: 'account-checking',
      toAccountId: 'account-savings',
      userId: 'user-assaf',
    })

    const after = await db.getAccounts('user-assaf')
    expect(after.find((account) => account.id === 'account-checking')?.balance).toBe(checkingBefore.balance - 500)
    expect(after.find((account) => account.id === 'account-savings')?.balance).toBe(savingsBefore.balance + 500)
    expect(transfer.withdrawal.description).toBe('Savings transfer')
    expect(transfer.deposit.description).toBe('Savings transfer')
  })

  it('processes due recurring transactions once and advances next due date', async () => {
    const before = await db.getRecurringTransactions('user-assaf')
    const recurring = before.find((item) => item.id === 'recurring-assaf-gym')
    expect(recurring).toBeTruthy()

    const firstRun = await db.processRecurringTransactions('user-assaf')
    expect(firstRun).toHaveLength(1)
    expect(firstRun[0].description).toBe('Gym Membership')

    const updated = (await db.getRecurringTransactions('user-assaf')).find((item) => item.id === 'recurring-assaf-gym')
    expect(new Date(updated?.nextDueDate || 0).getTime()).toBeGreaterThan(new Date(recurring?.nextDueDate || 0).getTime())

    const secondRun = await db.processRecurringTransactions('user-assaf')
    expect(secondRun).toHaveLength(0)
  })

  it('handles one-time and recurring bills differently when marking paid', async () => {
    const oneTimeBill = await db.markBillPaid('bill-internet')
    expect(oneTimeBill.isPaid).toBe(true)
    expect(oneTimeBill.paidDate).not.toBeNull()

    const recurringBillBefore = (await db.getBills('user-assaf')).find((bill) => bill.id === 'bill-insurance')!
    const recurringBillAfter = await db.markBillPaid('bill-insurance')
    expect(recurringBillAfter.isPaid).toBe(false)
    expect(recurringBillAfter.paidDate).toBeNull()
    expect(new Date(recurringBillAfter.dueDate).getTime()).toBeGreaterThan(new Date(recurringBillBefore.dueDate).getTime())
  })

  it('backs up and restores the database state', async () => {
    const backupPath = `${testDbPath}.backup`

    await db.backupDatabase(backupPath)

    await db.createTransaction({
      amount: 75,
      date: new Date('2026-03-03T12:00:00.000Z'),
      description: 'Post-backup expense',
      category: 'Other',
      type: 'Expense',
      ownership: 'Personal',
      accountId: 'account-checking',
      userId: 'user-assaf',
    })

    expect((await db.getTransactions({ userId: 'user-assaf' })).some((tx) => tx.description === 'Post-backup expense')).toBe(true)

    await db.restoreDatabase(backupPath)

    expect((await db.getTransactions({ userId: 'user-assaf' })).some((tx) => tx.description === 'Post-backup expense')).toBe(false)
    fs.rmSync(backupPath, { force: true })
  })

  it('creates, updates, and deletes budgets while keeping dashboard data consistent', async () => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const created = await db.createOrUpdateBudget({
      category: 'Insurance',
      limit: 900,
      month,
      year,
      userId: 'user-assaf',
    })

    const updated = await db.createOrUpdateBudget({
      category: 'Insurance',
      limit: 1200,
      month,
      year,
      userId: 'user-assaf',
    })

    expect(updated.id).toBe(created.id)
    expect((await db.getBudgets('user-assaf', month, year)).find((budget) => budget.category === 'Insurance')?.limit).toBe(1200)

    const stats = await db.getDashboardStats(
      'user-assaf',
      new Date(now.getFullYear(), now.getMonth(), 1),
      new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    )
    expect(stats.budgetWithSpent.some((budget) => budget.category === 'Insurance' && budget.limit === 1200)).toBe(true)

    await db.deleteBudget(updated.id)
    expect((await db.getBudgets('user-assaf', month, year)).some((budget) => budget.category === 'Insurance')).toBe(false)
  })

  it('creates, updates, and deletes categories by type', async () => {
    const created = await db.createCategory({
      name: 'Pet Care',
      icon: 'Package',
      color: 'blue',
      type: 'Expense',
    })

    expect((await db.getCategories('Expense')).some((category) => category.name === 'Pet Care')).toBe(true)

    const updated = await db.updateCategory(created.id, {
      name: 'Vet Care',
      color: 'green',
    })
    expect(updated.name).toBe('Vet Care')
    expect(updated.color).toBe('green')

    await db.deleteCategory(created.id)
    expect((await db.getCategories('Expense')).some((category) => category.name === 'Vet Care')).toBe(false)
  })
})
