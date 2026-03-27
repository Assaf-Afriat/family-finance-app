import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useUserStore } from '@/stores/userStore'
import { useDashboardStore } from '@/stores/dashboardStore'

export function Header() {
  const { t } = useTranslation()
  const { currentUser } = useUserStore()
  const { dateFilter, setDateFilter, fetchDashboardData } = useDashboardStore()
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)

  const userName = currentUser?.name || 'Guest'
  const userAvatar = currentUser?.avatar || undefined

  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
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
              {currentUser ? t('header.personalAccount') : t('header.selectProfile')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <Select value={dateFilter} onValueChange={handleDateFilterChange}>
            <SelectTrigger className="w-40">
              <Calendar className="me-2 h-4 w-4" />
              <SelectValue placeholder={t('header.selectPeriod')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">{t('header.thisMonth')}</SelectItem>
              <SelectItem value="last-month">{t('header.lastMonth')}</SelectItem>
              <SelectItem value="this-quarter">{t('header.thisQuarter')}</SelectItem>
              <SelectItem value="ytd">{t('header.yearToDate')}</SelectItem>
              <SelectItem value="last-year">{t('header.lastYear')}</SelectItem>
            </SelectContent>
          </Select>

          <Button className="gap-2" onClick={() => setIsAddTransactionOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('header.addTransaction')}
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
