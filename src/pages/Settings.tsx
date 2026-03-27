import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Palette, Database, Download, Trash2, Pencil, Upload, HardDrive, Keyboard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { LanguageSelector } from '@/components/shared/LanguageSelector'
import { useUserStore } from '@/stores/userStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { useAccountStore } from '@/stores/accountStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useRecurringStore } from '@/stores/recurringStore'
import { useToast } from '@/components/ui/toast'
import { parseCSV } from '@/lib/csvImport'
import { AvatarSelector, AvatarDisplay } from '@/components/shared/AvatarSelector'
import { CategoryManagement } from '@/components/settings/CategoryManagement'

export function Settings() {
  const { t } = useTranslation()
  const { users, currentUser, fetchUsers, setCurrentUser, setUsers } = useUserStore()
  const { fetchTransactions, createTransaction } = useTransactionStore()
  const { accounts, fetchAccounts, setAccounts } = useAccountStore()
  const { fetchDashboardData } = useDashboardStore()
  const { fetchRecurringTransactions } = useRecurringStore()
  const { addToast } = useToast()

  const [editingUser, setEditingUser] = useState<{ id: string; name: string; avatar: string | null } | null>(null)
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState<string>('')
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importAccountId, setImportAccountId] = useState('')

  const getTestOverridePath = (key: string) => {
    const overrides = (window as Window & {
      __codexTestOverrides?: Record<string, string>
    }).__codexTestOverrides

    return overrides?.[key]
  }

  const refreshFinanceState = async (userId: string) => {
    await Promise.all([
      fetchAccounts(userId),
      fetchTransactions({ userId }),
      fetchDashboardData(userId),
      fetchRecurringTransactions(userId),
    ])
  }

  const handleEditUser = (user: { id: string; name: string; avatar: string | null }) => {
    setEditingUser(user)
    setNewName(user.name)
    setNewAvatar(user.avatar || 'blue')
  }

  const handleSaveUser = async () => {
    if (!editingUser || !newName.trim()) return

    setIsSaving(true)
    try {
      if (window.electronAPI) {
        await window.electronAPI.updateUser(editingUser.id, { name: newName.trim(), avatar: newAvatar })
        await fetchUsers()
        if (currentUser?.id === editingUser.id) {
          setCurrentUser({ ...currentUser, name: newName.trim(), avatar: newAvatar })
        }
      }
      addToast({
        title: t('toast.profileUpdated'),
        type: 'success',
      })
      setEditingUser(null)
    } catch (error) {
      console.error('Failed to update user:', error)
      addToast({
        title: t('toast.profileUpdateFailed'),
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUserId) return

    setIsDeleting(true)
    try {
      if (window.electronAPI) {
        await window.electronAPI.deleteUser(deleteUserId)
        await fetchUsers()
        if (currentUser?.id === deleteUserId) {
          setCurrentUser(null)
        }
      }
      addToast({
        title: t('toast.userDeleted'),
        type: 'success',
      })
      setDeleteUserId(null)
    } catch (error) {
      console.error('Failed to delete user:', error)
      addToast({
        title: t('toast.userDeleteFailed'),
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportCSV = async () => {
    if (!window.electronAPI || !currentUser) {
      addToast({
        title: t('toast.exportDesktopOnly'),
        type: 'error',
      })
      return
    }

    try {
      const result = await window.electronAPI.exportTransactionsCSV(
        currentUser.id,
        getTestOverridePath('exportCsv')
      )
      if (result.canceled) return
      if (!result.success) {
        throw new Error(result.error)
      }

      addToast({
        title: t('toast.exportSuccess'),
        description: `${result.rowCount ?? 0} transactions exported to CSV.`,
        type: 'success',
      })
    } catch (error) {
      console.error('Failed to export:', error)
      addToast({
        title: t('toast.exportFailed'),
        type: 'error',
      })
    }
  }

  const handleBackup = async () => {
    if (!window.electronAPI) {
      addToast({
        title: t('toast.exportDesktopOnly'),
        type: 'error',
      })
      return
    }

    try {
      const result = await window.electronAPI.backupDatabase(getTestOverridePath('backupDb'))
      if (result.canceled) return
      
      if (result.success) {
        addToast({
          title: t('toast.backupSuccess'),
          description: result.path || t('toast.backupSaved'),
          type: 'success',
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Backup failed:', error)
      addToast({
        title: t('toast.backupFailed'),
        type: 'error',
      })
    }
  }

  const handleRestore = async () => {
    if (!window.electronAPI) {
      addToast({
        title: t('toast.exportDesktopOnly'),
        type: 'error',
      })
      return
    }

    try {
      const result = await window.electronAPI.restoreDatabase(getTestOverridePath('restoreDb'))
      if (result.canceled) return
      
      if (result.success) {
        const nextUsers = await window.electronAPI.getUsers()
        setUsers(nextUsers)
        const nextCurrentUser = currentUser
          ? nextUsers.find((user) => user.id === currentUser.id) || nextUsers[0] || null
          : nextUsers[0] || null
        setCurrentUser(nextCurrentUser)
        if (nextCurrentUser) {
          await refreshFinanceState(nextCurrentUser.id)
        }

        addToast({
          title: t('toast.restoreSuccess'),
          description: result.path || t('toast.restoreComplete'),
          type: 'success',
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Restore failed:', error)
      addToast({
        title: t('toast.restoreFailed'),
        type: 'error',
      })
    }
  }

  const handleImportClick = async () => {
    if (!currentUser || !window.electronAPI) {
      addToast({
        title: t('toast.exportDesktopOnly'),
        type: 'error',
      })
      return
    }

    const latestAccounts = await window.electronAPI.getAccounts(currentUser.id)
    setAccounts(latestAccounts)

    if (latestAccounts.length === 0) {
      addToast({
        title: t('toast.noAccountsForImport'),
        description: t('toast.createAccountFirst'),
        type: 'error',
      })
      return
    }
    setImportAccountId(latestAccounts[0]?.id || '')
    setImportDialogOpen(true)
  }

  const handleImportCSV = async (file: File) => {
    if (!currentUser || !importAccountId) return

    setIsImporting(true)
    try {
      const content = await file.text()
      const result = parseCSV(content)

      if (!result.success) {
        addToast({
          title: t('toast.importFailed'),
          description: result.errors[0] || 'Unknown error',
          type: 'error',
        })
        return
      }

      let imported = 0
      for (const tx of result.transactions) {
        try {
          await createTransaction({
            amount: tx.amount,
            date: tx.date,
            description: tx.description,
            category: tx.category,
            type: tx.type,
            ownership: tx.ownership,
            accountId: importAccountId,
            userId: currentUser.id,
          })
          imported++
        } catch (err) {
          console.error('Failed to import transaction:', err)
        }
      }

      setImportDialogOpen(false)
      await refreshFinanceState(currentUser.id)
      
      addToast({
        title: t('toast.importSuccess'),
        description: t('toast.importedCount', { count: imported, skipped: result.skipped }),
        type: 'success',
      })
    } catch (error) {
      console.error('Import failed:', error)
      addToast({
        title: t('toast.importFailed'),
        type: 'error',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const userList = users.length > 0 ? users : (currentUser ? [currentUser] : [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('settings.userProfiles')}
            </CardTitle>
            <CardDescription>
              {t('settings.manageFamilyMembers')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userList.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarDisplay avatar={user.avatar} name={user.name} size="md" />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {currentUser?.id === user.id ? t('settings.currentUser') : t('settings.familyMember')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteUserId(user.id)}
                        disabled={userList.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('settings.appearance')}
            </CardTitle>
            <CardDescription>
              {t('settings.customizeLook')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.theme')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.themeDescription')}
                </p>
              </div>
              <ThemeToggle variant="select" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.language')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.languageDescription')}
                </p>
              </div>
              <LanguageSelector />
            </div>
          </CardContent>
        </Card>

        <CategoryManagement />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              {t('settings.keyboardShortcuts')}
            </CardTitle>
            <CardDescription>
              {t('settings.keyboardShortcutsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between py-1 border-b">
                <span>{t('shortcuts.goToDashboard')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+D</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b">
                <span>{t('shortcuts.goToTransactions')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+T</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b">
                <span>{t('shortcuts.goToAccounts')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+A</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b">
                <span>{t('shortcuts.goToBudgets')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+B</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b">
                <span>{t('shortcuts.goToReports')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+R</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b">
                <span>{t('shortcuts.goToSettings')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+,</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>{t('shortcuts.newTransaction')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+N</kbd>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('settings.dataManagement')}
            </CardTitle>
            <CardDescription>
              {t('settings.backupExport')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.exportTransactions')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.exportDescription')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                data-testid="settings-export-button"
              >
                <Download className="me-2 h-4 w-4" />
                {t('common.export')}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.backupDatabase')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.backupDescription')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackup}
                data-testid="settings-backup-button"
              >
                <HardDrive className="me-2 h-4 w-4" />
                {t('settings.backup')}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.restoreDatabase')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.restoreDescription')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                data-testid="settings-restore-button"
              >
                <Upload className="me-2 h-4 w-4" />
                {t('settings.restore')}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.importTransactions')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.importDescription')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                data-testid="settings-import-button"
              >
                <Upload className="me-2 h-4 w-4" />
                {t('settings.import')}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.database')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.databaseDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.about')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('settings.application')}</span>
                <span>{t('app.name')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('common.version')}</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('settings.framework')}</span>
                <span>Electron + React</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings.editProfile')}</DialogTitle>
            <DialogDescription>{t('settings.updateName')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('common.name')}</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('validation.enterName')}
              />
            </div>
            <Separator />
            <AvatarSelector
              value={newAvatar}
              onChange={setNewAvatar}
              name={newName}
              size="md"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving || !newName.trim()}>
              {isSaving ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.deleteUser')}</DialogTitle>
            <DialogDescription>
              {t('settings.confirmDeleteUser')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
              {isDeleting ? t('common.deleting') : t('settings.deleteUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.importTransactions')}</DialogTitle>
            <DialogDescription>
              {t('settings.importDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.selectAccount')}</Label>
              <Select value={importAccountId} onValueChange={setImportAccountId}>
                <SelectTrigger data-testid="settings-import-account-trigger">
                  <SelectValue placeholder={t('settings.selectAccount')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem
                      key={acc.id}
                      value={acc.id}
                      data-testid={`settings-import-account-option-${acc.id}`}
                    >
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.csvFile')}</Label>
              <Input
                type="file"
                accept=".csv"
                data-testid="settings-import-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImportCSV(file)
                }}
                disabled={isImporting || !importAccountId}
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.csvFormat')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
