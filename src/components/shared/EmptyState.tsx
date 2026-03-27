import { useTranslation } from 'react-i18next'
import {
  Wallet,
  Receipt,
  PiggyBank,
  BarChart3,
  Repeat,
  LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  type: 'transactions' | 'accounts' | 'budgets' | 'reports' | 'recurring'
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const EMPTY_STATE_CONFIG: Record<
  EmptyStateProps['type'],
  { icon: LucideIcon; defaultTitle: string; defaultDescription: string; gradient: string }
> = {
  transactions: {
    icon: Receipt,
    defaultTitle: 'emptyState.transactions.title',
    defaultDescription: 'emptyState.transactions.description',
    gradient: 'from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900/50',
  },
  accounts: {
    icon: Wallet,
    defaultTitle: 'emptyState.accounts.title',
    defaultDescription: 'emptyState.accounts.description',
    gradient: 'from-green-100 to-green-50 dark:from-green-950 dark:to-green-900/50',
  },
  budgets: {
    icon: PiggyBank,
    defaultTitle: 'emptyState.budgets.title',
    defaultDescription: 'emptyState.budgets.description',
    gradient: 'from-purple-100 to-purple-50 dark:from-purple-950 dark:to-purple-900/50',
  },
  reports: {
    icon: BarChart3,
    defaultTitle: 'emptyState.reports.title',
    defaultDescription: 'emptyState.reports.description',
    gradient: 'from-orange-100 to-orange-50 dark:from-orange-950 dark:to-orange-900/50',
  },
  recurring: {
    icon: Repeat,
    defaultTitle: 'emptyState.recurring.title',
    defaultDescription: 'emptyState.recurring.description',
    gradient: 'from-cyan-100 to-cyan-50 dark:from-cyan-950 dark:to-cyan-900/50',
  },
}

export function EmptyState({
  type,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const { t } = useTranslation()
  const config = EMPTY_STATE_CONFIG[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center',
        className
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br',
          config.gradient
        )}
      >
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">
        {title || t(config.defaultTitle)}
      </h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">
        {description || t(config.defaultDescription)}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function EmptyStateInline({
  icon: Icon,
  message,
  action,
}: {
  icon: LucideIcon
  message: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && (
        <Button variant="link" size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  )
}
