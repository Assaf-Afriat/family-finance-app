import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider } from '@/components/ui/toast'
import { MainLayout } from '@/components/layout/MainLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Transactions } from '@/pages/Transactions'
import { Accounts } from '@/pages/Accounts'
import { Budgets } from '@/pages/Budgets'
import { Reports } from '@/pages/Reports'
import { RecurringTransactions } from '@/pages/RecurringTransactions'
import { Bills } from '@/pages/Bills'
import { Settings } from '@/pages/Settings'
import { ProfileSelect } from '@/pages/ProfileSelect'
import { useUserStore } from '@/stores/userStore'
import { useThemeStore } from '@/stores/themeStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ErrorBoundary, PageErrorBoundary } from '@/components/shared/ErrorBoundary'

function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts()
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useUserStore()
  
  if (!currentUser) {
    return <Navigate to="/profile-select" replace />
  }
  
  return <>{children}</>
}

export default function App() {
  const { fetchUsers, currentUser, setCurrentUser } = useUserStore()
  const { theme } = useThemeStore()

  // Initialize theme on mount
  useEffect(() => {
    const root = document.documentElement
    const effectiveTheme = theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
    
    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && window.electronAPI
    if (isElectron) {
      fetchUsers().then(() => {
        // Auto-select first user if none selected (for development)
        if (!currentUser) {
          const users = useUserStore.getState().users
          if (users.length > 0) {
            // Don't auto-select, let user choose
          }
        }
      })
    } else {
      // Mock user for browser development
      if (!currentUser) {
        setCurrentUser({
          id: 'mock-user',
          name: 'Assaf',
          avatar: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    }
  }, [fetchUsers, currentUser, setCurrentUser])

  return (
    <ErrorBoundary>
      <ToastProvider>
        <TooltipProvider>
          <BrowserRouter>
            <KeyboardShortcutsProvider>
            <Routes>
              <Route path="/profile-select" element={<ProfileSelect />} />
              <Route element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
<Route path="/" element={<PageErrorBoundary pageName="Dashboard"><Dashboard /></PageErrorBoundary>} />
              <Route path="/transactions" element={<PageErrorBoundary pageName="Transactions"><Transactions /></PageErrorBoundary>} />
              <Route path="/accounts" element={<PageErrorBoundary pageName="Accounts"><Accounts /></PageErrorBoundary>} />
              <Route path="/budgets" element={<PageErrorBoundary pageName="Budgets"><Budgets /></PageErrorBoundary>} />
              <Route path="/recurring" element={<PageErrorBoundary pageName="Recurring Transactions"><RecurringTransactions /></PageErrorBoundary>} />
              <Route path="/bills" element={<PageErrorBoundary pageName="Bills"><Bills /></PageErrorBoundary>} />
              <Route path="/reports" element={<PageErrorBoundary pageName="Reports"><Reports /></PageErrorBoundary>} />
              <Route path="/settings" element={<PageErrorBoundary pageName="Settings"><Settings /></PageErrorBoundary>} />
              </Route>
            </Routes>
          </KeyboardShortcutsProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
