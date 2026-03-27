import { useState, useEffect } from 'react'
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

interface EditAccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: {
    id: string
    name: string
    type: string
    balance: number
    isJoint: boolean
  } | null
  onSave: (data: {
    id: string
    name: string
    type: string
    balance: number
    isJoint: boolean
  }) => Promise<void>
}

const ACCOUNT_TYPES = ['Checking', 'Savings', 'Credit', 'Cash']

export function EditAccountModal({
  open,
  onOpenChange,
  account,
  onSave,
}: EditAccountModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<string>('Checking')
  const [balance, setBalance] = useState('')
  const [isJoint, setIsJoint] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (account) {
      setName(account.name)
      setType(account.type)
      setBalance(account.balance.toString())
      setIsJoint(account.isJoint)
    }
  }, [account])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!account) return

    if (!name.trim()) {
      setError('Please enter an account name')
      return
    }

    setIsSubmitting(true)

    try {
      await onSave({
        id: account.id,
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        isJoint,
      })

      onOpenChange(false)
    } catch (err) {
      console.error('Failed to update account:', err)
      setError('Failed to update account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Update the account details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g., Main Checking"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Account Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              This is a joint account
            </Label>
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
