import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MainLayout } from '@/components/layout/MainLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Transactions } from '@/pages/Transactions'
import { Accounts } from '@/pages/Accounts'
import { Budgets } from '@/pages/Budgets'
import { Reports } from '@/pages/Reports'
import { Settings } from '@/pages/Settings'
import { ProfileSelect } from '@/pages/ProfileSelect'
import { useUserStore } from '@/stores/userStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useUserStore()
  
  if (!currentUser) {
    return <Navigate to="/profile-select" replace />
  }
  
  return <>{children}</>
}

export default function App() {
  const { fetchUsers, currentUser, setCurrentUser } = useUserStore()

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
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/profile-select" element={<ProfileSelect />} />
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}
