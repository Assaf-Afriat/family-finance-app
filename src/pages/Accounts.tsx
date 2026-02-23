import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Wallet, CreditCard, PiggyBank, Banknote, Users, Pencil, ArrowRightLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddAccountModal } from '@/components/accounts/AddAccountModal'
import { EditAccountModal } from '@/components/accounts/EditAccountModal'
import { TransferModal } from '@/components/accounts/TransferModal'
import { useAccountStore } from '@/stores/accountStore'
import { useUserStore } from '@/stores/userStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { formatILS } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { AccountsSkeleton } from '@/components/ui/skeleton'

const ACCOUNT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Checking: Wallet,
  Savings: PiggyBank,
  Credit: CreditCard,
  Cash: Banknote,
}

const ACCOUNT_COLORS: Record<string, { bg: string; text: string }> = {
  Checking: { bg: 'bg-blue-100', text: 'text-blue-600' },
  Savings: { bg: 'bg-green-100', text: 'text-green-600' },
  Credit: { bg: 'bg-purple-100', text: 'text-purple-600' },
  Cash: { bg: 'bg-amber-100', text: 'text-amber-600' },
}

export function Accounts() {
  const { t } = useTranslation()
  const { accounts, isLoading, fetchAccounts, updateAccount } = useAccountStore()
  const { currentUser } = useUserStore()
  const { fetchDashboardData } = useDashboardStore()
  const { addToast } = useToast()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<typeof accounts[0] | null>(null)

  const isElectron = typeof window !== 'undefined' && window.electronAPI

  useEffect(() => {
    if (isElectron) {
      fetchAccounts()
    }
  }, [isElectron, fetchAccounts])

  const totalAssets = accounts
    .filter(a => a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0)

  const totalLiabilities = accounts
    .filter(a => a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0)

  const netWorth = totalAssets - totalLiabilities

  const handleAccountAdded = () => {
    fetchAccounts()
  }

  const handleEditSave = async (data: {
    id: string
    name: string
    type: string
    balance: number
    isJoint: boolean
  }) => {
    await updateAccount(data.id, {
      name: data.name,
      type: data.type,
      balance: data.balance,
      isJoint: data.isJoint,
    })
    addToast({
      title: 'Account updated',
      type: 'success',
    })
  }

  const mockAccounts = [
    { id: '1', name: 'Main Checking', type: 'Checking', balance: 45000, isJoint: true },
    { id: '2', name: 'Savings Account', type: 'Savings', balance: 120000, isJoint: true },
    { id: '3', name: 'Credit Card', type: 'Credit', balance: -5000, isJoint: false },
  ]

  const displayAccounts = isElectron && accounts.length > 0 ? accounts : mockAccounts

  if (isLoading && isElectron) {
    return <AccountsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('nav.accounts')}</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts, credit cards, and cash
          </p>
        </div>
        <div className="flex gap-2">
          {accounts.length >= 2 && (
            <Button variant="outline" onClick={() => setIsTransferOpen(true)}>
              <ArrowRightLeft className="me-2 h-4 w-4" />
              {t('transfer.transfer')}
            </Button>
          )}
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            {t('accounts.addAccount')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <PiggyBank className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-xl font-bold text-green-600">{formatILS(totalAssets)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Liabilities</p>
                <p className="text-xl font-bold text-red-600">{formatILS(totalLiabilities)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Worth</p>
                <p className={cn(
                  "text-xl font-bold",
                  netWorth >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatILS(netWorth)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex h-[200px] items-center justify-center text-muted-foreground">
            Loading accounts...
          </div>
        ) : displayAccounts.length === 0 ? (
          <div className="col-span-full flex h-[200px] flex-col items-center justify-center text-muted-foreground">
            <p>No accounts found</p>
            <Button variant="link" onClick={() => setIsAddOpen(true)}>
              Add your first account
            </Button>
          </div>
        ) : (
          displayAccounts.map((account) => {
            const Icon = ACCOUNT_ICONS[account.type] || Wallet
            const colors = ACCOUNT_COLORS[account.type] || ACCOUNT_COLORS.Checking
            
            return (
              <Card key={account.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('rounded-lg p-2', colors.bg)}>
                        <Icon className={cn('h-5 w-5', colors.text)} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{account.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{account.type}</p>
                      </div>
                    </div>
                    {account.isJoint && (
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        Joint
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className={cn(
                    "text-2xl font-bold",
                    account.balance >= 0 ? "text-foreground" : "text-red-600"
                  )}>
                    {formatILS(account.balance)}
                  </p>
                  {account.type === 'Credit' && account.balance < 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Credit card balance (debt)
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setEditAccount(account)}
                  >
                    <Pencil className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <AddAccountModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={handleAccountAdded}
      />

      <EditAccountModal
        open={!!editAccount}
        onOpenChange={(open) => !open && setEditAccount(null)}
        account={editAccount}
        onSave={handleEditSave}
      />

      {currentUser && (
        <TransferModal
          open={isTransferOpen}
          onOpenChange={setIsTransferOpen}
          accounts={accounts}
          userId={currentUser.id}
          onSuccess={() => {
            fetchAccounts()
            fetchDashboardData(currentUser.id)
          }}
        />
      )}
    </div>
  )
}
