import { describe, it, expect } from 'vitest'
import { test, fc } from '@fast-check/vitest'
import { rest } from 'msw'
import { server } from '../setup'
import { users } from '../../msw-mocks/data/users.data'

const LOGIN_URL = 'http://localhost/api/auth/login'

async function postLogin(body: unknown): Promise<Response> {
  return fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── 5.1 Конкретные примеры ───────────────────────────────────────────────────

describe('POST /api/auth/login — конкретные примеры', () => {
  it('admin credentials → 200, token: "1", role: "admin"', async () => {
    const res = await postLogin({ email: 'admin@test.com', password: '123456' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.token).toBe('1')
    expect(body.user.role).toBe('admin')
  })

  it('user credentials → 200, role: "user"', async () => {
    const res = await postLogin({ email: 'user@test.com', password: '123456' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.role).toBe('user')
  })

  it('неверный пароль → 401, { message: "Invalid credentials" }', async () => {
    const res = await postLogin({ email: 'admin@test.com', password: 'wrong' })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ message: 'Invalid credentials' })
  })

  it('несуществующий email → 401', async () => {
    const res = await postLogin({ email: 'nobody@test.com', password: '123456' })
    expect(res.status).toBe(401)
  })

  it('пустое тело {} → 401', async () => {
    const res = await postLogin({})
    expect(res.status).toBe(401)
  })
})

// ─── 5.2 Property 3: Валидные credentials → 200 ──────────────────────────────

// Feature: vitest-auth-testing, Property 3: Валидные credentials возвращают корректный ответ
test.prop([fc.integer({ min: 0, max: 1 })])(
  'Property 3: валидные credentials → 200 с корректным ответом',
  async (index) => {
    const user = users[index]!
    const res = await postLogin({ email: user.email, password: user.password })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.token).toBe(String(user.id))
    expect(body.user.id).toBe(user.id)
    expect(body.user.email).toBe(user.email)
    expect(body.user.role).toBe(user.role)
  }
)

// ─── 5.3 Property 4: Невалидные credentials → 401 ────────────────────────────

// Feature: vitest-auth-testing, Property 4: Невалидные credentials возвращают 401
test.prop([
  fc.record({ email: fc.emailAddress(), password: fc.string() }).filter(
    ({ email, password }) =>
      !users.some((u) => u.email === email && u.password === password)
  ),
])(
  'Property 4: невалидные credentials → 401 с { message: "Invalid credentials" }',
  async ({ email, password }) => {
    const res = await postLogin({ email, password })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ message: 'Invalid credentials' })
  }
)

// ─── 5.4 Property 5: Изоляция переопределений MSW-обработчиков ───────────────

// Feature: vitest-auth-testing, Property 5: Изоляция переопределений MSW-обработчиков
describe('Property 5: изоляция server.use переопределений', () => {
  it('тест 1: переопределённый обработчик возвращает кастомный ответ', async () => {
    server.use(
      rest.post(LOGIN_URL, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ token: 'custom' }))
      )
    )
    const res = await postLogin({ email: 'admin@test.com', password: '123456' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.token).toBe('custom')
  })

  it('тест 2: оригинальный обработчик восстановлен после предыдущего теста', async () => {
    const res = await postLogin({ email: 'admin@test.com', password: '123456' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.token).toBe('1')
  })
})
