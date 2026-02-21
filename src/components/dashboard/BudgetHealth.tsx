import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatILS } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { BudgetHealth as BudgetHealthType } from '@/types'

interface BudgetHealthProps {
  budgets: BudgetHealthType[]
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 75) return 'bg-amber-500'
  return 'bg-green-500'
}

function getTextColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600'
  if (percentage >= 75) return 'text-amber-600'
  return 'text-green-600'
}

export function BudgetHealth({ budgets }: BudgetHealthProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Budget Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.map((budget) => (
          <div key={budget.category} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{budget.category}</span>
              <span className={cn('font-semibold', getTextColor(budget.percentage))}>
                {budget.percentage}%
              </span>
            </div>
            <Progress
              value={Math.min(budget.percentage, 100)}
              className="h-2"
              indicatorClassName={getProgressColor(budget.percentage)}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatILS(budget.spent)} spent</span>
              <span>of {formatILS(budget.limit)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
