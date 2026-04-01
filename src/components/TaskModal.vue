<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Task } from '../msw-mocks/data/tasks.data'
import type { UpdateTaskPayload } from '../composables/useTasks'

interface Props {
  task: Task
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

const emit = defineEmits<{
  submit: [payload: UpdateTaskPayload]
  close: []
}>()

const title = ref('')
const description = ref('')
const dueDate = ref('')
const isCompleted = ref(false)
const titleError = ref('')

function initFromTask(task: Task) {
  title.value = task.Title
  description.value = task.Description ?? ''
  dueDate.value = task.DueDate ?? ''
  isCompleted.value = task.IsCompleted
}

onMounted(() => initFromTask(props.task))

watch(
  () => props.task,
  (newTask) => initFromTask(newTask),
  { deep: true },
)

function validate(): boolean {
  if (!title.value.trim()) {
    titleError.value = 'Название не может быть пустым'
    return false
  }
  titleError.value = ''
  return true
}

function handleSubmit() {
  if (!validate()) return

  const payload: UpdateTaskPayload = {
    Title: title.value.trim(),
    Description: description.value.trim() || undefined,
    DueDate: dueDate.value || undefined,
    IsCompleted: isCompleted.value,
  }

  emit('submit', payload)
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="handleClose"
  >
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Редактировать задачу</h2>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600"
          aria-label="Закрыть"
          @click="handleClose"
        >
          ✕
        </button>
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700" for="modal-task-title">
            Название <span class="text-red-500">*</span>
          </label>
          <input
            id="modal-task-title"
            v-model="title"
            type="text"
            class="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="titleError ? 'border-red-500' : 'border-gray-300'"
            placeholder="Введите название задачи"
          />
          <p v-if="titleError" class="text-xs text-red-500">{{ titleError }}</p>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700" for="modal-task-description">
            Описание
          </label>
          <textarea
            id="modal-task-description"
            v-model="description"
            rows="3"
            class="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите описание (необязательно)"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700" for="modal-task-due-date">
            Срок выполнения
          </label>
          <input
            id="modal-task-due-date"
            v-model="dueDate"
            type="date"
            class="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex items-center gap-2">
          <input
            id="modal-task-is-completed"
            v-model="isCompleted"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label class="text-sm font-medium text-gray-700" for="modal-task-is-completed">
            Выполнено
          </label>
        </div>

        <p v-if="props.error" class="text-sm text-red-600">{{ props.error }}</p>

        <div class="flex gap-3 justify-end">
          <button
            type="button"
            class="rounded px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
            @click="handleClose"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="props.loading"
          >
            {{ props.loading ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
