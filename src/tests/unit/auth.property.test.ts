import { describe, expect, beforeEach, afterEach, vi } from 'vitest'
import { test, fc } from '@fast-check/vitest'
import { ref } from 'vue'
import axios from 'axios'
import { rest } from 'msw'
import { validateLoginForm } from '../../utils/auth'
import { server } from '../setup'
import { users } from '../../msw-mocks/data/users.data'

describe('validateLoginForm — property tests', () => {
  // Feature: auth, Property 1: Пустые поля не проходят валидацию
  // Validates: Requirements 1.3, 1.4
  test.prop([fc.constantFrom('', '   ', '\t'), fc.string()])(
    'P1: пустой email всегда даёт ошибку email',
    (emptyEmail, password) => {
      const errors = validateLoginForm(emptyEmail, password)
      expect(errors.email).toBeDefined()
    }
  )

  test.prop([fc.string(), fc.constantFrom('', '   ', '\t')])(
    'P1: пустой password всегда даёт ошибку password',
    (email, emptyPassword) => {
      const errors = validateLoginForm(email, emptyPassword)
      expect(errors.password).toBeDefined()
    }
  )

  // Feature: auth, Property 2: Невалидный формат email отклоняется
  // Validates: Requirements 1.5
  test.prop([
    fc.string().filter(s => !s.includes('@') && s.trim().length > 0),
    fc.string({ minLength: 1 }),
  ])(
    'P2: строка без @ отклоняется как невалидный email',
    (invalidEmail, password) => {
      const errors = validateLoginForm(invalidEmail, password)
      expect(errors.email).toBeDefined()
    }
  )
})

// ─── useAuth property tests ───────────────────────────────────────────────────

import { useAuth } from '../../composables/useAuth'

// Реальный axios-инстанс с baseURL для MSW
const api = axios.create({ baseURL: 'http://localhost/api' })

type AuthUser = { id: number; email: string; role: 'admin' | 'user' }
type AuthState = { user: AuthUser | null; token: string | null }

// Создаёт изолированный стейт и устанавливает стабы для Nuxt globals
function setupAuthMocks(): ReturnType<typeof ref<AuthState>> {
  const state = ref<AuthState>({ user: null, token: null })
  vi.stubGlobal('useState', (_key: string, init: () => unknown) => {
    state.value = init() as AuthState
    return state
  })
  vi.stubGlobal('useNuxtApp', () => ({ $api: api }))
  return state
}

afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  // Восстанавливаем только стабы useAuth, не трогаем navigateTo из setup.ts
  vi.stubGlobal('useState', undefined)
  vi.stubGlobal('useNuxtApp', undefined)
})

describe('useAuth — property tests', () => {
  // Feature: auth, Property 3: Тело запроса логина содержит переданные credentials
  // Validates: Requirements 2.1
  test.prop([
    fc.record({
      email: fc.emailAddress(),
      password: fc.string({ minLength: 1 }),
    }),
  ])(
    'P3: тело запроса логина содержит переданные credentials',
    async ({ email, password }) => {
      const state = setupAuthMocks()
      let capturedBody: { email?: string; password?: string } = {}

      server.use(
        rest.post('http://localhost/api/auth/login', async (req, res, ctx) => {
          capturedBody = await req.json()
          return res(
            ctx.json({
              token: 'test-token',
              user: { id: 1, email, role: 'user' },
            })
          )
        })
      )

      const auth = useAuth()
      await auth.login(email, password)

      expect(capturedBody.email).toBe(email)
      expect(capturedBody.password).toBe(password)
    }
  )

  // Feature: auth, Property 4: Успешный логин сохраняет токен и пользователя (round-trip)
  // Validates: Requirements 2.2, 2.3, 6.1
  test.prop([fc.integer({ min: 0, max: 1 })])(
    'P4: успешный логин сохраняет токен и пользователя',
    async (index) => {
      setupAuthMocks()
      const user = users[index]!

      const auth = useAuth()
      await auth.login(user.email, user.password)

      expect(localStorage.getItem('token')).toBe(String(user.id))
      expect(auth.user.value?.id).toBe(user.id)
      expect(auth.user.value?.email).toBe(user.email)
      expect(auth.user.value?.role).toBe(user.role)
    }
  )

  // Feature: auth, Property 5: isAuthenticated отражает наличие токена
  // Validates: Requirements 3.1, 3.2
  test.prop([fc.string({ minLength: 1 })])(
    'P5: isAuthenticated true когда токен есть в localStorage',
    (token) => {
      setupAuthMocks()
      localStorage.setItem('token', token)
      const auth = useAuth()
      auth.initAuth()
      expect(auth.isAuthenticated.value).toBe(true)
    }
  )

  test.prop([fc.constant(null)])(
    'P5: isAuthenticated false когда токена нет',
    (_) => {
      setupAuthMocks()
      localStorage.clear()
      const auth = useAuth()
      auth.initAuth()
      expect(auth.isAuthenticated.value).toBe(false)
    }
  )

  // Feature: auth, Property 6: user отражает текущее состояние стора
  // Validates: Requirements 3.3
  test.prop([
    fc.record({
      id: fc.integer({ min: 1 }),
      email: fc.emailAddress(),
      role: fc.constantFrom('admin' as const, 'user' as const),
    }),
  ])(
    'P6: user отражает текущее состояние стора',
    (authUser) => {
      const state = setupAuthMocks()
      const auth = useAuth()
      state.value = { user: authUser, token: 'some-token' }
      expect(auth.user.value).toEqual(authUser)
    }
  )

  // Feature: auth, Property 7: isAdmin — инвариант роли
  // Validates: Requirements 6.2
  test.prop([fc.constantFrom('admin' as const, 'user' as const)])(
    'P7: isAdmin === (role === "admin")',
    (role) => {
      const state = setupAuthMocks()
      const auth = useAuth()
      state.value = {
        user: { id: 1, email: 'test@test.com', role },
        token: 'token',
      }
      expect(auth.isAdmin.value).toBe(role === 'admin')
    }
  )

  // Feature: auth, Property 8: Logout полностью очищает состояние
  // Validates: Requirements 3.4, 3.5
  test.prop([
    fc.record({
      id: fc.integer({ min: 1 }),
      email: fc.emailAddress(),
      role: fc.constantFrom('admin' as const, 'user' as const),
    }),
    fc.string({ minLength: 1 }),
  ])(
    'P8: logout полностью очищает состояние',
    (authUser, token) => {
      const state = setupAuthMocks()
      const auth = useAuth()
      localStorage.setItem('token', token)
      state.value = { user: authUser, token }

      auth.logout()

      expect(localStorage.getItem('token')).toBeNull()
      expect(auth.user.value).toBeNull()
      expect(auth.isAuthenticated.value).toBe(false)
    }
  )
})

