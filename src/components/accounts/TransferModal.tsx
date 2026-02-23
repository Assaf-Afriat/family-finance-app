import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRightLeft } from 'lucide-react'
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
import { useToast } from '@/components/ui/toast'

interface TransferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  userId: string
  onSuccess: () => void
}

export function TransferModal({
  open,
  onOpenChange,
  accounts,
  userId,
  onSuccess,
}: TransferModalProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()

  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setFromAccountId('')
    setToAccountId('')
    setAmount('')
    setDescription('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fromAccountId) {
      setError(t('transfer.selectFromAccount'))
      return
    }

    if (!toAccountId) {
      setError(t('transfer.selectToAccount'))
      return
    }

    if (fromAccountId === toAccountId) {
      setError(t('transfer.sameAccountError'))
      return
    }

    const transferAmount = parseFloat(amount)
    if (!transferAmount || transferAmount <= 0) {
      setError(t('validation.enterValidAmount'))
      return
    }

    const fromAccount = accounts.find((a) => a.id === fromAccountId)
    if (fromAccount && fromAccount.balance < transferAmount) {
      setError(t('transfer.insufficientFunds'))
      return
    }

    setIsSubmitting(true)

    try {
      if (window.electronAPI) {
        await window.electronAPI.createTransfer({
          amount: transferAmount,
          date: new Date().toISOString(),
          description: description || t('transfer.defaultDescription'),
          fromAccountId,
          toAccountId,
          userId,
        })

        showToast(t('toast.transferSuccess'), 'success')
        resetForm()
        onOpenChange(false)
        onSuccess()
      }
    } catch (err) {
      console.error('Transfer failed:', err)
      setError(t('transfer.failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const fromAccount = accounts.find((a) => a.id === fromAccountId)
  const toAccount = accounts.find((a) => a.id === toAccountId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            {t('transfer.title')}
          </DialogTitle>
          <DialogDescription>{t('transfer.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('transfer.fromAccount')}</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger>
                <SelectValue placeholder={t('transfer.selectFromAccount')} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} (₪{acc.balance.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <ArrowRightLeft className="h-6 w-6 text-muted-foreground rotate-90" />
          </div>

          <div className="space-y-2">
            <Label>{t('transfer.toAccount')}</Label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger>
                <SelectValue placeholder={t('transfer.selectToAccount')} />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((acc) => acc.id !== fromAccountId)
                  .map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} (₪{acc.balance.toLocaleString()})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('common.amount')} (₪)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {fromAccount && (
              <p className="text-xs text-muted-foreground">
                {t('transfer.availableBalance')}: ₪{fromAccount.balance.toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('common.description')} ({t('common.optional')})</Label>
            <Input
              placeholder={t('transfer.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('transfer.transferring') : t('transfer.transfer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
