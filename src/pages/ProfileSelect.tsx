import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PiggyBank, Plus, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUserStore } from '@/stores/userStore'

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
]

export function ProfileSelect() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { users, currentUser, isLoading, fetchUsers, setCurrentUser, createUser } = useUserStore()
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const isElectron = typeof window !== 'undefined' && window.electronAPI

  useEffect(() => {
    if (isElectron) {
      fetchUsers()
    }
  }, [isElectron, fetchUsers])

  useEffect(() => {
    if (currentUser) {
      navigate('/')
    }
  }, [currentUser, navigate])

  const handleSelectProfile = (user: User) => {
    setCurrentUser(user)
    navigate('/')
  }

  const handleCreateUser = async () => {
    if (!newUserName.trim()) return

    setIsCreating(true)
    try {
      const user = await createUser(newUserName.trim())
      setCurrentUser(user)
      setIsAddUserOpen(false)
      setNewUserName('')
      navigate('/')
    } catch (error) {
      console.error('Failed to create user:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const displayUsers = isElectron && users.length > 0 
    ? users 
    : [
        { id: '1', name: 'Assaf', avatar: null, createdAt: '', updatedAt: '' },
        { id: '2', name: 'Partner', avatar: null, createdAt: '', updatedAt: '' },
      ]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <PiggyBank className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('app.name')}</h1>
          <p className="text-sm text-muted-foreground">{t('profile.title')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading profiles...</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayUsers.map((user, index) => (
            <Card
              key={user.id}
              className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
              onClick={() => handleSelectProfile(user)}
            >
              <CardContent className="flex flex-col items-center gap-4 p-8">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full ${
                    AVATAR_COLORS[index % AVATAR_COLORS.length]
                  } text-3xl font-bold text-white`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-lg font-medium">{user.name}</span>
              </CardContent>
            </Card>
          ))}

          <Card
            className="cursor-pointer border-dashed transition-all hover:scale-105 hover:shadow-lg hover:border-primary"
            onClick={() => setIsAddUserOpen(true)}
          >
            <CardContent className="flex flex-col items-center gap-4 p-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <span className="text-lg font-medium text-muted-foreground">{t('profile.createNew')}</span>
            </CardContent>
          </Card>
        </div>
      )}

      <Button variant="link" className="mt-8" onClick={() => {
        if (displayUsers.length > 0) {
          handleSelectProfile(displayUsers[0])
        }
      }}>
        Continue as {displayUsers[0]?.name || 'Guest'}
      </Button>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.createNew')}</DialogTitle>
            <DialogDescription>
              {t('profile.enterName')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.yourName')}</Label>
              <Input
                id="name"
                placeholder={t('validation.enterName')}
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateUser()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreating || !newUserName.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('profile.creating')}
                </>
              ) : (
                t('profile.createProfile')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
