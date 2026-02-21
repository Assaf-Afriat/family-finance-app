import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  currentUser: User | null
  users: User[]
  isLoading: boolean
  setCurrentUser: (user: User | null) => void
  setUsers: (users: User[]) => void
  setLoading: (loading: boolean) => void
  fetchUsers: () => Promise<void>
  createUser: (name: string, avatar?: string) => Promise<User>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      isLoading: false,

      setCurrentUser: (user) => set({ currentUser: user }),
      setUsers: (users) => set({ users }),
      setLoading: (loading) => set({ isLoading: loading }),

      fetchUsers: async () => {
        set({ isLoading: true })
        try {
          if (window.electronAPI) {
            const users = await window.electronAPI.getUsers()
            set({ users })
          }
        } catch (error) {
          console.error('Failed to fetch users:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      createUser: async (name: string, avatar?: string) => {
        if (!window.electronAPI) {
          throw new Error('Electron API not available')
        }
        const user = await window.electronAPI.createUser({ name, avatar })
        set((state) => ({ users: [...state.users, user] }))
        return user
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
)
