import axios from 'axios'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'

interface AuthUser {
  id: number
  email: string
  role: 'admin' | 'user'
}

interface AuthState {
  user: AuthUser | null
  token: string | null
}

export interface UseAuth {
  isAuthenticated: ComputedRef<boolean>
  isAdmin: ComputedRef<boolean>
  user: ComputedRef<AuthUser | null>
  login(email: string, password: string): Promise<void>
  logout(): void
  initAuth(): void
}

export function useAuth(): UseAuth {
  const state = useState<AuthState>('auth', () => ({ user: null, token: null }))

  const isAuthenticated = computed(() => state.value.token !== null)
  const isAdmin = computed(() => state.value.user?.role === 'admin')
  const user = computed(() => state.value.user)

  function initAuth(): void {
    const token = localStorage.getItem('token')
    if (token) {
      state.value = { ...state.value, token }
    }
  }

  async function login(email: string, password: string): Promise<void> {
    const { $api } = useNuxtApp()
    const api = $api as ReturnType<typeof axios.create>
    const response = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password })
    const { token, user: authUser } = response.data
    localStorage.setItem('token', token)
    state.value = { token, user: authUser }
    navigateTo('/')
  }

  function logout(): void {
    localStorage.removeItem('token')
    state.value = { user: null, token: null }
    navigateTo('/login')
  }

  return { isAuthenticated, isAdmin, user, login, logout, initAuth }
}
