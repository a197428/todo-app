<script setup lang="ts">
import { ref } from 'vue'
import type { CreateTaskPayload } from '../composables/useTasks'

interface Props {
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

const emit = defineEmits<{
  submit: [payload: CreateTaskPayload]
  cancel: []
}>()

const title = ref('')
const description = ref('')
const dueDate = ref('')
const isCompleted = ref(false)
const titleError = ref('')

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

  const payload: CreateTaskPayload = {
    Title: title.value.trim(),
  }
  if (description.value.trim()) payload.Description = description.value.trim()
  if (dueDate.value) payload.DueDate = dueDate.value
  payload.IsCompleted = isCompleted.value

  emit('submit', payload)
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-gray-700" for="task-title">
        Название <span class="text-red-500">*</span>
      </label>
      <input
        id="task-title"
        v-model="title"
        type="text"
        class="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="titleError ? 'border-red-500' : 'border-gray-300'"
        placeholder="Введите название задачи"
      />
      <p v-if="titleError" class="text-xs text-red-500">{{ titleError }}</p>
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-gray-700" for="task-description">
        Описание
      </label>
      <textarea
        id="task-description"
        v-model="description"
        rows="3"
        class="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Введите описание (необязательно)"
      />
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-gray-700" for="task-due-date">
        Срок выполнения
      </label>
      <input
        id="task-due-date"
        v-model="dueDate"
        type="date"
        class="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div class="flex items-center gap-2">
      <input
        id="task-is-completed"
        v-model="isCompleted"
        type="checkbox"
        class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <label class="text-sm font-medium text-gray-700" for="task-is-completed">
        Выполнено
      </label>
    </div>

    <p v-if="props.error" class="text-sm text-red-600">{{ props.error }}</p>

    <div class="flex gap-3 justify-end">
      <button
        type="button"
        class="rounded px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
        @click="handleCancel"
      >
        Отмена
      </button>
      <button
        type="submit"
        class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="props.loading"
      >
        {{ props.loading ? 'Сохранение...' : 'Создать' }}
      </button>
    </div>
  </form>
</template>
