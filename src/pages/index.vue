<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow px-6 py-4 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">ToDo App</h1>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600">
          {{ user?.email }}
          <span v-if="isAdmin" class="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">admin</span>
        </span>
        <button
          class="text-sm text-red-600 hover:text-red-800 transition-colors"
          @click="logout"
        >
          Выйти
        </button>
      </div>
    </header>

    <main class="p-6 max-w-4xl mx-auto flex flex-col gap-4">
      <!-- Toolbar -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          class="self-start rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          @click="showCreateForm = true"
        >
          Создать задачу
        </button>
        <TaskSearch @update:search="setSearch" />
      </div>

      <TaskFilter
        @update:filter="setFilter"
        @update:sort="setSort"
      />

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-10">
        <span class="text-gray-500 text-sm">Загрузка...</span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {{ error }}
      </div>

      <!-- Empty state -->
      <div
        v-else-if="paginatedTasks.length === 0"
        class="py-16 text-center text-gray-400 text-sm"
      >
        Задач нет
      </div>

      <!-- Task list -->
      <div v-else class="flex flex-col gap-3">
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

      <!-- Pagination -->
      <TaskPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @update:page="setPage"
      />
    </main>

    <!-- Create form -->
    <div
      v-if="showCreateForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Новая задача</h2>
        <TaskForm
          :loading="formLoading"
          :error="formError"
          @submit="handleCreate"
          @cancel="showCreateForm = false"
        />
      </div>
    </div>

    <!-- Edit modal -->
    <TaskModal
      v-if="editingTask"
      :task="editingTask"
      :loading="formLoading"
      :error="formError"
      @submit="handleUpdate"
      @close="editingTask = null"
    />

    <!-- Delete confirm -->
    <ConfirmDialog
      v-if="deletingTask"
      :message="`Удалить задачу «${deletingTask.Title}»?`"
      :loading="formLoading"
      :error="formError"
      @confirm="handleDelete"
      @cancel="deletingTask = null"
    />
  </div>
</template>
