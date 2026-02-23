import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, PiggyBank, TrendingUp, AlertTriangle, CheckCircle, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBudgetStore } from '@/stores/budgetStore'
import { useUserStore } from '@/stores/userStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { formatILS } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { BudgetsSkeleton } from '@/components/ui/skeleton'

const EXPENSE_CATEGORIES = [
  'Housing',
  'Groceries',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Dining Out',
  'Shopping',
  'Education',
  'Other',
]

const CATEGORY_ICONS: Record<string, string> = {
  Housing: '🏠',
  Groceries: '🛒',
  Transportation: '🚗',
  Utilities: '💡',
  Entertainment: '🎬',
  Healthcare: '🏥',
  'Dining Out': '🍽️',
  Shopping: '🛍️',
  Education: '📚',
  Other: '📦',
}

export function Budgets() {
  const { t } = useTranslation()
  const { currentUser } = useUserStore()
  const { budgets, isLoading, fetchBudgets, createOrUpdateBudget, deleteBudget } = useBudgetStore()
  const { stats, fetchDashboardData } = useDashboardStore()
  const { showToast } = useToast()
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<{ category: string; limit: number; id?: string } | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [budgetLimit, setBudgetLimit] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isElectron = typeof window !== 'undefined' && window.electronAPI
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  useEffect(() => {
    if (isElectron && currentUser) {
      fetchBudgets(currentUser.id, currentMonth, currentYear)
      fetchDashboardData(currentUser.id)
    }
  }, [isElectron, currentUser, currentMonth, currentYear, fetchBudgets, fetchDashboardData])

  const budgetsWithSpent = stats?.budgetWithSpent || budgets.map(b => ({
    ...b,
    spent: 0,
  }))

  const totalBudget = budgetsWithSpent.reduce((sum, b) => sum + b.limit, 0)
  const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + (b.spent || 0), 0)
  const totalRemaining = totalBudget - totalSpent
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!currentUser) {
      setError('No user selected')
      return
    }

    if (!selectedCategory) {
      setError('Please select a category')
      return
    }

    const limit = parseFloat(budgetLimit)
    if (!limit || limit <= 0) {
      setError('Please enter a valid budget amount')
      return
    }

    setIsSubmitting(true)

    try {
      await createOrUpdateBudget({
        category: selectedCategory,
        limit,
        month: currentMonth,
        year: currentYear,
        userId: currentUser.id,
      })

      setSelectedCategory('')
      setBudgetLimit('')
      setIsAddOpen(false)
      
      // Refresh data
      await fetchBudgets(currentUser.id, currentMonth, currentYear)
      await fetchDashboardData(currentUser.id)
    } catch (err) {
      console.error('Failed to create budget:', err)
      setError('Failed to create budget. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Over Budget
        </Badge>
      )
    }
    if (percentage >= 80) {
      return (
        <Badge variant="warning" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Near Limit
        </Badge>
      )
    }
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        On Track
      </Badge>
    )
  }

  const existingCategories = budgetsWithSpent.map(b => b.category)
  const availableCategories = EXPENSE_CATEGORIES.filter(c => !existingCategories.includes(c))

  const mockBudgets = [
    { category: 'Groceries', limit: 3000, spent: 2400 },
    { category: 'Entertainment', limit: 1500, spent: 1350 },
    { category: 'Transportation', limit: 800, spent: 480 },
    { category: 'Dining Out', limit: 1200, spent: 900 },
    { category: 'Utilities', limit: 600, spent: 500 },
  ]

  const displayBudgets = isElectron && budgetsWithSpent.length > 0 
    ? budgetsWithSpent 
    : mockBudgets

  if (isLoading && isElectron) {
    return <BudgetsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('nav.budgets')}</h1>
          <p className="text-muted-foreground">
            Set and track your spending budgets for {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} disabled={availableCategories.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <PiggyBank className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-xl font-bold">{formatILS(totalBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold text-amber-600">{formatILS(totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "rounded-lg p-2",
                totalRemaining >= 0 ? "bg-green-100" : "bg-red-100"
              )}>
                <PiggyBank className={cn(
                  "h-5 w-5",
                  totalRemaining >= 0 ? "text-green-600" : "text-red-600"
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={cn(
                  "text-xl font-bold",
                  totalRemaining >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatILS(totalRemaining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-sm font-medium">{overallPercentage}%</p>
              </div>
              <Progress
                value={Math.min(overallPercentage, 100)}
                className="h-2"
                indicatorClassName={getProgressColor(overallPercentage)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex h-[200px] items-center justify-center text-muted-foreground">
            Loading budgets...
          </div>
        ) : displayBudgets.length === 0 ? (
          <div className="col-span-full flex h-[200px] flex-col items-center justify-center text-muted-foreground">
            <p>No budgets set for this month</p>
            <Button variant="link" onClick={() => setIsAddOpen(true)}>
              Create your first budget
            </Button>
          </div>
        ) : (
          displayBudgets.map((budget) => {
            const percentage = Math.round((budget.spent / budget.limit) * 100)
            const remaining = budget.limit - budget.spent
            
            return (
              <Card key={budget.category}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{CATEGORY_ICONS[budget.category] || '📦'}</span>
                      <div>
                        <CardTitle className="text-base">{budget.category}</CardTitle>
                        <CardDescription>
                          {formatILS(budget.spent)} of {formatILS(budget.limit)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusBadge(percentage)}
                      {isElectron && 'id' in budget && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingBudget({ category: budget.category, limit: budget.limit, id: budget.id })
                              setBudgetLimit(budget.limit.toString())
                              setIsEditOpen(true)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              setEditingBudget({ category: budget.category, limit: budget.limit, id: budget.id })
                              setIsDeleteOpen(true)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('budgets.spent')}</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className="h-3"
                      indicatorClassName={getProgressColor(percentage)}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('budgets.remaining')}</span>
                    <span className={cn(
                      "font-semibold",
                      remaining >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatILS(remaining)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('budgets.addBudget')}</DialogTitle>
            <DialogDescription>
              {t('budgets.setBudgetLimit')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t('common.category')}</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.category')} />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">{t('budgets.limit')} (₪)</Label>
              <Input
                id="limit"
                type="number"
                step="100"
                min="0"
                placeholder="0"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.saving') : t('budgets.addBudget')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('budgets.updateBudget')}</DialogTitle>
            <DialogDescription>
              {editingBudget && (
                <>
                  {CATEGORY_ICONS[editingBudget.category]} {editingBudget.category}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!currentUser || !editingBudget) return
              
              const limit = parseFloat(budgetLimit)
              if (!limit || limit <= 0) {
                setError('Please enter a valid budget amount')
                return
              }

              setIsSubmitting(true)
              try {
                await createOrUpdateBudget({
                  category: editingBudget.category,
                  limit,
                  month: currentMonth,
                  year: currentYear,
                  userId: currentUser.id,
                })
                showToast(t('toast.budgetUpdated'), 'success')
                setIsEditOpen(false)
                setBudgetLimit('')
                setEditingBudget(null)
                await fetchBudgets(currentUser.id, currentMonth, currentYear)
                await fetchDashboardData(currentUser.id)
              } catch (err) {
                console.error('Failed to update budget:', err)
                setError('Failed to update budget')
              } finally {
                setIsSubmitting(false)
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-limit">{t('budgets.limit')} (₪)</Label>
              <Input
                id="edit-limit"
                type="number"
                step="100"
                min="0"
                placeholder="0"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.saving') : t('common.saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Budget Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.delete')} {t('budgets.title')}</DialogTitle>
            <DialogDescription>
              {editingBudget && (
                <>
                  {t('budgets.confirmDelete', { category: editingBudget.category })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={isSubmitting}
              onClick={async () => {
                if (!currentUser || !editingBudget?.id) return
                setIsSubmitting(true)
                try {
                  await deleteBudget(editingBudget.id)
                  showToast(t('toast.budgetDeleted'), 'success')
                  setIsDeleteOpen(false)
                  setEditingBudget(null)
                  await fetchBudgets(currentUser.id, currentMonth, currentYear)
                  await fetchDashboardData(currentUser.id)
                } catch (err) {
                  console.error('Failed to delete budget:', err)
                  showToast(t('toast.budgetDeleteFailed'), 'error')
                } finally {
                  setIsSubmitting(false)
                }
              }}
            >
              {isSubmitting ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
