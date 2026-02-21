import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Wallet, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { KPICard } from '@/components/dashboard/KPICard'
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart'
import { ExpenseDonutChart } from '@/components/dashboard/ExpenseDonutChart'
import { BudgetHealth } from '@/components/dashboard/BudgetHealth'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { formatILS } from '@/lib/currency'
import { useUserStore } from '@/stores/userStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useTransactionStore } from '@/stores/transactionStore'
import type { MonthlyData, CategoryExpense, BudgetHealth as BudgetHealthType, Transaction } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  Housing: '#3b82f6',
  Groceries: '#22c55e',
  Transportation: '#f59e0b',
  Utilities: '#8b5cf6',
  Entertainment: '#ec4899',
  Healthcare: '#14b8a6',
  'Dining Out': '#f97316',
  Shopping: '#a855f7',
  Education: '#06b6d4',
  Other: '#6b7280',
}

const mockMonthlyData: MonthlyData[] = [
  { month: 'Sep', income: 18500, expenses: 14200 },
  { month: 'Oct', income: 19200, expenses: 15800 },
  { month: 'Nov', income: 17800, expenses: 13500 },
  { month: 'Dec', income: 22000, expenses: 18900 },
  { month: 'Jan', income: 19500, expenses: 14700 },
  { month: 'Feb', income: 20000, expenses: 15200 },
]

const mockCategoryExpenses: CategoryExpense[] = [
  { category: 'Housing', amount: 5500, color: '#3b82f6' },
  { category: 'Groceries', amount: 2800, color: '#22c55e' },
  { category: 'Transportation', amount: 1500, color: '#f59e0b' },
  { category: 'Utilities', amount: 1200, color: '#8b5cf6' },
  { category: 'Entertainment', amount: 1800, color: '#ec4899' },
  { category: 'Other', amount: 2400, color: '#6b7280' },
]

const mockBudgetHealth: BudgetHealthType[] = [
  { category: 'Groceries', limit: 3000, spent: 2400, percentage: 80 },
  { category: 'Entertainment', limit: 2000, spent: 1800, percentage: 90 },
  { category: 'Transportation', limit: 2000, spent: 1200, percentage: 60 },
]

const mockRecentTransactions: Transaction[] = [
  {
    id: '1',
    amount: 450,
    date: new Date(2026, 1, 19),
    description: 'Supermarket Groceries',
    category: 'Groceries',
    type: 'Expense',
    accountId: '1',
    userId: '1',
    ownership: 'Joint',
  },
  {
    id: '2',
    amount: 20000,
    date: new Date(2026, 1, 15),
    description: 'Monthly Salary',
    category: 'Salary',
    type: 'Income',
    accountId: '1',
    userId: '1',
    ownership: 'Personal',
  },
  {
    id: '3',
    amount: 180,
    date: new Date(2026, 1, 14),
    description: 'Electric Bill',
    category: 'Utilities',
    type: 'Expense',
    accountId: '1',
    userId: '1',
    ownership: 'Joint',
  },
  {
    id: '4',
    amount: 350,
    date: new Date(2026, 1, 12),
    description: 'Restaurant Dinner',
    category: 'Entertainment',
    type: 'Expense',
    accountId: '1',
    userId: '1',
    ownership: 'Joint',
  },
  {
    id: '5',
    amount: 120,
    date: new Date(2026, 1, 10),
    description: 'Gas Station',
    category: 'Transportation',
    type: 'Expense',
    accountId: '1',
    userId: '1',
    ownership: 'Personal',
  },
]

export function Dashboard() {
  const { t } = useTranslation()
  const { currentUser } = useUserStore()
  const { stats, monthlyTrends, isLoading, fetchDashboardData } = useDashboardStore()
  const { recentTransactions, fetchRecentTransactions } = useTransactionStore()

  const isElectron = typeof window !== 'undefined' && window.electronAPI

  useEffect(() => {
    if (isElectron && currentUser) {
      fetchDashboardData(currentUser.id)
      fetchRecentTransactions(5)
    }
  }, [currentUser, isElectron, fetchDashboardData, fetchRecentTransactions])

  const netWorth = stats?.netWorth ?? 185000
  const totalIncome = stats?.totalIncome ?? 20000
  const totalExpenses = stats?.totalExpenses ?? 15200
  const remainingBudget = stats?.remainingBudget ?? 4800

  const chartData: MonthlyData[] = monthlyTrends.length > 0 
    ? monthlyTrends 
    : mockMonthlyData

  const categoryExpenses: CategoryExpense[] = stats?.expensesByCategory
    ? Object.entries(stats.expensesByCategory).map(([category, amount]) => ({
        category,
        amount,
        color: CATEGORY_COLORS[category] || '#6b7280',
      }))
    : mockCategoryExpenses

  const budgetHealth: BudgetHealthType[] = stats?.budgetWithSpent
    ? stats.budgetWithSpent.map((b) => ({
        category: b.category,
        limit: b.limit,
        spent: b.spent,
        percentage: Math.round((b.spent / b.limit) * 100),
      })).slice(0, 3)
    : mockBudgetHealth

  const transactions: Transaction[] = recentTransactions.length > 0
    ? recentTransactions.map((t) => ({
        ...t,
        date: new Date(t.date),
      }))
    : mockRecentTransactions

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {isLoading ? t('common.loading') : t('dashboard.subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={t('dashboard.netWorth')}
          value={formatILS(netWorth)}
          icon={Wallet}
          trend={{ value: 3.2, isPositive: true }}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <KPICard
          title={t('dashboard.totalIncome')}
          value={formatILS(totalIncome)}
          icon={TrendingUp}
          trend={{ value: 2.5, isPositive: true }}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <KPICard
          title={t('dashboard.totalExpenses')}
          value={formatILS(totalExpenses)}
          icon={TrendingDown}
          trend={{ value: 1.8, isPositive: false }}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
        />
        <KPICard
          title={t('dashboard.remainingBudget')}
          value={formatILS(remainingBudget)}
          icon={Target}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <IncomeExpenseChart data={chartData} />
        <ExpenseDonutChart data={categoryExpenses} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BudgetHealth budgets={budgetHealth} />
        <RecentTransactions transactions={transactions} />
      </div>
    </div>
  )
}
