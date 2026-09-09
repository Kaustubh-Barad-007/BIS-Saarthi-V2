import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'
import { DASHBOARD_BY_ROLE } from '@/lib/constants'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:         null,
      token:        null,
      isLoading:    false,
      isHydrated:   false,
      error:        null,

      // Login
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authApi.login(credentials)
          const { user, token } = data
          localStorage.setItem('bis_token', token)
          localStorage.setItem('bis_user', JSON.stringify(user))
          set({ user, token, isLoading: false, error: null })
          return { user, token }
        } catch (err) {
          set({ isLoading: false, error: err.message })
          throw err
        }
      },

      // Register
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authApi.register(userData)
          const { user, token } = data
          localStorage.setItem('bis_token', token)
          localStorage.setItem('bis_user', JSON.stringify(user))
          set({ user, token, isLoading: false, error: null })
          return { user, token }
        } catch (err) {
          set({ isLoading: false, error: err.message })
          throw err
        }
      },

      // Logout (Lightning fast: clears credentials & state instantly)
      logout: async () => {
        localStorage.removeItem('bis_token')
        localStorage.removeItem('bis_user')
        set({ user: null, token: null, error: null })
        try {
          authApi.logout().catch(() => {})
        } catch (_) {}
      },

      // Fetch current user
      fetchMe: async () => {
        const token = localStorage.getItem('bis_token')
        if (!token) {
          set({ isHydrated: true })
          return
        }
        try {
          const data = await authApi.me()
          set({ user: data.user, token, isHydrated: true })
        } catch (_) {
          localStorage.removeItem('bis_token')
          localStorage.removeItem('bis_user')
          set({ user: null, token: null, isHydrated: true })
        }
      },

      // Helpers
      isAuthenticated: () => !!get().token && !!get().user,
      getDashboardRoute: () => {
        const role = get().user?.role
        return DASHBOARD_BY_ROLE[role] || '/'
      },
      clearError: () => set({ error: null }),
    }),
    {
      name:    'bis-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

export default useAuthStore
