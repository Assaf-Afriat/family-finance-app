import { describe, expect, it } from 'vitest'
import { parseCSV } from '../../src/lib/csvImport'
import { buildTransactionsCSV } from '../../src/lib/csvExport'
import type { Transaction } from '../../src/types'

describe('csv helpers', () => {
  it('parses valid CSV rows and skips invalid rows', () => {
    const result = parseCSV([
      'Date,Description,Category,Type,Ownership,Amount',
      '2026-03-01,Salary,Salary,Income,Personal,1000',
      '2026-03-02,Groceries,Groceries,Expense,Joint,250',
      'not-a-date,Bad,Other,Expense,Personal,42',
    ].join('\n'))

    expect(result.success).toBe(true)
    expect(result.transactions).toHaveLength(2)
    expect(result.skipped).toBe(1)
  })

  it('builds a CSV document for transaction export', () => {
    const csv = buildTransactionsCSV([
      {
        id: 'tx-1',
        amount: 120,
        date: '2026-03-02T00:00:00.000Z',
        description: 'Internet Bill',
        category: 'Utilities',
        type: 'Expense',
        accountId: 'account-checking',
        userId: 'user-assaf',
        ownership: 'Joint',
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      } satisfies Transaction,
    ])

    expect(csv).toContain('Date,Description,Category,Type,Ownership,Amount')
    expect(csv).toContain('"Internet Bill"')
    expect(csv).toContain('"Joint"')
  })

  it('parses quoted fields and alternate date formats', () => {
    const result = parseCSV([
      'Date,Description,Category,Type,Ownership,Amount',
      '"17/03/2026","Dinner, friends","Dining Out","Expense","Joint","450"',
    ].join('\n'))

    expect(result.success).toBe(true)
    expect(result.transactions).toEqual([
      {
        date: '2026-03-17',
        description: 'Dinner, friends',
        category: 'Dining Out',
        type: 'Expense',
        ownership: 'Joint',
        amount: 450,
      },
    ])
  })

  it('escapes embedded quotes during CSV export', () => {
    const csv = buildTransactionsCSV([
      {
        id: 'tx-2',
        amount: 42,
        date: '2026-03-04T00:00:00.000Z',
        description: 'Quoted "note"',
        category: 'Other',
        type: 'Expense',
        accountId: 'account-checking',
        userId: 'user-assaf',
        ownership: 'Personal',
        createdAt: '2026-03-04T00:00:00.000Z',
        updatedAt: '2026-03-04T00:00:00.000Z',
      } satisfies Transaction,
    ])

    expect(csv).toContain('"Quoted ""note"""')
  })
})
