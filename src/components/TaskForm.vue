<script setup lang="ts">
import { ref } from 'vue'
import { FileText, AlignLeft, CalendarDays, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-vue-next'
import type { CreateTaskPayload } from '../composables/useTasks'

interface Props {
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), { loading: false, error: null })
const emit = defineEmits<{ submit: [payload: CreateTaskPayload]; cancel: [] }>()

const title = ref('')
const description = ref('')
const dueDate = ref('')
const isCompleted = ref(false)
const titleError = ref('')

function validate(): boolean {
  if (!title.value.trim()) {
    titleError.value = 'Название обязательно'
    return false
  }
  titleError.value = ''
  return true
}

function handleSubmit() {
  if (!validate()) return
  const payload: CreateTaskPayload = { Title: title.value.trim() }
  if (description.value.trim()) payload.Description = description.value.trim()
  if (dueDate.value) payload.DueDate = dueDate.value
  payload.IsCompleted = isCompleted.value
  emit('submit', payload)
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5" for="task-title">
        <FileText class="w-4 h-4 text-slate-500" />
        Название <span class="text-red-500">*</span>
      </label>
      <div class="relative">
        <FileText class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id="task-title"
          v-model="title"
          type="text"
          placeholder="Что нужно сделать?"
          class="w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          :class="titleError ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'"
        />
      </div>
      <p v-if="titleError" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle class="w-3.5 h-3.5" />
        {{ titleError }}
      </p>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5" for="task-description">
        <AlignLeft class="w-4 h-4 text-slate-500" />
        Описание
      </label>
      <textarea
        id="task-description"
        v-model="description"
        rows="3"
        placeholder="Дополнительные детали..."
        class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 resize-none hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5" for="task-due-date">
          <CalendarDays class="w-4 h-4 text-slate-500" />
          Срок
        </label>
        <input
          id="task-due-date"
          v-model="dueDate"
          type="date"
          class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>
      <div class="flex items-end pb-2.5">
        <label class="flex items-center gap-2.5 cursor-pointer select-none">
          <div class="relative">
            <input id="task-is-completed" v-model="isCompleted" type="checkbox" class="sr-only peer" />
            <div class="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-indigo-600 transition-colors"></div>
            <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
          </div>
          <CheckCircle2 class="w-4 h-4 text-slate-500" />
          <span class="text-sm text-slate-700">Выполнено</span>
        </label>
      </div>
    </div>

    <div v-if="props.error" class="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
      <AlertCircle class="w-4 h-4 shrink-0" />
      {{ props.error }}
    </div>

    <div class="flex gap-2 justify-end pt-1">
      <button type="button" class="px-4 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5" @click="emit('cancel')">
        <X class="w-4 h-4" />
        Отмена
      </button>
      <button
        type="submit"
        :disabled="props.loading"
        class="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        <Loader2 v-if="props.loading" class="w-4 h-4 animate-spin" />
        {{ props.loading ? 'Сохранение...' : 'Создать' }}
      </button>
    </div>
  </form>
</template>
