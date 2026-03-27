import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Receipt,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pencil,
  Trash2,
  Repeat,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBillStore } from '@/stores/billStore'
import { useUserStore } from '@/stores/userStore'
import { formatILS } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { billSchema, validateForm } from '@/lib/validations'

const BILL_CATEGORIES = [
  'Utilities', 'Rent', 'Insurance', 'Phone', 'Internet',
  'Subscriptions', 'Loan', 'Credit Card', 'Healthcare', 'Other'
]

const FREQUENCIES = ['Monthly', 'Quarterly', 'Yearly']

export function Bills() {
  const { t } = useTranslation()
  const { currentUser } = useUserStore()
  const {
    bills,
    upcomingBills,
    overdueBills,
    isLoading,
    fetchBills,
    fetchUpcomingBills,
    fetchOverdueBills,
    createBill,
    updateBill,
    deleteBill,
    markBillPaid,
  } = useBillStore()
  const { showToast } = useToast()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('Utilities')
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState('Monthly')
  const [reminder, setReminder] = useState('3')
  const [notes, setNotes] = useState('')

  const isElectron = typeof window !== 'undefined' && window.electronAPI

  useEffect(() => {
    if (isElectron && currentUser) {
      fetchBills(currentUser.id)
      fetchUpcomingBills(currentUser.id, 7)
      fetchOverdueBills(currentUser.id)
    }
  }, [isElectron, currentUser, fetchBills, fetchUpcomingBills, fetchOverdueBills])

  const resetForm = () => {
    setName('')
    setAmount('')
    setDueDate('')
    setCategory('Utilities')
    setIsRecurring(false)
    setFrequency('Monthly')
    setReminder('3')
    setNotes('')
    setValidationError('')
  }

  const openEditDialog = (bill: Bill) => {
    setSelectedBill(bill)
    setName(bill.name)
    setAmount(bill.amount.toString())
    setDueDate(new Date(bill.dueDate).toISOString().split('T')[0])
    setCategory(bill.category)
    setIsRecurring(bill.isRecurring)
    setFrequency(bill.frequency || 'Monthly')
    setReminder(bill.reminder.toString())
    setNotes(bill.notes || '')
    setIsEditOpen(true)
  }

  const handleCreate = async () => {
    if (!currentUser) return
    setValidationError('')

    const formData = {
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      dueDate,
      category,
      isRecurring,
      frequency: isRecurring ? frequency : undefined,
      reminder: parseInt(reminder),
      notes: notes.trim() || undefined,
    }

    const validation = validateForm(billSchema, formData)
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0]
      setValidationError(firstError)
      return
    }

    setIsSubmitting(true)
    try {
      await createBill({
        ...validation.data,
        dueDate: new Date(validation.data.dueDate).toISOString(),
        userId: currentUser.id,
      })
      showToast(t('toast.billCreated'), 'success')
      setIsAddOpen(false)
      resetForm()
      fetchUpcomingBills(currentUser.id, 7)
      fetchOverdueBills(currentUser.id)
    } catch (error) {
      console.error('Failed to create bill:', error)
      showToast(t('toast.billCreateFailed'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedBill || !name.trim() || !amount || !dueDate) return

    setIsSubmitting(true)
    try {
      await updateBill(selectedBill.id, {
        name: name.trim(),
        amount: parseFloat(amount),
        dueDate: new Date(dueDate).toISOString(),
        category,
        isRecurring,
        frequency: isRecurring ? frequency : undefined,
        reminder: parseInt(reminder),
        notes: notes.trim() || undefined,
      })
      showToast(t('toast.billUpdated'), 'success')
      setIsEditOpen(false)
      setSelectedBill(null)
      resetForm()
      if (currentUser) {
        fetchUpcomingBills(currentUser.id, 7)
        fetchOverdueBills(currentUser.id)
      }
    } catch (error) {
      console.error('Failed to update bill:', error)
      showToast(t('toast.billUpdateFailed'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedBill) return

    setIsSubmitting(true)
    try {
      await deleteBill(selectedBill.id)
      showToast(t('toast.billDeleted'), 'success')
      setIsDeleteOpen(false)
      setSelectedBill(null)
      if (currentUser) {
        fetchUpcomingBills(currentUser.id, 7)
        fetchOverdueBills(currentUser.id)
      }
    } catch (error) {
      console.error('Failed to delete bill:', error)
      showToast(t('toast.billDeleteFailed'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkPaid = async (bill: Bill) => {
    try {
      await markBillPaid(bill.id)
      showToast(
        bill.isRecurring ? t('toast.billMarkedPaidRecurring') : t('toast.billMarkedPaid'),
        'success'
      )
      if (currentUser) {
        fetchBills(currentUser.id)
        fetchUpcomingBills(currentUser.id, 7)
        fetchOverdueBills(currentUser.id)
      }
    } catch (error) {
      console.error('Failed to mark bill paid:', error)
      showToast(t('toast.markPaidFailed'), 'error')
    }
  }

  const formatDueDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDaysUntilDue = (date: string) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const due = new Date(date)
    due.setHours(0, 0, 0, 0)
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const unpaidBills = bills.filter((b) => !b.isPaid)
  const paidBills = bills.filter((b) => b.isPaid)
  const totalUpcoming = upcomingBills.reduce((sum, b) => sum + b.amount, 0)
  const totalOverdue = overdueBills.reduce((sum, b) => sum + b.amount, 0)

  const renderBillForm = () => (
    <div className="space-y-4">
      {validationError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {validationError}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('bills.name')}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('bills.namePlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('common.amount')} (₪)</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('bills.dueDate')}</Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('common.category')}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BILL_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label>{t('bills.recurring')}</Label>
          <p className="text-sm text-muted-foreground">{t('bills.recurringDescription')}</p>
        </div>
        <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
      </div>

      {isRecurring && (
        <div className="space-y-2">
          <Label>{t('bills.frequency')}</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((freq) => (
                <SelectItem key={freq} value={freq}>{freq}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>{t('bills.reminder')}</Label>
        <Select value={reminder} onValueChange={setReminder}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{t('bills.reminderDay', { count: 1 })}</SelectItem>
            <SelectItem value="3">{t('bills.reminderDays', { count: 3 })}</SelectItem>
            <SelectItem value="7">{t('bills.reminderDays', { count: 7 })}</SelectItem>
            <SelectItem value="14">{t('bills.reminderDays', { count: 14 })}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('bills.notes')} ({t('common.optional')})</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('bills.notesPlaceholder')}
        />
      </div>
    </div>
  )

  const renderBillCard = (bill: Bill) => {
    const daysUntil = getDaysUntilDue(bill.dueDate)
    const isOverdue = daysUntil < 0
    const isDueSoon = daysUntil >= 0 && daysUntil <= 3

    return (
      <Card key={bill.id} className={cn(isOverdue && 'border-red-500/50')}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                isOverdue ? 'bg-red-100 dark:bg-red-900/30' :
                isDueSoon ? 'bg-amber-100 dark:bg-amber-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              )}>
                {isOverdue ? (
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                ) : isDueSoon ? (
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{bill.name}</h4>
                  {bill.isRecurring && (
                    <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{bill.category}</p>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className={cn(isOverdue && 'text-red-600 dark:text-red-400')}>
                    {formatDueDate(bill.dueDate)}
                  </span>
                  {isOverdue ? (
                    <Badge variant="destructive" className="text-xs">
                      {Math.abs(daysUntil)} {t('bills.daysOverdue')}
                    </Badge>
                  ) : daysUntil === 0 ? (
                    <Badge variant="warning" className="text-xs">{t('bills.dueToday')}</Badge>
                  ) : daysUntil <= 3 ? (
                    <Badge variant="warning" className="text-xs">
                      {daysUntil} {t('bills.daysLeft')}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="text-end">
              <p className="text-lg font-semibold">{formatILS(bill.amount)}</p>
              <div className="mt-2 flex gap-1">
                <Button
                  data-testid={`mark-bill-paid-${bill.id}`}
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkPaid(bill)}
                >
                  <CheckCircle className="me-1 h-3.5 w-3.5" />
                  {t('bills.markPaid')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(bill)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedBill(bill)
                    setIsDeleteOpen(true)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading && isElectron) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('bills.title')}</h1>
          <p className="text-muted-foreground">{t('bills.subtitle')}</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          {t('bills.addBill')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('bills.upcomingWeek')}</p>
                <p className="text-xl font-semibold">{formatILS(totalUpcoming)}</p>
                <p className="text-xs text-muted-foreground">
                  {upcomingBills.length} {t('bills.billsCount')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(overdueBills.length > 0 && 'border-red-500/50')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('bills.overdue')}</p>
                <p className="text-xl font-semibold">{formatILS(totalOverdue)}</p>
                <p className="text-xs text-muted-foreground">
                  {overdueBills.length} {t('bills.billsCount')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('bills.paidThisMonth')}</p>
                <p className="text-xl font-semibold">{paidBills.length}</p>
                <p className="text-xs text-muted-foreground">{t('bills.billsPaid')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bills List */}
      {unpaidBills.length === 0 ? (
        <EmptyState
          type="recurring"
          title={t('bills.noBills')}
          description={t('bills.noBillsDescription')}
          action={{
            label: t('bills.addBill'),
            onClick: () => setIsAddOpen(true),
          }}
        />
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('bills.unpaidBills')}</h3>
          {unpaidBills.map(renderBillCard)}
        </div>
      )}

      {/* Add Bill Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('bills.addBill')}</DialogTitle>
            <DialogDescription>{t('bills.addDescription')}</DialogDescription>
          </DialogHeader>
          {renderBillForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !name.trim() || !amount || !dueDate}
            >
              {isSubmitting ? t('common.saving') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bill Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('bills.editBill')}</DialogTitle>
            <DialogDescription>{t('bills.editDescription')}</DialogDescription>
          </DialogHeader>
          {renderBillForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSubmitting || !name.trim() || !amount || !dueDate}
            >
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bills.deleteBill')}</DialogTitle>
            <DialogDescription>
              {t('bills.deleteConfirm', { name: selectedBill?.name })}
            </DialogDescription>
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
