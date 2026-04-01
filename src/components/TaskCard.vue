<script setup lang="ts">
import type { Task } from '../msw-mocks/data/tasks.data'

interface Props {
  task: Task
  canEdit: boolean
  canDelete: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  edit: []
  delete: []
}>()

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}.${month}.${year}`
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2">
    <!-- Title -->
    <h3 class="font-bold text-gray-900 text-base leading-snug">
      {{ props.task.Title }}
    </h3>

    <!-- Description (truncated, max 2 lines) -->
    <p
      v-if="props.task.Description"
      class="text-gray-600 text-sm line-clamp-2"
    >
      {{ props.task.Description }}
    </p>

    <!-- DueDate -->
    <div v-if="props.task.DueDate" class="text-gray-500 text-xs">
      Срок: {{ formatDate(props.task.DueDate) }}
    </div>

    <!-- Status badge -->
    <div>
      <span
        v-if="props.task.IsCompleted"
        class="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full"
      >
        Выполнено
      </span>
      <span
        v-else
        class="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full"
      >
        Активна
      </span>
    </div>

    <!-- Actions -->
    <div v-if="props.canEdit || props.canDelete" class="flex gap-2 mt-1">
      <button
        v-if="props.canEdit"
        class="text-sm text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded-lg transition-colors"
        @click="emit('edit')"
      >
        Редактировать
      </button>
      <button
        v-if="props.canDelete"
        class="text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors"
        @click="emit('delete')"
      >
        Удалить
      </button>
    </div>
  </div>
</template>
