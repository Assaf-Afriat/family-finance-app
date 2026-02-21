import { useState } from 'react'
import { Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal'
import { useUserStore } from '@/stores/userStore'
import { useDashboardStore } from '@/stores/dashboardStore'

export function Header() {
  const { currentUser } = useUserStore()
  const { dateFilter, setDateFilter, fetchDashboardData } = useDashboardStore()
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)

  const userName = currentUser?.name || 'Guest'
  const userAvatar = currentUser?.avatar || undefined

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value as typeof dateFilter)
    if (currentUser) {
      fetchDashboardData(currentUser.id)
    }
  }

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground">
              {currentUser ? 'Personal Account' : 'Select a profile'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={dateFilter} onValueChange={handleDateFilterChange}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Button className="gap-2" onClick={() => setIsAddTransactionOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </header>

      <AddTransactionModal
        open={isAddTransactionOpen}
        onOpenChange={setIsAddTransactionOpen}
      />
    </>
  )
}
