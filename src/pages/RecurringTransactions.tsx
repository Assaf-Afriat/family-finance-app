import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { useRecurringStore } from '@/stores/recurringStore'
import { useUserStore } from '@/stores/userStore'
import { useAccountStore } from '@/stores/accountStore'
import { getCategoriesByType, useCategoryStore } from '@/stores/categoryStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { useToast } from '@/components/ui/toast'
import { formatILS } from '@/lib/currency'
import { cn } from '@/lib/utils'

const FREQUENCIES = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Yearly', label: 'Yearly' },
]

export function RecurringTransactions() {
  const { t } = useTranslation()
  const { currentUser } = useUserStore()
  const { accounts, fetchAccounts } = useAccountStore()
  const { categories: customCategories, fetchCategories } = useCategoryStore()
  const {
    recurringTransactions,
    isLoading,
    fetchRecurringTransactions,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    processRecurringTransactions,
  } = useRecurringStore()
  const { fetchDashboardData } = useDashboardStore()
  const { fetchTransactions, fetchRecentTransactions } = useTransactionStore()
  const { showToast } = useToast()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formType, setFormType] = useState<'Income' | 'Expense'>('Expense')
  const [formAmount, setFormAmount] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formAccountId, setFormAccountId] = useState('')
  const [formOwnership, setFormOwnership] = useState('Personal')
  const [formFrequency, setFormFrequency] = useState('Monthly')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  const isElectron = typeof window !== 'undefined' && window.electronAPI

  useEffect(() => {
    if (isElectron && currentUser) {
      fetchRecurringTransactions(currentUser.id)
      fetchAccounts()
      fetchCategories()
    }
  }, [isElectron, currentUser, fetchRecurringTransactions, fetchAccounts, fetchCategories])

  const resetForm = () => {
    setFormType('Expense')
    setFormAmount('')
    setFormDescription('')
    setFormCategory('')
    setFormAccountId(accounts[0]?.id || '')
    setFormOwnership('Personal')
    setFormFrequency('Monthly')
    setFormStartDate(new Date().toISOString().split('T')[0])
    setFormEndDate('')
    setFormIsActive(true)
    setError('')
  }

  const openAddDialog = () => {
    resetForm()
    setIsAddOpen(true)
  }

  const openEditDialog = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring)
    setFormType(recurring.type as 'Income' | 'Expense')
    setFormAmount(recurring.amount.toString())
    setFormDescription(recurring.description)
    setFormCategory(recurring.category)
    setFormAccountId(recurring.accountId)
    setFormOwnership(recurring.ownership)
    setFormFrequency(recurring.frequency)
    setFormStartDate(new Date(recurring.startDate).toISOString().split('T')[0])
    setFormEndDate(recurring.endDate ? new Date(recurring.endDate).toISOString().split('T')[0] : '')
    setFormIsActive(recurring.isActive)
    setError('')
    setIsEditOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent, isEdit: boolean) => {
    e.preventDefault()
    setError('')

    if (!currentUser) {
      setError(t('validation.noUserSelected'))
      return
    }

    const amount = parseFloat(formAmount)
    if (!amount || amount <= 0) {
      setError(t('validation.enterValidAmount'))
      return
    }

    if (!formCategory) {
      setError(t('validation.selectCategory'))
      return
    }

    if (!formAccountId) {
      setError(t('validation.selectAccount'))
      return
    }

    setIsSubmitting(true)

    try {
      if (isEdit && editingRecurring) {
        await updateRecurringTransaction(editingRecurring.id, {
          amount,
          description: formDescription,
          category: formCategory,
          type: formType,
          ownership: formOwnership,
          frequency: formFrequency,
          startDate: formStartDate,
          endDate: formEndDate || null,
          isActive: formIsActive,
          accountId: formAccountId,
        })
        showToast(t('toast.recurringUpdated'), 'success')
        setIsEditOpen(false)
      } else {
        await createRecurringTransaction({
          amount,
          description: formDescription,
          category: formCategory,
          type: formType,
          ownership: formOwnership,
          frequency: formFrequency,
          startDate: formStartDate,
          endDate: formEndDate || null,
          accountId: formAccountId,
          userId: currentUser.id,
        })
        showToast(t('toast.recurringAdded'), 'success')
        setIsAddOpen(false)
      }
      resetForm()
    } catch (err) {
      console.error('Failed to save recurring transaction:', err)
      setError('Failed to save recurring transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editingRecurring) return
    setIsSubmitting(true)
    try {
      await deleteRecurringTransaction(editingRecurring.id)
      showToast(t('toast.recurringDeleted'), 'success')
      setIsDeleteOpen(false)
      setEditingRecurring(null)
    } catch (err) {
      console.error('Failed to delete recurring transaction:', err)
      showToast(t('toast.recurringDeleteFailed'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (recurring: RecurringTransaction) => {
    try {
      await updateRecurringTransaction(recurring.id, {
        ...recurring,
        startDate: new Date(recurring.startDate).toISOString().split('T')[0],
        endDate: recurring.endDate ? new Date(recurring.endDate).toISOString().split('T')[0] : null,
        isActive: !recurring.isActive,
      })
      showToast(recurring.isActive ? t('toast.recurringPaused') : t('toast.recurringResumed'), 'success')
    } catch (err) {
      console.error('Failed to toggle recurring transaction:', err)
    }
  }

  const handleProcessNow = async () => {
    if (!currentUser) return
    try {
      const created = await processRecurringTransactions(currentUser.id)
      if (created.length > 0) {
        showToast(t('toast.recurringProcessed', { count: created.length }), 'success')
        await fetchDashboardData(currentUser.id)
        await fetchTransactions({ userId: currentUser.id })
        await fetchRecentTransactions(currentUser.id)
        await fetchRecurringTransactions(currentUser.id)
      } else {
        showToast(t('toast.noRecurringDue'), 'info')
      }
    } catch (err) {
      console.error('Failed to process recurring transactions:', err)
      showToast(t('toast.recurringProcessFailed'), 'error')
    }
  }

  const categories = getCategoriesByType(customCategories, formType)
  const activeRecurring = recurringTransactions.filter((recurring) => recurring.isActive)
  const pausedRecurring = recurringTransactions.filter((recurring) => !recurring.isActive)

  const totalMonthlyIncome = activeRecurring
    .filter((recurring) => recurring.type === 'Income' && recurring.frequency === 'Monthly')
    .reduce((sum, recurring) => sum + recurring.amount, 0)

  const totalMonthlyExpenses = activeRecurring
    .filter((recurring) => recurring.type === 'Expense' && recurring.frequency === 'Monthly')
    .reduce((sum, recurring) => sum + recurring.amount, 0)

  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case 'Daily':
        return t('recurring.daily')
      case 'Weekly':
        return t('recurring.weekly')
      case 'Monthly':
        return t('recurring.monthly')
      case 'Yearly':
        return t('recurring.yearly')
      default:
        return frequency
    }
  }

  const renderRecurringCard = (recurring: RecurringTransaction) => (
    <Card key={recurring.id} className={cn(!recurring.isActive && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'mt-1 rounded-full p-2',
                recurring.type === 'Income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
              )}
            >
              {recurring.type === 'Income' ? (
                <ArrowUpCircle className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div>
              <p className="font-medium">{recurring.description || recurring.category}</p>
              <p className="text-sm text-muted-foreground">
                {recurring.category} | {recurring.account?.name}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Repeat className="h-3 w-3" />
                  {formatFrequency(recurring.frequency)}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {t('recurring.nextDue')}: {new Date(recurring.nextDueDate).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className={cn('text-lg font-bold', recurring.type === 'Income' ? 'text-green-600' : 'text-red-600')}>
              {recurring.type === 'Income' ? '+' : '-'}{formatILS(recurring.amount)}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToggleActive(recurring)}
              title={recurring.isActive ? t('recurring.pause') : t('recurring.resume')}
            >
              {recurring.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(recurring)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => {
                setEditingRecurring(recurring)
                setIsDeleteOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderForm = (isEdit: boolean) => (
    <form onSubmit={(e) => handleSubmit(e, isEdit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('common.type')}</Label>
          <Select
            value={formType}
            onValueChange={(value) => {
              setFormType(value as 'Income' | 'Expense')
              setFormCategory('')
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Income">{t('common.income')}</SelectItem>
              <SelectItem value="Expense">{t('common.expense')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('common.amount')} (ILS)</Label>
          <Input
            data-testid="recurring-amount-input"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('common.description')}</Label>
        <Input
          data-testid="recurring-description-input"
          placeholder={t('recurring.descriptionPlaceholder')}
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('common.category')}</Label>
          <Select value={formCategory} onValueChange={setFormCategory}>
            <SelectTrigger data-testid="recurring-category-trigger">
              <SelectValue placeholder={t('common.category')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem
                  key={category}
                  value={category}
                  data-testid={`recurring-category-option-${category.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('common.account')}</Label>
          <Select value={formAccountId} onValueChange={setFormAccountId}>
            <SelectTrigger data-testid="recurring-account-trigger">
              <SelectValue placeholder={t('common.account')} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id} data-testid={`recurring-account-option-${account.id}`}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('recurring.frequency')}</Label>
          <Select value={formFrequency} onValueChange={setFormFrequency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((frequency) => (
                <SelectItem key={frequency.value} value={frequency.value}>
                  {frequency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('common.ownership')}</Label>
          <Select value={formOwnership} onValueChange={setFormOwnership}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Personal">{t('common.personal')}</SelectItem>
              <SelectItem value="Joint">{t('common.joint')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('recurring.startDate')}</Label>
          <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t('recurring.endDate')} ({t('common.optional')})</Label>
          <Input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
        </div>
      </div>

      {isEdit && (
        <div className="flex items-center gap-2">
          <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
          <Label>{t('recurring.active')}</Label>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => (isEdit ? setIsEditOpen(false) : setIsAddOpen(false))}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="recurring-submit-button">
          {isSubmitting ? t('common.saving') : isEdit ? t('common.saveChanges') : t('recurring.add')}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('recurring.title')}</h1>
          <p className="text-muted-foreground">{t('recurring.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="process-recurring-button" variant="outline" onClick={handleProcessNow}>
            <Play className="me-2 h-4 w-4" />
            {t('recurring.processNow')}
          </Button>
          <Button onClick={openAddDialog} data-testid="add-recurring-button">
            <Plus className="me-2 h-4 w-4" />
            {t('recurring.add')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                <ArrowUpCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('recurring.monthlyIncome')}</p>
                <p className="text-xl font-bold text-green-600">{formatILS(totalMonthlyIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
                <ArrowDownCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('recurring.monthlyExpenses')}</p>
                <p className="text-xl font-bold text-red-600">{formatILS(totalMonthlyExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                <Repeat className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('recurring.activeCount')}</p>
                <p className="text-xl font-bold">{activeRecurring.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeRecurring.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('recurring.active')}</h2>
          <div className="space-y-3">{activeRecurring.map(renderRecurringCard)}</div>
        </div>
      )}

      {pausedRecurring.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">{t('recurring.paused')}</h2>
          <div className="space-y-3">{pausedRecurring.map(renderRecurringCard)}</div>
        </div>
      )}

      {recurringTransactions.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex h-[200px] flex-col items-center justify-center text-center">
            <Repeat className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">{t('recurring.empty')}</p>
            <p className="text-muted-foreground">{t('recurring.emptyDescription')}</p>
            <Button className="mt-4" onClick={openAddDialog}>
              <Plus className="me-2 h-4 w-4" />
              {t('recurring.add')}
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('recurring.add')}</DialogTitle>
            <DialogDescription>{t('recurring.addDescription')}</DialogDescription>
          </DialogHeader>
          {renderForm(false)}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('recurring.edit')}</DialogTitle>
            <DialogDescription>{t('recurring.editDescription')}</DialogDescription>
          </DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('recurring.delete')}</DialogTitle>
            <DialogDescription>{t('recurring.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
