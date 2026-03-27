import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  CheckCircle,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react'
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
import { getCategoriesByType, useCategoryStore } from '@/stores/categoryStore'
import { formatILS } from '@/lib/currency'
import { renderCategoryIcon } from '@/lib/categoryIcons'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { BudgetsSkeleton } from '@/components/ui/skeleton'
import type { Budget } from '@/types'

export function Budgets() {
  const { t } = useTranslation()
  const { currentUser } = useUserStore()
  const { budgets, isLoading, fetchBudgets, createOrUpdateBudget, deleteBudget } = useBudgetStore()
  const { stats, fetchDashboardData } = useDashboardStore()
  const { categories, fetchCategories } = useCategoryStore()
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
      fetchCategories()
    }
  }, [isElectron, currentUser, currentMonth, currentYear, fetchBudgets, fetchDashboardData, fetchCategories])

  const budgetsWithSpent = stats?.budgetWithSpent || budgets.map((budget) => ({
    ...budget,
    spent: 0,
  }))

  const totalBudget = budgetsWithSpent.reduce((sum, budget) => sum + budget.limit, 0)
  const totalSpent = budgetsWithSpent.reduce((sum, budget) => sum + (budget.spent || 0), 0)
  const totalRemaining = totalBudget - totalSpent
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  const availableCategories = getCategoriesByType(categories, 'Expense').filter(
    (category) => !budgetsWithSpent.some((budget) => budget.category === category)
  )

  const refreshBudgetState = async (userId: string) => {
    await fetchBudgets(userId, currentMonth, currentYear)
    await fetchDashboardData(userId)
  }

  const resetDialogState = () => {
    setSelectedCategory('')
    setBudgetLimit('')
    setEditingBudget(null)
    setError('')
  }

  const validateBudgetLimit = () => {
    const limit = parseFloat(budgetLimit)
    if (!limit || limit <= 0) {
      setError('Please enter a valid budget amount')
      return null
    }

    return limit
  }

  const handleCreate = async (e: React.FormEvent) => {
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

    const limit = validateBudgetLimit()
    if (!limit) return

    setIsSubmitting(true)

    try {
      await createOrUpdateBudget({
        category: selectedCategory,
        limit,
        month: currentMonth,
        year: currentYear,
        userId: currentUser.id,
      })
      showToast(t('toast.budgetCreated'), 'success')
      setIsAddOpen(false)
      resetDialogState()
      await refreshBudgetState(currentUser.id)
    } catch (err) {
      console.error('Failed to create budget:', err)
      setError('Failed to create budget. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!currentUser || !editingBudget) return

    const limit = validateBudgetLimit()
    if (!limit) return

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
      resetDialogState()
      await refreshBudgetState(currentUser.id)
    } catch (err) {
      console.error('Failed to update budget:', err)
      setError('Failed to update budget')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentUser || !editingBudget?.id) return

    setIsSubmitting(true)
    try {
      await deleteBudget(editingBudget.id)
      showToast(t('toast.budgetDeleted'), 'success')
      setIsDeleteOpen(false)
      resetDialogState()
      await refreshBudgetState(currentUser.id)
    } catch (err) {
      console.error('Failed to delete budget:', err)
      showToast(t('toast.budgetDeleteFailed'), 'error')
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
        <Button
          onClick={() => {
            resetDialogState()
            setIsAddOpen(true)
          }}
          disabled={availableCategories.length === 0}
          data-testid="add-budget-button"
        >
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
              <div className={cn('rounded-lg p-2', totalRemaining >= 0 ? 'bg-green-100' : 'bg-red-100')}>
                <PiggyBank className={cn('h-5 w-5', totalRemaining >= 0 ? 'text-green-600' : 'text-red-600')} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={cn('text-xl font-bold', totalRemaining >= 0 ? 'text-green-600' : 'text-red-600')}>
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
        {budgetsWithSpent.length === 0 ? (
          <div className="col-span-full flex h-[200px] flex-col items-center justify-center text-muted-foreground">
            <p>No budgets set for this month</p>
            <Button variant="link" onClick={() => setIsAddOpen(true)}>
              Create your first budget
            </Button>
          </div>
        ) : (
          budgetsWithSpent.map((budget) => {
            const persistedBudget = budget as Budget & { spent: number }
            const percentage = Math.round(((budget.spent || 0) / budget.limit) * 100)
            const remaining = budget.limit - (budget.spent || 0)

            return (
              <Card key={budget.category} data-testid={`budget-card-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-muted p-2">
                        {renderCategoryIcon(persistedBudget.category === 'Dining Out' ? 'Utensils' : persistedBudget.category === 'Utilities' ? 'Bolt' : persistedBudget.category === 'Groceries' ? 'Cart' : persistedBudget.category === 'Shopping' ? 'ShoppingBag' : persistedBudget.category === 'Healthcare' ? 'HeartPulse' : persistedBudget.category === 'Transportation' ? 'Car' : persistedBudget.category === 'Education' ? 'BookOpen' : persistedBudget.category === 'Housing' ? 'Home' : 'Package')}
                      </span>
                      <div>
                        <CardTitle className="text-base">{budget.category}</CardTitle>
                        <CardDescription>
                          {formatILS(budget.spent || 0)} of {formatILS(budget.limit)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusBadge(percentage)}
                      {isElectron && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            data-testid={`budget-edit-${persistedBudget.id}`}
                            onClick={() => {
                              setEditingBudget({ category: persistedBudget.category, limit: persistedBudget.limit, id: persistedBudget.id })
                              setBudgetLimit(persistedBudget.limit.toString())
                              setError('')
                              setIsEditOpen(true)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            data-testid={`budget-delete-${persistedBudget.id}`}
                            onClick={() => {
                              setEditingBudget({ category: persistedBudget.category, limit: persistedBudget.limit, id: persistedBudget.id })
                              setError('')
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
                    <span className={cn('font-semibold', remaining >= 0 ? 'text-green-600' : 'text-red-600')}>
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
            <DialogDescription>{t('budgets.setBudgetLimit')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget-category">{t('common.category')}</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="budget-category-trigger">
                  <SelectValue placeholder={t('common.category')} />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      data-testid={`budget-category-option-${category.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-limit">{t('budgets.limit')} (ILS)</Label>
              <Input
                id="budget-limit"
                type="number"
                step="100"
                min="0"
                placeholder="0"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                data-testid="budget-limit-input"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="budget-submit-button">
                {isSubmitting ? t('common.saving') : t('budgets.addBudget')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('budgets.updateBudget')}</DialogTitle>
            <DialogDescription>{editingBudget?.category}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-budget-limit">{t('budgets.limit')} (ILS)</Label>
              <Input
                id="edit-budget-limit"
                type="number"
                step="100"
                min="0"
                placeholder="0"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                data-testid="budget-edit-limit-input"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="budget-edit-submit-button">
                {isSubmitting ? t('common.saving') : t('common.saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.delete')} {t('budgets.title')}</DialogTitle>
            <DialogDescription>
              {editingBudget ? t('budgets.confirmDelete', { category: editingBudget.category }) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={isSubmitting}
              onClick={handleDelete}
              data-testid="budget-delete-confirm-button"
            >
              {isSubmitting ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
