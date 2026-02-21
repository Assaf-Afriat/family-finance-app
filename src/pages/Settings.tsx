import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Palette, Database, Download, Trash2, Pencil, Globe } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import { useToast } from '@/components/ui/toast'

export function Settings() {
  const { t } = useTranslation()
  const { users, currentUser, fetchUsers, setCurrentUser } = useUserStore()
  const { transactions, fetchTransactions } = useTransactionStore()
  const { addToast } = useToast()

  const [editingUser, setEditingUser] = useState<{ id: string; name: string } | null>(null)
  const [newName, setNewName] = useState('')
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleEditUser = (user: { id: string; name: string }) => {
    setEditingUser(user)
    setNewName(user.name)
  }

  const handleSaveUser = async () => {
    if (!editingUser || !newName.trim()) return

    setIsSaving(true)
    try {
      if (window.electronAPI) {
        await window.electronAPI.updateUser(editingUser.id, { name: newName.trim() })
        await fetchUsers()
        if (currentUser?.id === editingUser.id) {
          setCurrentUser({ ...currentUser, name: newName.trim() })
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
    if (!window.electronAPI) {
      addToast({
        title: t('toast.exportDesktopOnly'),
        type: 'error',
      })
      return
    }

    try {
      await fetchTransactions()
      
      const headers = ['Date', 'Description', 'Category', 'Type', 'Ownership', 'Amount']
      const rows = transactions.map(tr => [
        new Date(tr.date).toISOString().split('T')[0],
        tr.description,
        tr.category,
        tr.type,
        tr.ownership,
        tr.amount.toString(),
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      addToast({
        title: t('toast.exportSuccess'),
        description: `${rows.length} transactions exported to CSV.`,
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
              {userList.map((user) => {
                const initials = user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                        {initials}
                      </div>
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
                )
              })}
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
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="me-2 h-4 w-4" />
                {t('common.export')}
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
        <DialogContent>
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
    </div>
  )
}
