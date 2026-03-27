import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Trash2, Pencil, Filter, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal'
import { EditTransactionModal } from '@/components/transactions/EditTransactionModal'
import { useTransactionStore } from '@/stores/transactionStore'
import { useUserStore } from '@/stores/userStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { getCategoriesByType, useCategoryStore } from '@/stores/categoryStore'
import { formatILS } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { useShortcutListener } from '@/hooks/useKeyboardShortcuts'
import { TransactionsSkeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'

export function Transactions() {
  const { t } = useTranslation()
  const { currentUser } = useUserStore()
  const { transactions, isLoading, fetchTransactions, updateTransaction, deleteTransaction } = useTransactionStore()
  const { fetchDashboardData } = useDashboardStore()
  const { categories: customCategories, fetchCategories: fetchCustomCategories } = useCategoryStore()
  const { addToast } = useToast()
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [ownershipFilter, setOwnershipFilter] = useState<string>('All')

  useShortcutListener('shortcut:new-transaction', () => setIsAddOpen(true))

  const isElectron = typeof window !== 'undefined' && window.electronAPI

  useEffect(() => {
    if (isElectron && currentUser) {
      fetchTransactions({ userId: currentUser.id })
      fetchCustomCategories()
    }
  }, [currentUser, isElectron, fetchTransactions, fetchCustomCategories])

  const handleDelete = async () => {
    if (!deleteId) return
    
    const transactionToDelete = transactions.find((t) => t.id === deleteId)
    
    setIsDeleting(true)
    try {
      await deleteTransaction(deleteId)
      if (currentUser) {
        await fetchDashboardData(currentUser.id)
      }
      setDeleteId(null)
      
      addToast({
        title: t('toast.transactionDeleted'),
        type: 'success',
        action: transactionToDelete ? {
          label: t('common.undo'),
          onClick: async () => {
            try {
              if (window.electronAPI && currentUser) {
                await window.electronAPI.createTransaction({
                  amount: transactionToDelete.amount,
                  date: new Date(transactionToDelete.date).toISOString(),
                  description: transactionToDelete.description,
                  category: transactionToDelete.category,
                  type: transactionToDelete.type,
                  ownership: transactionToDelete.ownership,
                  accountId: transactionToDelete.accountId,
                  userId: currentUser.id,
                })
                await fetchTransactions({ userId: currentUser.id })
                await fetchDashboardData(currentUser.id)
                addToast({
                  title: t('toast.transactionRestored'),
                  type: 'success',
                })
              }
            } catch (err) {
              console.error('Failed to restore transaction:', err)
              addToast({
                title: t('toast.restoreFailed'),
                type: 'error',
              })
            }
          },
        } : undefined,
      })
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      addToast({
        title: t('toast.deleteFailed'),
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTransactionAdded = () => {
    if (currentUser) {
      fetchTransactions({ userId: currentUser.id })
    }
  }

  const handleEditSave = async (data: {
    id: string
    amount: number
    date: string
    description: string
    category: string
    type: string
    ownership: string
    accountId: string
  }) => {
    await updateTransaction(data.id, {
      amount: data.amount,
      date: data.date,
      description: data.description,
      category: data.category,
      type: data.type,
      ownership: data.ownership,
      accountId: data.accountId,
    })
    if (currentUser) {
      await fetchDashboardData(currentUser.id)
    }
    addToast({
      title: 'Transaction updated',
      type: 'success',
    })
  }

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'All' || t.type === typeFilter
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter
    const matchesOwnership = ownershipFilter === 'All' || t.ownership === ownershipFilter
    
    return matchesSearch && matchesType && matchesCategory && matchesOwnership
  })

  const categoryOptions = [
    'All',
    ...new Set([
      ...getCategoriesByType(customCategories, 'Expense'),
      ...getCategoriesByType(customCategories, 'Income'),
    ]),
  ]

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading && isElectron) {
    return <TransactionsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage all your transactions
          </p>
        </div>
        <Button data-testid="add-transaction-button" onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-xl font-bold text-green-600">{formatILS(totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold text-red-600">{formatILS(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net</p>
                <p className={cn(
                  "text-xl font-bold",
                  totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatILS(totalIncome - totalExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Income">Income</SelectItem>
                <SelectItem value="Expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Ownership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Joint">Joint</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
              Loading transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              type="transactions"
              action={{
                label: t('common.addTransaction'),
                onClick: () => setIsAddOpen(true),
              }}
              className="min-h-[400px] border-0"
            />
          ) : (
            <Table data-testid="transactions-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} data-testid={`transaction-row-${transaction.id}`}>
                    <TableCell className="font-medium">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={transaction.type === 'Income' ? 'success' : 'destructive'}
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{transaction.ownership}</Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {transaction.type === 'Income' ? '+' : '-'}{formatILS(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditTransaction(transaction)}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddTransactionModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={handleTransactionAdded}
      />

      <EditTransactionModal
        open={!!editTransaction}
        onOpenChange={(open) => !open && setEditTransaction(null)}
        transaction={editTransaction}
        onSave={handleEditSave}
      />

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
