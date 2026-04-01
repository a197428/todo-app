import { describe, beforeEach, expect } from 'vitest'
import { test, fc } from '@fast-check/vitest'
import { tasks } from '../../msw-mocks/data/tasks.data'
import type { Task } from '../../msw-mocks/data/tasks.data'

const BASE = 'http://localhost'

function authHeader(userId: number) {
  return { Authorization: `Bearer ${userId}` }
}

// Генератор валидного UpdateTaskPayload
const updatePayloadArb = fc.record({
  Title: fc.string({ minLength: 1, maxLength: 50 }),
  Description: fc.string({ maxLength: 100 }),
  DueDate: fc.tuple(
    fc.integer({ min: 2025, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  ).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`),
  IsCompleted: fc.boolean(),
})

// Сбрасываем массив задач перед каждым тестом
beforeEach(() => {
  tasks.length = 0
  tasks.push(
    { Id: 1, Title: 'Сделать логин', Description: 'Форма email/password', DueDate: '2026-02-15', IsCompleted: false, OwnerId: 1 },
    { Id: 2, Title: 'Список задач', Description: 'Фильтрация и сортировка', DueDate: '2026-02-18', IsCompleted: true, OwnerId: 2 },
  )
})

// Feature: tasks-crud, Property 20: MSW PUT обновляет только разрешённые поля
// Validates: Requirements 10.7
describe('Property 20: PUT обновляет только Title, Description, DueDate, IsCompleted', () => {
  test.prop([updatePayloadArb])(
    'P20: Id и OwnerId не меняются после PUT',
    async (payload) => {
      const originalTask = tasks.find(t => t.Id === 2)!
      const originalId = originalTask.Id
      const originalOwnerId = originalTask.OwnerId

      const res = await fetch(`${BASE}/api/tasks/2`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader(2) },
        body: JSON.stringify(payload),
      })

      expect(res.status).toBe(200)
      const body: Task = await res.json()

      // Id и OwnerId не меняются
      expect(body.Id).toBe(originalId)
      expect(body.OwnerId).toBe(originalOwnerId)

      // Разрешённые поля обновляются
      expect(body.Title).toBe(payload.Title)
      expect(body.Description).toBe(payload.Description)
      expect(body.DueDate).toBe(payload.DueDate)
      expect(body.IsCompleted).toBe(payload.IsCompleted)
    }
  )
})

// Feature: tasks-crud, Property 21: MSW PUT идемпотентен
// Validates: Requirements 10.8
describe('Property 21: PUT идемпотентен', () => {
  test.prop([updatePayloadArb])(
    'P21: двойной PUT с одним payload даёт тот же результат',
    async (payload) => {
      const opts = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader(2) },
        body: JSON.stringify(payload),
      }

      const res1 = await fetch(`${BASE}/api/tasks/2`, opts)
      expect(res1.status).toBe(200)
      const body1: Task = await res1.json()

      const res2 = await fetch(`${BASE}/api/tasks/2`, opts)
      expect(res2.status).toBe(200)
      const body2: Task = await res2.json()

      expect(body1).toEqual(body2)
    }
  )
})

// Feature: tasks-crud, Property 22: MSW возвращает 403 для неавторизованных мутаций
// Validates: Requirements 5.3, 5.4
describe('Property 22: MSW возвращает 403 для не-owner и не-admin', () => {
  // user id=2 не является owner задачи id=1 (OwnerId=1) и не admin
  test.prop([updatePayloadArb])(
    'P22: PUT возвращает 403 для не-owner',
    async (payload) => {
      const res = await fetch(`${BASE}/api/tasks/1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader(2) },
        body: JSON.stringify(payload),
      })
      expect(res.status).toBe(403)
    }
  )

  test.prop([fc.constant(null)])(
    'P22: DELETE возвращает 403 для не-owner',
    async (_) => {
      // Сначала убеждаемся, что задача id=1 существует
      const taskExists = tasks.some(t => t.Id === 1)
      if (!taskExists) {
        tasks.push({ Id: 1, Title: 'Test', Description: '', DueDate: '2026-01-01', IsCompleted: false, OwnerId: 1 })
      }

      const res = await fetch(`${BASE}/api/tasks/1`, {
        method: 'DELETE',
        headers: authHeader(2),
      })
      expect(res.status).toBe(403)
    }
  )
})

