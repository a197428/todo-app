import { describe, it, expect, afterEach, vi } from 'vitest'
import { test, fc } from '@fast-check/vitest'
import axios from 'axios'
import { rest } from 'msw'
import { server } from '../setup'

// Изолированный экземпляр axios с теми же интерцепторами, что в src/plugins/axios.ts
const api = axios.create({ baseURL: 'http://localhost/api' })

// request interceptor: добавляет Authorization: Bearer <token> из localStorage
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// response interceptor: при 401 вызывает navigateTo('/login')
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) navigateTo('/login')
    return Promise.reject(error)
  }
)

afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

// ─── 6.2 Property 6: Токен в localStorage → заголовок Authorization ──────────

// Feature: vitest-auth-testing, Property 6: Токен в localStorage определяет заголовок Authorization
test.prop([fc.string({ minLength: 1 }).filter(t => t.trim().length > 0 && t === t.trim())])(
  'Property 6: при наличии токена в localStorage заголовок Authorization присутствует',
  async (token) => {
    server.resetHandlers()
    localStorage.clear()

    let capturedAuth: string | null = null

    server.use(
      rest.get('http://localhost/api/test', (req, res, ctx) => {
        capturedAuth = req.headers.get('authorization')
        return res(ctx.status(200), ctx.json({}))
      })
    )

    localStorage.setItem('token', token)
    await api.get('/test')

    expect(capturedAuth).toBe(`Bearer ${token}`)
  }
)

test.prop([fc.constant(null)])(
  'Property 6: при отсутствии токена заголовок Authorization отсутствует',
  async (_) => {
    let capturedAuth: string | null = null

    server.use(
      rest.get('http://localhost/api/test', (req, res, ctx) => {
        capturedAuth = req.headers.get('authorization')
        return res(ctx.status(200), ctx.json({}))
      })
    )

    // токен не устанавливаем
    await api.get('/test')

    expect(capturedAuth).toBeNull()
  }
)

// ─── 6.3 Property 7: 401 → navigateTo, 200 → без navigateTo ─────────────────

// Feature: vitest-auth-testing, Property 7: Статус ответа определяет вызов navigateTo
describe('Property 7: статус ответа определяет вызов navigateTo', () => {
  it('MSW возвращает 401 → navigateTo("/login") вызван ровно 1 раз', async () => {
    server.use(
      rest.get('http://localhost/api/test', (_req, res, ctx) =>
        res(ctx.status(401))
      )
    )

    await api.get('/test').catch(() => {})

    expect((navigateTo as any)).toHaveBeenCalledTimes(1)
    expect((navigateTo as any)).toHaveBeenCalledWith('/login')
  })

  it('MSW возвращает 200 → navigateTo не вызван', async () => {
    server.use(
      rest.get('http://localhost/api/test', (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({}))
      )
    )

    await api.get('/test')

    expect((navigateTo as any)).not.toHaveBeenCalled()
  })
})
