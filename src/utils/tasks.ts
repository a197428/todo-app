import type { Task } from '../msw-mocks/data/tasks.data'

export type FilterOption = 'all' | 'active' | 'completed' | 'overdue'
export type SortOption = 'default' | 'dueDate_asc' | 'dueDate_desc' | 'status'

export function filterTasks(tasks: Task[], filter: FilterOption): Task[] {
  const today = new Date().toISOString().slice(0, 10)
  switch (filter) {
    case 'all':
      return tasks
    case 'active':
      return tasks.filter(t => !t.IsCompleted && !(t.DueDate && t.DueDate < today))
    case 'completed':
      return tasks.filter(t => t.IsCompleted)
    case 'overdue':
      return tasks.filter(t => !t.IsCompleted && t.DueDate < today)
  }
}

export function sortTasks(tasks: Task[], sort: SortOption): Task[] {
  const copy = [...tasks]
  switch (sort) {
    case 'default':
      return copy.sort((a, b) => a.Id - b.Id)
    case 'dueDate_asc':
      return copy.sort((a, b) => a.DueDate.localeCompare(b.DueDate))
    case 'dueDate_desc':
      return copy.sort((a, b) => b.DueDate.localeCompare(a.DueDate))
    case 'status':
      return copy.sort((a, b) => Number(a.IsCompleted) - Number(b.IsCompleted))
  }
}

export function searchTasks(tasks: Task[], search: string): Task[] {
  if (search === '') return tasks
  const lower = search.toLowerCase()
  return tasks.filter(t => t.Title.toLowerCase().includes(lower))
}
