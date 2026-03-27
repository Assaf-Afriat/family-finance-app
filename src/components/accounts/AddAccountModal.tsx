import { useState } from 'react'
import { Wallet, CreditCard, PiggyBank, Banknote } from 'lucide-react'
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
import { useUserStore } from '@/stores/userStore'
import { useAccountStore } from '@/stores/accountStore'
import { cn } from '@/lib/utils'

interface AddAccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const ACCOUNT_TYPES = [
  { value: 'Checking', label: 'Checking Account', icon: Wallet },
  { value: 'Savings', label: 'Savings Account', icon: PiggyBank },
  { value: 'Credit', label: 'Credit Card', icon: CreditCard },
  { value: 'Cash', label: 'Cash', icon: Banknote },
]

export function AddAccountModal({
  open,
  onOpenChange,
  onSuccess,
}: AddAccountModalProps) {
  const { currentUser } = useUserStore()
  const { createAccount } = useAccountStore()

  const [name, setName] = useState('')
  const [type, setType] = useState<string>('Checking')
  const [balance, setBalance] = useState('')
  const [isJoint, setIsJoint] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!currentUser) {
      setError('No user selected')
      return
    }

    if (!name.trim()) {
      setError('Please enter an account name')
      return
    }

    setIsSubmitting(true)

    try {
      await createAccount({
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        isJoint,
        ownerId: currentUser.id,
      })

      setName('')
      setType('Checking')
      setBalance('')
      setIsJoint(false)

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to create account:', err)
      setError('Failed to create account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
          <DialogDescription>
            Add a new bank account, credit card, or cash account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g., Main Checking, Visa Card"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Account Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map((accountType) => {
                const Icon = accountType.icon
                return (
                  <Button
                    key={accountType.value}
                    type="button"
                    variant={type === accountType.value ? 'default' : 'outline'}
                    className={cn(
                      'justify-start h-auto py-3',
                      type === accountType.value && 'ring-2 ring-primary'
                    )}
                    onClick={() => setType(accountType.value)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {accountType.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance (₪)</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
            {type === 'Credit' && (
              <p className="text-xs text-muted-foreground">
                Enter negative amount for credit card debt
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isJoint"
              checked={isJoint}
              onChange={(e) => setIsJoint(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isJoint" className="font-normal">
              This is a joint account (shared with family)
            </Label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
