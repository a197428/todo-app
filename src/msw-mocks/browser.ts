import { setupWorker } from 'msw'
import { authHandlers } from './handlers/auth.handlers'
import { taskHandlers } from './handlers/tasks.handlers'

export const worker = setupWorker(...authHandlers, ...taskHandlers)
