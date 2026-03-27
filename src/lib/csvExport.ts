import type { Transaction } from '@/types'

export function buildTransactionsCSV(transactions: Transaction[]) {
  const headers = ['Date', 'Description', 'Category', 'Type', 'Ownership', 'Amount']
  const rows = transactions.map((transaction) => [
    new Date(transaction.date).toISOString().split('T')[0],
    transaction.description,
    transaction.category,
    transaction.type,
    transaction.ownership,
    transaction.amount.toString(),
  ])

  return [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
}