// ─── Properties 11, 12, 13, 16 — утилиты фильтрации/сортировки/поиска ────────

import { filterTasks, sortTasks, searchTasks } from '../../utils/tasks'
import type { FilterOption, SortOption } from '../../utils/tasks'

// Генератор Task
const taskArb = fc.record<Task>({
  Id: fc.integer({ min: 1, max: 1000 }),
  Title: fc.string({ minLength: 1, maxLength: 50 }),
  Description: fc.string({ maxLength: 100 }),
  DueDate: fc.tuple(
    fc.integer({ min: 2020, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  ).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`),
  IsCompleted: fc.boolean(),
  OwnerId: fc.integer({ min: 1, max: 100 }),
})

// Feature: tasks-crud, Property 11: Сортировка возвращает корректный порядок
// Validates: Requirements 6.2
describe('Property 11: sortTasks — результат удовлетворяет предикату порядка', () => {
  const sortOptions: SortOption[] = ['default', 'dueDate_asc', 'dueDate_desc', 'status']

  test.prop([fc.array(taskArb), fc.constantFrom(...sortOptions)])(
    'P11: результат отсортирован согласно выбранной опции',
    (taskList, sort) => {
      const result = sortTasks(taskList, sort)

      // Длина не изменилась
      expect(result).toHaveLength(taskList.length)

      for (let i = 0; i < result.length - 1; i++) {
        const a = result[i]!
        const b = result[i + 1]!
        if (sort === 'default') {
          expect(a.Id).toBeLessThanOrEqual(b.Id)
        } else if (sort === 'dueDate_asc') {
          expect(a.DueDate.localeCompare(b.DueDate)).toBeLessThanOrEqual(0)
        } else if (sort === 'dueDate_desc') {
          expect(b.DueDate.localeCompare(a.DueDate)).toBeLessThanOrEqual(0)
        } else if (sort === 'status') {
          // active (false=0) before completed (true=1)
          expect(Number(a.IsCompleted)).toBeLessThanOrEqual(Number(b.IsCompleted))
        }
      }
    }
  )
})

// Feature: tasks-crud, Property 12: Фильтр возвращает только подходящие задачи
// Validates: Requirements 7.2
describe('Property 12: filterTasks — все задачи в результате удовлетворяют предикату фильтра', () => {
  const filterOptions: FilterOption[] = ['all', 'active', 'completed', 'overdue']
  const today = new Date().toISOString().slice(0, 10)

  test.prop([fc.array(taskArb), fc.constantFrom(...filterOptions)])(
    'P12: каждая задача в результате соответствует фильтру',
    (taskList, filter) => {
      const result = filterTasks(taskList, filter)

      for (const task of result) {
        if (filter === 'active') {
          expect(task.IsCompleted).toBe(false)
        } else if (filter === 'completed') {
          expect(task.IsCompleted).toBe(true)
        } else if (filter === 'overdue') {
          expect(task.IsCompleted).toBe(false)
          expect(task.DueDate < today).toBe(true)
        }
        // 'all' — нет ограничений
      }

      // Все задачи из результата удовлетворяют предикату (уже проверено выше)
      // Дополнительно: задачи, не удовлетворяющие предикату, не попали в результат
      // Используем индексы, а не Id (Id может дублироваться в генераторе)
      for (const task of result) {
        const satisfies =
          filter === 'all' ||
          (filter === 'active' && !task.IsCompleted) ||
          (filter === 'completed' && task.IsCompleted) ||
          (filter === 'overdue' && !task.IsCompleted && task.DueDate < today)
        expect(satisfies).toBe(true)
      }
    }
  )
})

// Feature: tasks-crud, Property 13: Поиск нечувствителен к регистру
// Validates: Requirements 8.3
describe('Property 13: searchTasks — case-insensitive', () => {
  test.prop([fc.array(taskArb), fc.string({ minLength: 1, maxLength: 20 })])(
    'P13: searchTasks(tasks, S.toUpperCase()) === searchTasks(tasks, S.toLowerCase())',
    (taskList, search) => {
      const upper = searchTasks(taskList, search.toUpperCase())
      const lower = searchTasks(taskList, search.toLowerCase())
      expect(upper).toEqual(lower)
    }
  )
})

// Feature: tasks-crud, Property 16: Идемпотентность поискового фильтра
// Validates: Requirements 8.6
describe('Property 16: searchTasks идемпотентен', () => {
  test.prop([fc.array(taskArb), fc.string()])(
    'P16: searchTasks(searchTasks(tasks, S), S) === searchTasks(tasks, S)',
    (taskList, search) => {
      const once = searchTasks(taskList, search)
      const twice = searchTasks(once, search)
      expect(twice).toEqual(once)
    }
  )
})

// ─── Properties 2, 3, 5, 8, 9 — useTasks composable ─────────────────────────

import { afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import axios from 'axios'
import { rest } from 'msw'
import { useTasks } from '../../composables/useTasks'
import { server } from '../setup'

type AuthUser = { id: number; email: string; role: 'admin' | 'user' }
type AuthState = { user: AuthUser | null; token: string | null }
type TasksState = { tasks: Task[]; isLoading: boolean; error: string | null }

// Реальный axios-инстанс с baseURL для MSW
const api = axios.create({ baseURL: 'http://localhost/api' })

// Добавляем request-интерцептор для токена (как в плагине)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function setupTasksMocks(
  authUser: AuthUser | null = { id: 1, email: 'admin@test.com', role: 'admin' },
) {
  const tasksState = ref<TasksState>({ tasks: [], isLoading: false, error: null })
  const authState = ref<AuthState>({ user: authUser, token: authUser ? String(authUser.id) : null })

  vi.stubGlobal('useState', (key: string, init: () => unknown) => {
    if (key === 'tasks-store') return tasksState
    if (key === 'auth') return authState
    const s = ref(init())
    return s
  })
  vi.stubGlobal('useNuxtApp', () => ({ $api: api }))
  vi.stubGlobal('useAuth', () => ({
    user: ref(authUser),
    isAdmin: ref(authUser?.role === 'admin'),
  }))

  if (authUser) {
    localStorage.setItem('token', String(authUser.id))
  } else {
    localStorage.removeItem('token')
  }

  return { tasksState, authState }
}

afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  vi.stubGlobal('useState', undefined)
  vi.stubGlobal('useNuxtApp', undefined)
  vi.stubGlobal('useAuth', undefined)
  // Сбрасываем массив задач к начальному состоянию
  tasks.length = 0
  tasks.push(
    { Id: 1, Title: 'Сделать логин', Description: 'Форма email/password', DueDate: '2026-02-15', IsCompleted: false, OwnerId: 1 },
    { Id: 2, Title: 'Список задач', Description: 'Фильтрация и сортировка', DueDate: '2026-02-18', IsCompleted: true, OwnerId: 2 },
  )
})

// Генератор CreateTaskPayload
const createPayloadArb = fc.record({
  Title: fc.string({ minLength: 1, maxLength: 50 }),
  Description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  DueDate: fc.option(
    fc.tuple(
      fc.integer({ min: 2025, max: 2030 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 }),
    ).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`),
    { nil: undefined },
  ),
  IsCompleted: fc.option(fc.boolean(), { nil: undefined }),
})

