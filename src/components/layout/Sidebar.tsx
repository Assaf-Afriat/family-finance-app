import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  ArrowRightLeft,
  Wallet,
  PiggyBank,
  FileBarChart,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/transactions', icon: ArrowRightLeft, labelKey: 'nav.transactions' },
  { to: '/accounts', icon: Wallet, labelKey: 'nav.accounts' },
  { to: '/budgets', icon: PiggyBank, labelKey: 'nav.budgets' },
  { to: '/reports', icon: FileBarChart, labelKey: 'nav.reports' },
]

export function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="flex h-full w-64 flex-col border-e bg-card">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <PiggyBank className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-semibold">{t('app.name')}</span>
          <span className="text-xs text-muted-foreground">{t('app.tagline')}</span>
        </div>
      </div>
      
      <Separator />
      
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
      
      <Separator />
      
      <div className="p-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )
          }
        >
          <Settings className="h-5 w-5" />
          {t('nav.settings')}
        </NavLink>
      </div>
    </aside>
  )
}
