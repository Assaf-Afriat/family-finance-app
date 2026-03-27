import { useEffect, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUserStore } from '@/stores/userStore'
import { useAccountStore } from '@/stores/accountStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { getCategoriesByType, useCategoryStore } from '@/stores/categoryStore'
import { useToast } from '@/components/ui/toast'
import { formatILS } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { transactionSchema, validateForm } from '@/lib/validations'

interface AddTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddTransactionModal({
  open,
  onOpenChange,
  onSuccess,
}: AddTransactionModalProps) {
  const { currentUser } = useUserStore()
  const { accounts, fetchAccounts } = useAccountStore()
  const { createTransaction } = useTransactionStore()
  const { fetchDashboardData } = useDashboardStore()
  const { categories: customCategories, fetchCategories } = useCategoryStore()
  const { addToast } = useToast()

  const [type, setType] = useState<'Expense' | 'Income'>('Expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [accountId, setAccountId] = useState('')
  const [ownership, setOwnership] = useState<'Personal' | 'Joint'>('Personal')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      fetchAccounts()
      fetchCategories()
    }
  }, [open, fetchAccounts, fetchCategories])

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id)
    }
  }, [accounts, accountId])

  useEffect(() => {
    setCategory('')
  }, [type])

  const categories = getCategoriesByType(customCategories, type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!currentUser) {
      setError('No user selected')
      return
    }

    const formData = {
      amount: parseFloat(amount) || 0,
      date,
      description: description || category,
      category,
      type,
      ownership,
      accountId,
    }

    const validation = validateForm(transactionSchema, formData)
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0]
      setError(firstError)
      return
    }

    setIsSubmitting(true)

    try {
      await createTransaction({
        ...validation.data,
        date: new Date(validation.data.date).toISOString(),
        userId: currentUser.id,
      })

      await fetchDashboardData(currentUser.id)

      setAmount('')
      setDescription('')
      setCategory('')
      setOwnership('Personal')
      setDate(new Date().toISOString().split('T')[0])

      addToast({
        title: 'Transaction added',
        description: `${type} of ${formatILS(parseFloat(amount) || 0)} has been recorded.`,
        type: 'success',
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to create transaction:', err)
      setError('Failed to create transaction. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Record a new income or expense transaction.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'Expense' ? 'default' : 'outline'}
              className={cn('flex-1', type === 'Expense' && 'bg-red-600 hover:bg-red-700')}
              onClick={() => setType('Expense')}
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              Expense
            </Button>
            <Button
              type="button"
              variant={type === 'Income' ? 'default' : 'outline'}
              className={cn('flex-1', type === 'Income' && 'bg-green-600 hover:bg-green-700')}
              onClick={() => setType('Income')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Income
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ILS)</Label>
            <Input
              id="amount"
              data-testid="transaction-amount-input"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="transaction-category-trigger">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((categoryName) => (
                  <SelectItem
                    key={categoryName}
                    value={categoryName}
                    data-testid={`transaction-category-option-${categoryName.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              data-testid="transaction-description-input"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger data-testid="transaction-account-trigger">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem
                      key={account.id}
                      value={account.id}
                      data-testid={`transaction-account-option-${account.id}`}
                    >
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownership">Ownership</Label>
              <Select value={ownership} onValueChange={(value) => setOwnership(value as 'Personal' | 'Joint')}>
                <SelectTrigger data-testid="transaction-ownership-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal" data-testid="transaction-ownership-option-personal">
                    Personal
                  </SelectItem>
                  <SelectItem value="Joint" data-testid="transaction-ownership-option-joint">
                    Joint
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              data-testid="transaction-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} data-testid="transaction-submit-button">
              {isSubmitting ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