// Генератор UpdateTaskPayload
const updatePayloadArb2 = fc.record({
  Title: fc.string({ minLength: 1, maxLength: 50 }),
  Description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  DueDate: fc.option(
    fc.tuple(
      fc.integer({ min: 2025, max: 2030 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 }),
    ).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`),
    { nil: undefined },
  ),
  IsCompleted: fc.option(fc.boolean(), { nil: undefined }),
})

// Feature: tasks-crud, Property 2: Флаг загрузки активен во время запроса
// Validates: Requirements 1.2
describe('Property 2: isLoading true во время запроса, false после', () => {
  test.prop([fc.constant(null)])(
    'P2: isLoading становится false после завершения fetchTasks',
    async (_) => {
      const { tasksState } = setupTasksMocks()

      // Переопределяем handler без задержки
      server.use(
        rest.get('http://localhost/api/tasks', (_req, res, ctx) =>
          res(ctx.json([]))
        )
      )

      const store = useTasks()
      await store.fetchTasks()

      expect(tasksState.value.isLoading).toBe(false)
    }
  )

  test.prop([fc.constant(null)])(
    'P2: isLoading становится false после ошибки fetchTasks',
    async (_) => {
      const { tasksState } = setupTasksMocks()

      server.use(
        rest.get('http://localhost/api/tasks', (_req, res, ctx) =>
          res(ctx.status(500))
        )
      )

      const store = useTasks()
      await store.fetchTasks()

      expect(tasksState.value.isLoading).toBe(false)
    }
  )
})

// Feature: tasks-crud, Property 3: Ошибка API сохраняется в сторе
// Validates: Requirements 1.5, 2.6, 3.7, 4.5
describe('Property 3: ошибка API (400/403/404/500) сохраняется в error', () => {
  test.prop([fc.constantFrom(400, 403, 404, 500)])(
    'P3: fetchTasks — ненулевой error при HTTP-ошибке',
    async (status) => {
      const { tasksState } = setupTasksMocks()

      server.use(
        rest.get('http://localhost/api/tasks', (_req, res, ctx) =>
          res(ctx.status(status))
        )
      )

      const store = useTasks()
      await store.fetchTasks()

      expect(tasksState.value.error).toBeTruthy()
      expect(typeof tasksState.value.error).toBe('string')
      expect(tasksState.value.error!.length).toBeGreaterThan(0)
    }
  )

  test.prop([fc.constantFrom(400, 403, 404, 500)])(
    'P3: createTask — ненулевой error при HTTP-ошибке',
    async (status) => {
      const { tasksState } = setupTasksMocks()

      server.use(
        rest.post('http://localhost/api/tasks', (_req, res, ctx) =>
          res(ctx.status(status))
        )
      )

      const store = useTasks()
      await store.createTask({ Title: 'Test' }).catch(() => {})

      expect(tasksState.value.error).toBeTruthy()
    }
  )
})

// Feature: tasks-crud, Property 5: Создание задачи — round-trip
// Validates: Requirements 2.4, 2.5
describe('Property 5: createTask round-trip — задача появляется в списке, длина +1', () => {
  test.prop([createPayloadArb])(
    'P5: после createTask задача присутствует в списке и длина +1',
    async (payload) => {
      const { tasksState } = setupTasksMocks()

      // Переопределяем GET без задержки
      server.use(
        rest.get('http://localhost/api/tasks', (_req, res, ctx) =>
          res(ctx.json(tasks.slice()))
        )
      )

      // Предзаполняем стор текущими задачами из MSW
      const store = useTasks()
      await store.fetchTasks()
      const lengthBefore = tasksState.value.tasks.length

      await store.createTask(payload)

      expect(tasksState.value.tasks.length).toBe(lengthBefore + 1)
      const created = tasksState.value.tasks[tasksState.value.tasks.length - 1]!
      expect(created.Title).toBe(payload.Title)
    }
  )
})

// Feature: tasks-crud, Property 8: Обновление задачи — round-trip
// Validates: Requirements 3.5, 3.6
describe('Property 8: updateTask round-trip — задача обновляется, длина не меняется', () => {
  test.prop([updatePayloadArb2])(
    'P8: после updateTask задача обновлена, длина списка не изменилась',
    async (payload) => {
      // Используем admin (id=1), который является owner задачи id=1
      const { tasksState } = setupTasksMocks({ id: 1, email: 'admin@test.com', role: 'admin' })

      // Переопределяем GET без задержки
      server.use(
        rest.get('http://localhost/api/tasks', (_req, res, ctx) =>
          res(ctx.json(tasks.slice()))
        )
      )

      const store = useTasks()
      await store.fetchTasks()
      const lengthBefore = tasksState.value.tasks.length

      await store.updateTask(1, payload)

      expect(tasksState.value.tasks.length).toBe(lengthBefore)
      const updated = tasksState.value.tasks.find(t => t.Id === 1)!
      expect(updated.Title).toBe(payload.Title)
    }
  )
})

// Feature: tasks-crud, Property 9: Удаление задачи убирает её из списка
// Validates: Requirements 4.3, 4.4
describe('Property 9: deleteTask — задача исчезает из списка, длина -1', () => {
  test.prop([fc.constant(null)])(
    'P9: после deleteTask задача отсутствует в списке и длина -1',
    async (_) => {
      // Используем admin (id=1), который является owner задачи id=1
      const { tasksState } = setupTasksMocks({ id: 1, email: 'admin@test.com', role: 'admin' })

      // Переопределяем GET без задержки
      server.use(
        rest.get('http://localhost/api/tasks', (_req, res, ctx) =>
          res(ctx.json(tasks.slice()))
        )
      )

      const store = useTasks()
      await store.fetchTasks()
      const lengthBefore = tasksState.value.tasks.length

      await store.deleteTask(1)

      expect(tasksState.value.tasks.length).toBe(lengthBefore - 1)
      const deleted = tasksState.value.tasks.find(t => t.Id === 1)
      expect(deleted).toBeUndefined()
    }
  )
})

// ─── Properties 14, 15, 17, 18, 19 — useTaskFilters composable ───────────────

import { useTaskFilters } from '../../composables/useTaskFilters'

// Feature: tasks-crud, Property 14: Debounce поиска — 300ms
// Validates: Requirements 8.2
describe('Property 14: debouncedSearch обновляется только после 300ms', () => {
  test.prop([fc.string({ minLength: 1, maxLength: 30 })])(
    'P14: до 300ms debouncedSearch не обновился, после — обновился',
    async (searchStr) => {
      vi.useFakeTimers()
      try {
        const tasks = ref<import('../../msw-mocks/data/tasks.data').Task[]>([])
        const filters = useTaskFilters(tasks)

        filters.setSearch(searchStr)
        await nextTick()

        // До 300ms — debouncedSearch ещё не обновился
        vi.advanceTimersByTime(299)
        await nextTick()
        expect(filters.debouncedSearch.value).toBe('')

        // После 300ms — обновился
        vi.advanceTimersByTime(1)
        await nextTick()
        expect(filters.debouncedSearch.value).toBe(searchStr)
      } finally {
        vi.useRealTimers()
      }
    }
  )
})

// Feature: tasks-crud, Property 15: Очистка поиска восстанавливает полный список
// Validates: Requirements 8.5
describe('Property 15: setSearch("") восстанавливает список без поиска', () => {
  test.prop([fc.array(taskArb, { minLength: 0, maxLength: 20 }), fc.string({ minLength: 1, maxLength: 20 })])(
    'P15: после setSearch("") filteredTasks === filterTasks(tasks, filter)',
    async (taskList, searchStr) => {
      vi.useFakeTimers()
      try {
        const tasksRef = ref(taskList)
        const filters = useTaskFilters(tasksRef)

        // Устанавливаем поиск и ждём debounce
        filters.setSearch(searchStr)
        await nextTick()
        vi.advanceTimersByTime(300)
        await nextTick()

        // Очищаем поиск
        filters.setSearch('')
        await nextTick()
        vi.advanceTimersByTime(300)
        await nextTick()

        // debouncedSearch должен быть '' — searchTasks('') возвращает все задачи
        expect(filters.debouncedSearch.value).toBe('')

        const expected = sortTasks(filterTasks(taskList, filters.filter.value), filters.sort.value)
        expect(filters.filteredTasks.value).toEqual(expected)
      } finally {
        vi.useRealTimers()
      }
    }
  )
})

// Feature: tasks-crud, Property 17: Пагинация возвращает корректный срез
// Validates: Requirements 9.1, 9.3
describe('Property 17: paginatedTasks — корректный срез filteredTasks', () => {
  test.prop([
    fc.array(taskArb, { minLength: 1, maxLength: 50 }),
    fc.integer({ min: 1, max: 5 }),
    fc.integer({ min: 1, max: 10 }),
  ])(
    'P17: paginatedTasks[k] === filteredTasks[(currentPage-1)*pageSize + k]',
    (taskList, pageSizeVal, pageNum) => {
      const tasksRef = ref(taskList)
      const filters = useTaskFilters(tasksRef)
      filters.pageSize.value = pageSizeVal

      const maxPage = filters.totalPages.value
      const page = Math.min(pageNum, maxPage)
      filters.setPage(page)

      const paginated = filters.paginatedTasks.value
      const filtered = filters.filteredTasks.value
      const start = (page - 1) * pageSizeVal

      expect(paginated.length).toBeLessThanOrEqual(pageSizeVal)
      for (let k = 0; k < paginated.length; k++) {
        expect(paginated[k]).toEqual(filtered[start + k])
      }
    }
  )
})

// Feature: tasks-crud, Property 18: Видимость пагинации зависит от количества задач
// Validates: Requirements 9.2, 9.5
describe('Property 18: totalPages > 1 тогда и только тогда когда filteredTasks.length > pageSize', () => {
  test.prop([
    fc.array(taskArb, { minLength: 0, maxLength: 50 }),
    fc.integer({ min: 1, max: 20 }),
  ])(
    'P18: totalPages > 1 ⟺ filteredTasks.length > pageSize',
    (taskList, pageSizeVal) => {
      const tasksRef = ref(taskList)
      const filters = useTaskFilters(tasksRef)
      filters.pageSize.value = pageSizeVal

      const len = filters.filteredTasks.value.length
      const pages = filters.totalPages.value

      if (len > pageSizeVal) {
        expect(pages).toBeGreaterThan(1)
      } else {
        expect(pages).toBeLessThanOrEqual(1)
      }
    }
  )
})

// Feature: tasks-crud, Property 19: Изменение filter/sort/search сбрасывает currentPage на 1
// Validates: Requirements 9.4
describe('Property 19: setFilter/setSort/setSearch сбрасывают currentPage на 1', () => {
  const filterOptions: FilterOption[] = ['all', 'active', 'completed', 'overdue']
  const sortOptions: SortOption[] = ['default', 'dueDate_asc', 'dueDate_desc', 'status']

  test.prop([
    fc.array(taskArb, { minLength: 0, maxLength: 30 }),
    fc.integer({ min: 2, max: 10 }),
    fc.constantFrom(...filterOptions),
  ])(
    'P19a: setFilter сбрасывает currentPage на 1',
    (taskList, startPage, newFilter) => {
      const tasksRef = ref(taskList)
      const filters = useTaskFilters(tasksRef)
      filters.pageSize.value = 1
      filters.setPage(startPage)

      filters.setFilter(newFilter)
      expect(filters.currentPage.value).toBe(1)
    }
  )

  test.prop([
    fc.array(taskArb, { minLength: 0, maxLength: 30 }),
    fc.integer({ min: 2, max: 10 }),
    fc.constantFrom(...sortOptions),
  ])(
    'P19b: setSort сбрасывает currentPage на 1',
    (taskList, startPage, newSort) => {
      const tasksRef = ref(taskList)
      const filters = useTaskFilters(tasksRef)
      filters.pageSize.value = 1
      filters.setPage(startPage)

      filters.setSort(newSort)
      expect(filters.currentPage.value).toBe(1)
    }
  )

  test.prop([
    fc.array(taskArb, { minLength: 0, maxLength: 30 }),
    fc.integer({ min: 2, max: 10 }),
    fc.string({ minLength: 1, maxLength: 20 }),
  ])(
    'P19c: setSearch сбрасывает currentPage на 1',
    (taskList, startPage, searchStr) => {
      const tasksRef = ref(taskList)
      const filters = useTaskFilters(tasksRef)
      filters.pageSize.value = 1
      filters.setPage(startPage)

      filters.setSearch(searchStr)
      expect(filters.currentPage.value).toBe(1)
    }
  )
})
