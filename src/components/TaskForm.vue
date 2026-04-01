<script setup lang="ts">
import { ref } from 'vue'
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
      <label class="block text-sm font-medium text-slate-700 mb-1.5" for="task-title">
        Название <span class="text-red-500">*</span>
      </label>
      <input
        id="task-title"
        v-model="title"
        type="text"
        placeholder="Что нужно сделать?"
        class="w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        :class="titleError ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'"
      />
      <p v-if="titleError" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
        {{ titleError }}
      </p>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5" for="task-description">Описание</label>
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
        <label class="block text-sm font-medium text-slate-700 mb-1.5" for="task-due-date">Срок</label>
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
          <span class="text-sm text-slate-700">Выполнено</span>
        </label>
      </div>
    </div>

    <div v-if="props.error" class="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
      <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
      {{ props.error }}
    </div>

    <div class="flex gap-2 justify-end pt-1">
      <button type="button" class="px-4 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-100 transition-colors" @click="emit('cancel')">
        Отмена
      </button>
      <button
        type="submit"
        :disabled="props.loading"
        class="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        <svg v-if="props.loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {{ props.loading ? 'Сохранение...' : 'Создать' }}
      </button>
    </div>
  </form>
</template>
