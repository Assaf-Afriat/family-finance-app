import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileBarChart,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  Wallet,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/userStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { ReportsSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { formatILS, formatILSCompact } from '@/lib/currency'
import { generateMonthlyReportPDF } from '@/lib/pdfExport'

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#6b7280',
]

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
  Salary: '#22c55e',
  Freelance: '#3b82f6',
  Investments: '#8b5cf6',
  Gifts: '#ec4899',
  'Other Income': '#6b7280',
}

type Period = 'this-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'all-time'

export function Reports() {
  const { t } = useTranslation()
  const { currentUser } = useUserStore()
  const { transactions, fetchTransactions } = useTransactionStore()
  const { showToast } = useToast()
  const [period, setPeriod] = useState<Period>('last-6-months')

  const isElectron = typeof window !== 'undefined' && window.electronAPI

  useEffect(() => {
    if (isElectron) {
      fetchTransactions()
    }
  }, [isElectron, fetchTransactions])

  const getFilteredTransactions = () => {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last-3-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        break
      case 'last-6-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        break
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'all-time':
      default:
        startDate = new Date(2000, 0, 1)
    }

    return transactions.filter((t) => new Date(t.date) >= startDate)
  }

  const filteredTransactions = getFilteredTransactions()

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0'

  // Monthly trends data
  const getMonthlyData = () => {
    const monthlyMap = new Map<string, { income: number; expenses: number; month: string }>()
    
    filteredTransactions.forEach((t) => {
      const date = new Date(t.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { income: 0, expenses: 0, month: monthName })
      }
      
      const data = monthlyMap.get(key)!
      if (t.type === 'Income') {
        data.income += t.amount
      } else {
        data.expenses += t.amount
      }
    })

    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => ({
        ...data,
        net: data.income - data.expenses,
      }))
  }

  // Expense by category
  const getExpensesByCategory = () => {
    const categoryMap = new Map<string, number>()
    
    filteredTransactions
      .filter((t) => t.type === 'Expense')
      .forEach((t) => {
        const current = categoryMap.get(t.category) || 0
        categoryMap.set(t.category, current + t.amount)
      })

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        color: CATEGORY_COLORS[category] || '#6b7280',
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  // Income by category
  const getIncomeByCategory = () => {
    const categoryMap = new Map<string, number>()
    
    filteredTransactions
      .filter((t) => t.type === 'Income')
      .forEach((t) => {
        const current = categoryMap.get(t.category) || 0
        categoryMap.set(t.category, current + t.amount)
      })

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        color: CATEGORY_COLORS[category] || '#6b7280',
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  // Net worth over time (cumulative)
  const getNetWorthTrend = () => {
    const sortedTransactions = [...filteredTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    let cumulative = 0
    const monthlyNetWorth = new Map<string, number>()

    sortedTransactions.forEach((t) => {
      const date = new Date(t.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (t.type === 'Income') {
        cumulative += t.amount
      } else {
        cumulative -= t.amount
      }
      
      monthlyNetWorth.set(key, cumulative)
    })

    return Array.from(monthlyNetWorth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const [year, month] = key.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          netWorth: value,
        }
      })
  }

  // Top spending categories
  const getTopSpending = () => {
    return getExpensesByCategory().slice(0, 5)
  }

  const monthlyData = getMonthlyData()
  const expensesByCategory = getExpensesByCategory()
  const incomeByCategory = getIncomeByCategory()
  const netWorthTrend = getNetWorthTrend()
  const topSpending = getTopSpending()

  const getPeriodLabel = () => {
    switch (period) {
      case 'this-month': return t('reports.thisMonth')
      case 'last-3-months': return t('reports.last3Months')
      case 'last-6-months': return t('reports.last6Months')
      case 'this-year': return t('reports.thisYear')
      case 'all-time': return t('reports.allTime')
      default: return period
    }
  }

  const handleExportPDF = () => {
    try {
      const transactionsForPDF = filteredTransactions.map((t) => ({
        date: new Date(t.date).toLocaleDateString(),
        description: t.description,
        category: t.category,
        type: t.type,
        amount: t.amount,
      }))

      generateMonthlyReportPDF({
        period: getPeriodLabel(),
        generatedAt: new Date().toLocaleDateString(),
        userName: currentUser?.name || 'User',
        summary: {
          totalIncome,
          totalExpenses,
          netSavings,
          savingsRate: parseFloat(savingsRate),
        },
        expensesByCategory: expensesByCategory.map((item) => ({
          category: item.category,
          amount: item.amount,
          percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0,
        })),
        incomeByCategory: incomeByCategory.map((item) => ({
          category: item.category,
          amount: item.amount,
          percentage: totalIncome > 0 ? (item.amount / totalIncome) * 100 : 0,
        })),
        transactions: transactionsForPDF,
      })

      showToast(t('toast.pdfExported'), 'success')
    } catch (error) {
      console.error('Failed to export PDF:', error)
      showToast(t('toast.pdfExportFailed'), 'error')
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatILS(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading && isElectron) {
    return <ReportsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('reports.title')}</h1>
          <p className="text-muted-foreground">
            {t('reports.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="me-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">{t('reports.thisMonth')}</SelectItem>
              <SelectItem value="last-3-months">{t('reports.last3Months')}</SelectItem>
              <SelectItem value="last-6-months">{t('reports.last6Months')}</SelectItem>
              <SelectItem value="this-year">{t('reports.thisYear')}</SelectItem>
              <SelectItem value="all-time">{t('reports.allTime')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="me-2 h-4 w-4" />
            {t('reports.exportPDF')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.totalIncome')}</p>
                <p className="text-xl font-bold text-green-600">{formatILS(totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.totalExpenses')}</p>
                <p className="text-xl font-bold text-red-600">{formatILS(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('reports.netSavings')}</p>
                <p className={`text-xl font-bold ${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatILS(netSavings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                <PieChart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('reports.savingsRate')}</p>
                <p className={`text-xl font-bold ${parseFloat(savingsRate) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {savingsRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expenses Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('dashboard.incomeVsExpenses')}
          </CardTitle>
          <CardDescription>{t('reports.monthlyComparison')}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => formatILSCompact(v)} className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name={t('common.income')} fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name={t('common.expense')} fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              {t('reports.noDataPeriod')}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              {t('dashboard.expensesByCategory')}
            </CardTitle>
            <CardDescription>{t('reports.whereMoneyGoes')}</CardDescription>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={expensesByCategory}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatILS(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {expensesByCategory.slice(0, 6).map((item) => (
                    <div key={item.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.category}</span>
                      </div>
                      <span className="font-medium">{formatILSCompact(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                {t('reports.noExpenses')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              {t('reports.incomeByCategory')}
            </CardTitle>
            <CardDescription>{t('reports.incomeSources')}</CardDescription>
          </CardHeader>
          <CardContent>
            {incomeByCategory.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={incomeByCategory}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                    >
                      {incomeByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatILS(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {incomeByCategory.slice(0, 6).map((item) => (
                    <div key={item.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.category}</span>
                      </div>
                      <span className="font-medium">{formatILSCompact(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                {t('reports.noIncome')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Net Worth Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('reports.cumulativeCashFlow')}
          </CardTitle>
          <CardDescription>{t('reports.netSavingsOverTime')}</CardDescription>
        </CardHeader>
        <CardContent>
          {netWorthTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={netWorthTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => formatILSCompact(v)} className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  name="Net Cash Flow"
                  stroke="#3b82f6"
                  fill="url(#colorNetWorth)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              {t('reports.noDataPeriod')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Spending Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            {t('reports.topSpending')}
          </CardTitle>
          <CardDescription>{t('reports.biggestExpenses')}</CardDescription>
        </CardHeader>
        <CardContent>
          {topSpending.length > 0 ? (
            <div className="space-y-4">
              {topSpending.map((item, index) => {
                const percentage = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0
                return (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium">{item.category}</span>
                      </div>
                      <div className="text-end">
                        <span className="font-bold">{formatILS(item.amount)}</span>
                        <span className="ms-2 text-sm text-muted-foreground">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              {t('reports.noExpenses')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
