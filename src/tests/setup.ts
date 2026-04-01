import { setupServer } from 'msw/node'
import { authHandlers } from '../msw-mocks/handlers/auth.handlers'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'

export const server = setupServer(...authHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('defineNuxtPlugin', (fn: Function) => fn)
