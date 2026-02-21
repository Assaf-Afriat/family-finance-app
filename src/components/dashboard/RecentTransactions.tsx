import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatILS } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types'

interface RecentTransactionsProps {
  transactions: Transaction[]
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IL', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium',
                    transaction.type === 'Income'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  )}
                >
                  {transaction.type === 'Income' ? '+' : '-'}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{transaction.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{transaction.category}</span>
                    <span>•</span>
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {transaction.type === 'Income' ? '+' : '-'}
                  {formatILS(Math.abs(transaction.amount))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.ownership}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
