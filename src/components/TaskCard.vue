<script setup lang="ts">
import type { Task } from '../msw-mocks/data/tasks.data'

interface Props {
  task: Task
  canEdit: boolean
  canDelete: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ edit: []; delete: [] }>()

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}.${month}.${year}`
}

function isOverdue(task: Task): boolean {
  if (task.IsCompleted || !task.DueDate) return false
  return task.DueDate < new Date().toISOString().slice(0, 10)
}
</script>

<template>
  <div class="group bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-sm transition-all duration-200">
    <div class="flex items-start justify-between gap-3">
      <h3
        class="font-semibold text-slate-900 text-sm leading-snug"
        :class="{ 'line-through text-slate-400': props.task.IsCompleted }"
      >
        {{ props.task.Title }}
      </h3>

      <div class="flex items-center gap-1.5 shrink-0">
        <span
          v-if="props.task.IsCompleted"
          class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
          Готово
        </span>
        <span
          v-else-if="isOverdue(props.task)"
          class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
          Просрочено
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
          Активна
        </span>
      </div>
    </div>

    <p v-if="props.task.Description" class="text-slate-500 text-xs line-clamp-2 leading-relaxed">
      {{ props.task.Description }}
    </p>

    <div class="flex items-center justify-between mt-1">
      <span v-if="props.task.DueDate" class="text-xs text-slate-400 flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        {{ formatDate(props.task.DueDate) }}
      </span>

      <div v-if="props.canEdit || props.canDelete" class="flex gap-1.5 ml-auto">
        <button
          v-if="props.canEdit"
          class="text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-all duration-150 flex items-center gap-1"
          @click="emit('edit')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Изменить
        </button>
        <button
          v-if="props.canDelete"
          class="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-all duration-150 flex items-center gap-1"
          @click="emit('delete')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Удалить
        </button>
      </div>
    </div>
  </div>
</template>
