import axios from 'axios'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import type { Task } from '../msw-mocks/data/tasks.data'

interface TasksState {
  tasks: Task[]
  isLoading: boolean
  error: string | null
}

export interface CreateTaskPayload {
  Title: string
  Description?: string
  DueDate?: string
  IsCompleted?: boolean
}

export interface UpdateTaskPayload {
  Title: string
  Description?: string
  DueDate?: string
  IsCompleted?: boolean
}

export interface UseTasks {
  tasks: ComputedRef<Task[]>
  isLoading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  fetchTasks(): Promise<void>
  createTask(payload: CreateTaskPayload): Promise<void>
  updateTask(id: number, payload: UpdateTaskPayload): Promise<void>
  deleteTask(id: number): Promise<void>
}

export function useTasks(): UseTasks {
  const state = useState<TasksState>('tasks-store', () => ({
    tasks: [],
    isLoading: false,
    error: null,
  }))

  const tasks = computed(() => state.value.tasks)
  const isLoading = computed(() => state.value.isLoading)
  const error = computed(() => state.value.error)

  function getApi() {
    const { $api } = useNuxtApp()
    return $api as ReturnType<typeof axios.create>
  }

  async function fetchTasks(): Promise<void> {
    state.value = { ...state.value, isLoading: true, error: null }
    try {
      const api = getApi()
      const response = await api.get<Task[]>('/tasks')
      state.value = { tasks: response.data, isLoading: false, error: null }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : String(err)
      state.value = { ...state.value, isLoading: false, error: message }
    }
  }

  async function createTask(payload: CreateTaskPayload): Promise<void> {
    state.value = { ...state.value, isLoading: true, error: null }
    try {
      const api = getApi()
      const response = await api.post<Task>('/tasks', payload)
      state.value = {
        tasks: [...state.value.tasks, response.data],
        isLoading: false,
        error: null,
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : String(err)
      state.value = { ...state.value, isLoading: false, error: message }
      throw err
    }
  }

  async function updateTask(id: number, payload: UpdateTaskPayload): Promise<void> {
    const { user, isAdmin } = useAuth()
    const task = state.value.tasks.find(t => t.Id === id)
    if (task && user.value && user.value.id !== task.OwnerId && !isAdmin.value) {
      throw new Error('Forbidden')
    }

    state.value = { ...state.value, isLoading: true, error: null }
    try {
      const api = getApi()
      const response = await api.put<Task>(`/tasks/${id}`, payload)
      state.value = {
        tasks: state.value.tasks.map(t => (t.Id === id ? response.data : t)),
        isLoading: false,
        error: null,
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : String(err)
      state.value = { ...state.value, isLoading: false, error: message }
      throw err
    }
  }

  async function deleteTask(id: number): Promise<void> {
    const { user, isAdmin } = useAuth()
    const task = state.value.tasks.find(t => t.Id === id)
    if (task && user.value && user.value.id !== task.OwnerId && !isAdmin.value) {
      throw new Error('Forbidden')
    }

    state.value = { ...state.value, isLoading: true, error: null }
    try {
      const api = getApi()
      await api.delete(`/tasks/${id}`)
      state.value = {
        tasks: state.value.tasks.filter(t => t.Id !== id),
        isLoading: false,
        error: null,
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : String(err)
      state.value = { ...state.value, isLoading: false, error: message }
      throw err
    }
  }

  return { tasks, isLoading, error, fetchTasks, createTask, updateTask, deleteTask }
}