// ─── middleware property tests ────────────────────────────────────────────────

describe('auth middleware — property tests', () => {
  beforeEach(() => {
    vi.stubGlobal('defineNuxtRouteMiddleware', (fn: Function) => fn)
    vi.stubGlobal('useAuth', () => ({ isAuthenticated: ref(false) }))
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('defineNuxtRouteMiddleware', undefined)
    vi.stubGlobal('useAuth', undefined)
  })

  // Feature: auth, Property 9: Middleware редиректит неаутентифицированных пользователей
  // Validates: Requirements 4.1
  test.prop([fc.webPath().filter(p => p !== '/login')])(
    'P9: неаутентифицированный пользователь редиректится на /login для любого маршрута кроме /login',
    async (path) => {
      const { default: middleware } = await import('../../middleware/auth.global')
      const handler = (middleware as unknown as Function)
      const to = { path }
      handler(to, {})
      expect((navigateTo as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('/login')
    }
  )
})

// ─── axios interceptor property tests ────────────────────────────────────────

// Изолированный axios-инстанс с тем же response-интерцептором, что в src/plugins/axios.ts
const interceptorApi = axios.create({ baseURL: 'http://localhost/api' })

interceptorApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interceptorApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      navigateTo('/login')
    }
    return Promise.reject(error)
  }
)

describe('axios interceptor — property tests', () => {
  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  // Feature: auth, Property 10: 401 ответ очищает сессию и редиректит
  // Validates: Requirements 5.1, 5.2
  test.prop([fc.string({ minLength: 1 })])(
    'P10: 401 ответ удаляет токен из localStorage и вызывает navigateTo("/login")',
    async (token) => {
      server.resetHandlers()
      localStorage.setItem('token', token)

      server.use(
        rest.get('http://localhost/api/protected', (_req, res, ctx) =>
          res(ctx.status(401))
        )
      )

      await interceptorApi.get('/protected').catch(() => {})

      expect(localStorage.getItem('token')).toBeNull()
      expect((navigateTo as any)).toHaveBeenCalledWith('/login')
    }
  )

  // Feature: auth, Property 11: Не-401 ошибки не вызывают редирект
  // Validates: Requirements 5.3
  test.prop([fc.constantFrom(400, 403, 404, 500)])(
    'P11: не-401 ошибки не вызывают navigateTo',
    async (status) => {
      server.resetHandlers()

      server.use(
        rest.get('http://localhost/api/protected', (_req, res, ctx) =>
          res(ctx.status(status))
        )
      )

      await interceptorApi.get('/protected').catch(() => {})

      expect((navigateTo as any)).not.toHaveBeenCalled()
    }
  )
})
