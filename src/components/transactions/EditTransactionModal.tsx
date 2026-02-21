import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
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
import { useAccountStore } from '@/stores/accountStore'
import { cn } from '@/lib/utils'

interface EditTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: string
    amount: number
    date: string
    description: string
    category: string
    type: string
    ownership: string
    accountId: string
  } | null
  onSave: (data: {
    id: string
    amount: number
    date: string
    description: string
    category: string
    type: string
    ownership: string
    accountId: string
  }) => Promise<void>
}

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

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Other Income',
]

export function EditTransactionModal({
  open,
  onOpenChange,
  transaction,
  onSave,
}: EditTransactionModalProps) {
  const { accounts, fetchAccounts } = useAccountStore()

  const [type, setType] = useState<'Expense' | 'Income'>('Expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [accountId, setAccountId] = useState('')
  const [ownership, setOwnership] = useState<'Personal' | 'Joint'>('Personal')
  const [date, setDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      fetchAccounts()
    }
  }, [open, fetchAccounts])

  useEffect(() => {
    if (transaction) {
      setType(transaction.type as 'Expense' | 'Income')
      setAmount(transaction.amount.toString())
      setDescription(transaction.description)
      setCategory(transaction.category)
      setAccountId(transaction.accountId)
      setOwnership(transaction.ownership as 'Personal' | 'Joint')
      setDate(new Date(transaction.date).toISOString().split('T')[0])
    }
  }, [transaction])

  const categories = type === 'Expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!transaction) return

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!category) {
      setError('Please select a category')
      return
    }

    if (!accountId) {
      setError('Please select an account')
      return
    }

    setIsSubmitting(true)

    try {
      await onSave({
        id: transaction.id,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        description: description || category,
        category,
        type,
        ownership,
        accountId,
      })

      onOpenChange(false)
    } catch (err) {
      console.error('Failed to update transaction:', err)
      setError('Failed to update transaction. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the transaction details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'Expense' ? 'default' : 'outline'}
              className={cn(
                'flex-1',
                type === 'Expense' && 'bg-red-600 hover:bg-red-700'
              )}
              onClick={() => {
                setType('Expense')
                setCategory('')
              }}
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              Expense
            </Button>
            <Button
              type="button"
              variant={type === 'Income' ? 'default' : 'outline'}
              className={cn(
                'flex-1',
                type === 'Income' && 'bg-green-600 hover:bg-green-700'
              )}
              onClick={() => {
                setType('Income')
                setCategory('')
              }}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Income
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₪)</Label>
            <Input
              id="amount"
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
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownership">Ownership</Label>
              <Select
                value={ownership}
                onValueChange={(v) => setOwnership(v as 'Personal' | 'Joint')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Joint">Joint</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
