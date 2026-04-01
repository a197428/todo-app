import { setupServer } from 'msw/node'
import { authHandlersNode } from '../msw-mocks/handlers/auth.handlers'
import { taskHandlersNode } from '../msw-mocks/handlers/tasks.handlers'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'

export const server = setupServer(...authHandlersNode, ...taskHandlersNode)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('defineNuxtPlugin', (fn: Function) => fn)
