<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ClipboardList, Plus, LogOut, Loader2, AlertCircle, ClipboardCheck } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import { useTasks } from '../composables/useTasks'
import { useTaskFilters } from '../composables/useTaskFilters'
import type { Task } from '../msw-mocks/data/tasks.data'
import type { CreateTaskPayload, UpdateTaskPayload } from '../composables/useTasks'
import TaskCard from '../components/TaskCard.vue'
import TaskSearch from '../components/TaskSearch.vue'
import TaskFilter from '../components/TaskFilter.vue'
import TaskPagination from '../components/TaskPagination.vue'
import TaskForm from '../components/TaskForm.vue'
import TaskModal from '../components/TaskModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const { user, isAdmin, logout } = useAuth()
const { tasks, isLoading, error, fetchTasks, createTask, updateTask, deleteTask } = useTasks()
const { paginatedTasks, currentPage, totalPages, setFilter, setSort, setSearch, setPage } = useTaskFilters(tasks)

const showCreateForm = ref(false)
const editingTask = ref<Task | null>(null)
const deletingTask = ref<Task | null>(null)
const formLoading = ref(false)
const formError = ref<string | null>(null)

onMounted(() => {
  fetchTasks()
})

function canEdit(task: Task): boolean {
  return !!user.value && (user.value.id === task.OwnerId || isAdmin.value)
}

function canDelete(task: Task): boolean {
  return canEdit(task)
}

async function handleCreate(payload: CreateTaskPayload) {
  formLoading.value = true
  formError.value = null
  try {
    await createTask(payload)
    showCreateForm.value = false
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : String(err)
  } finally {
    formLoading.value = false
  }
}

async function handleUpdate(payload: UpdateTaskPayload) {
  if (!editingTask.value) return
  formLoading.value = true
  formError.value = null
  try {
    await updateTask(editingTask.value.Id, payload)
    editingTask.value = null
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : String(err)
  } finally {
    formLoading.value = false
  }
}

async function handleDelete() {
  if (!deletingTask.value) return
  formLoading.value = true
  formError.value = null
  try {
    await deleteTask(deletingTask.value.Id)
    deletingTask.value = null
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : String(err)
  } finally {
    formLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header -->
    <header class="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <ClipboardList class="w-4 h-4 text-white" />
        </div>
        <span class="text-sm font-semibold text-slate-900">ToDo App</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
            {{ user?.email?.charAt(0).toUpperCase() }}
          </div>
          <span class="text-sm text-slate-600 hidden sm:block">{{ user?.email }}</span>
          <span v-if="isAdmin" class="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">admin</span>
        </div>
        <button class="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors" @click="logout">
          <LogOut class="w-4 h-4" />
          Выйти
        </button>
      </div>
    </header>

    <main class="px-4 py-6 max-w-3xl mx-auto flex flex-col gap-5">
      <!-- Toolbar -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          class="inline-flex items-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm"
          @click="showCreateForm = true"
        >
          <Plus class="w-4 h-4" />
          Новая задача
        </button>
        <div class="sm:w-64">
          <TaskSearch @update:search="setSearch" />
        </div>
      </div>

      <TaskFilter @update:filter="setFilter" @update:sort="setSort" />

      <!-- Loading -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 class="w-8 h-8 text-indigo-500 animate-spin" />
        <span class="text-sm text-slate-400">Загрузка задач...</span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
        <AlertCircle class="w-5 h-5 shrink-0 text-red-500" />
        <div>
          <p class="font-medium">Ошибка загрузки</p>
          <p class="text-red-600 mt-0.5">{{ error }}</p>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="paginatedTasks.length === 0" class="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <ClipboardCheck class="w-7 h-7 text-slate-400" />
        </div>
        <p class="text-sm font-medium text-slate-600">Задач нет</p>
        <p class="text-xs text-slate-400">Создайте первую задачу или измените фильтр</p>
      </div>

      <!-- Task list -->
      <div v-else class="flex flex-col gap-2.5">
        <TaskCard
          v-for="task in paginatedTasks"
          :key="task.Id"
          :task="task"
          :can-edit="canEdit(task)"
          :can-delete="canDelete(task)"
          @edit="editingTask = task"
          @delete="deletingTask = task"
        />
      </div>

      <TaskPagination :current-page="currentPage" :total-pages="totalPages" @update:page="setPage" />
    </main>

    <!-- Create form modal -->
    <div v-if="showCreateForm" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showCreateForm = false">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showCreateForm = false" />
      <div class="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
        <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 class="text-base font-semibold text-slate-900">Новая задача</h2>
          <button type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" @click="showCreateForm = false">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="p-6">
          <TaskForm :loading="formLoading" :error="formError" @submit="handleCreate" @cancel="showCreateForm = false" />
        </div>
      </div>
    </div>

    <TaskModal v-if="editingTask" :task="editingTask" :loading="formLoading" :error="formError" @submit="handleUpdate" @close="editingTask = null" />
    <ConfirmDialog v-if="deletingTask" :message="`Удалить задачу «${deletingTask.Title}»?`" :loading="formLoading" :error="formError" @confirm="handleDelete" @cancel="deletingTask = null" />
  </div>
</template>
