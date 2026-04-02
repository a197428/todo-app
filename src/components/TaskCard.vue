<script setup lang="ts">
import type { Task } from '../msw-mocks/data/tasks.data'
import { CheckCircle2, AlertCircle, Clock, CalendarDays, Pencil, Trash2 } from 'lucide-vue-next'

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
  <div class="group bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-sm transition-all duration-200" data-testid="task-card">
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
          class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200"
        >
          <CheckCircle2 class="w-3.5 h-3.5" />
          Выполнена
        </span>
        <span
          v-else-if="isOverdue(props.task)"
          class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200"
        >
          <AlertCircle class="w-3.5 h-3.5" />
          Просрочено
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200"
        >
          <Clock class="w-3.5 h-3.5" />
          Активна
        </span>
      </div>
    </div>

    <p v-if="props.task.Description" class="text-slate-500 text-xs line-clamp-2 leading-relaxed">
      {{ props.task.Description }}
    </p>

    <div class="flex items-center justify-between mt-1">
      <span v-if="props.task.DueDate" class="text-xs text-slate-400 flex items-center gap-1.5">
        <CalendarDays class="w-3.5 h-3.5" />
        {{ formatDate(props.task.DueDate) }}
      </span>

      <div v-if="props.canEdit || props.canDelete" class="flex gap-1.5 ml-auto">
        <button
          v-if="props.canEdit"
          class="text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5"
          @click="emit('edit')"
        >
          <Pencil class="w-3.5 h-3.5" />
          Изменить
        </button>
        <button
          v-if="props.canDelete"
          class="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5"
          @click="emit('delete')"
        >
          <Trash2 class="w-3.5 h-3.5" />
          Удалить
        </button>
      </div>
    </div>
  </div>
</template>
