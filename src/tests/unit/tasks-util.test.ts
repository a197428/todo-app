import { describe, it, expect, vi, afterEach } from 'vitest'
import type { Task } from '../../msw-mocks/data/tasks.data'
import { filterTasks, sortTasks, searchTasks } from '../../utils/tasks'

const makeTask = (overrides: Partial<Task> & Pick<Task, 'Id'>): Task => ({
  Title: 'Task',
  Description: '',
  DueDate: '2026-01-01',
  IsCompleted: false,
  OwnerId: 1,
  ...overrides,
})

// ─── filterTasks ────────────────────────────────────────────────────────────

describe('filterTasks', () => {
  it('returns empty array for empty input', () => {
    expect(filterTasks([], 'all')).toEqual([])
    expect(filterTasks([], 'active')).toEqual([])
    expect(filterTasks([], 'completed')).toEqual([])
    expect(filterTasks([], 'overdue')).toEqual([])
  })

  it('all — returns all tasks', () => {
    const tasks = [makeTask({ Id: 1 }), makeTask({ Id: 2, IsCompleted: true })]
    expect(filterTasks(tasks, 'all')).toHaveLength(2)
  })

  it('active — returns only incomplete tasks', () => {
    const tasks = [
      makeTask({ Id: 1, IsCompleted: false }),
      makeTask({ Id: 2, IsCompleted: true }),
    ]
    const result = filterTasks(tasks, 'active')
    expect(result).toHaveLength(1)
    expect(result[0].Id).toBe(1)
  })

  it('completed — returns only completed tasks', () => {
    const tasks = [
      makeTask({ Id: 1, IsCompleted: false }),
      makeTask({ Id: 2, IsCompleted: true }),
    ]
    const result = filterTasks(tasks, 'completed')
    expect(result).toHaveLength(1)
    expect(result[0].Id).toBe(2)
  })

  it('overdue — returns incomplete tasks with DueDate < today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01'))

    const tasks = [
      makeTask({ Id: 1, IsCompleted: false, DueDate: '2026-02-28' }), // overdue
      makeTask({ Id: 2, IsCompleted: false, DueDate: '2026-03-01' }), // today — not overdue
      makeTask({ Id: 3, IsCompleted: false, DueDate: '2026-03-02' }), // future
      makeTask({ Id: 4, IsCompleted: true, DueDate: '2026-02-01' }),  // completed — excluded
    ]
    const result = filterTasks(tasks, 'overdue')
    expect(result).toHaveLength(1)
    expect(result[0].Id).toBe(1)

    vi.useRealTimers()
  })

  it('overdue — boundary: DueDate === today is NOT overdue', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01'))

    const tasks = [makeTask({ Id: 1, IsCompleted: false, DueDate: '2026-03-01' })]
    expect(filterTasks(tasks, 'overdue')).toHaveLength(0)

    vi.useRealTimers()
  })
})

// ─── sortTasks ───────────────────────────────────────────────────────────────

describe('sortTasks', () => {
  it('default — sorts by Id ascending', () => {
    const tasks = [makeTask({ Id: 3 }), makeTask({ Id: 1 }), makeTask({ Id: 2 })]
    const result = sortTasks(tasks, 'default')
    expect(result.map(t => t.Id)).toEqual([1, 2, 3])
  })

  it('default — does not mutate original array', () => {
    const tasks = [makeTask({ Id: 3 }), makeTask({ Id: 1 })]
    const original = [...tasks]
    sortTasks(tasks, 'default')
    expect(tasks.map(t => t.Id)).toEqual(original.map(t => t.Id))
  })

  it('dueDate_asc — sorts by DueDate ascending', () => {
    const tasks = [
      makeTask({ Id: 1, DueDate: '2026-03-01' }),
      makeTask({ Id: 2, DueDate: '2026-01-01' }),
      makeTask({ Id: 3, DueDate: '2026-02-01' }),
    ]
    const result = sortTasks(tasks, 'dueDate_asc')
    expect(result.map(t => t.DueDate)).toEqual(['2026-01-01', '2026-02-01', '2026-03-01'])
  })

  it('dueDate_desc — sorts by DueDate descending', () => {
    const tasks = [
      makeTask({ Id: 1, DueDate: '2026-01-01' }),
      makeTask({ Id: 2, DueDate: '2026-03-01' }),
      makeTask({ Id: 3, DueDate: '2026-02-01' }),
    ]
    const result = sortTasks(tasks, 'dueDate_desc')
    expect(result.map(t => t.DueDate)).toEqual(['2026-03-01', '2026-02-01', '2026-01-01'])
  })

  it('dueDate_asc — tasks with same DueDate preserve relative order', () => {
    const tasks = [
      makeTask({ Id: 1, DueDate: '2026-01-01' }),
      makeTask({ Id: 2, DueDate: '2026-01-01' }),
    ]
    const result = sortTasks(tasks, 'dueDate_asc')
    expect(result).toHaveLength(2)
    expect(result.every(t => t.DueDate === '2026-01-01')).toBe(true)
  })

  it('status — active tasks come before completed', () => {
    const tasks = [
      makeTask({ Id: 1, IsCompleted: true }),
      makeTask({ Id: 2, IsCompleted: false }),
      makeTask({ Id: 3, IsCompleted: true }),
      makeTask({ Id: 4, IsCompleted: false }),
    ]
    const result = sortTasks(tasks, 'status')
    const completedIndex = result.findIndex(t => t.IsCompleted)
    const lastActiveIndex = result.map(t => t.IsCompleted).lastIndexOf(false)
    expect(lastActiveIndex).toBeLessThan(completedIndex)
  })
})

// ─── searchTasks ─────────────────────────────────────────────────────────────

describe('searchTasks', () => {
  const tasks = [
    makeTask({ Id: 1, Title: 'Hello World' }),
    makeTask({ Id: 2, Title: 'Foo Bar' }),
    makeTask({ Id: 3, Title: 'hello again' }),
  ]

  it('empty string — returns all tasks', () => {
    expect(searchTasks(tasks, '')).toHaveLength(3)
  })

  it('case-insensitive match', () => {
    expect(searchTasks(tasks, 'hello')).toHaveLength(2)
    expect(searchTasks(tasks, 'HELLO')).toHaveLength(2)
    expect(searchTasks(tasks, 'Hello')).toHaveLength(2)
  })

  it('no matches — returns empty array', () => {
    expect(searchTasks(tasks, 'xyz')).toHaveLength(0)
  })

  it('partial match works', () => {
    const result = searchTasks(tasks, 'foo')
    expect(result).toHaveLength(1)
    expect(result[0].Id).toBe(2)
  })
})
