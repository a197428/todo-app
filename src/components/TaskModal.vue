<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Task } from '../msw-mocks/data/tasks.data'
import type { UpdateTaskPayload } from '../composables/useTasks'

interface Props {
  task: Task
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), { loading: false, error: null })
const emit = defineEmits<{ submit: [payload: UpdateTaskPayload]; close: [] }>()

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
watch(() => props.task, (t) => initFromTask(t), { deep: true })

function validate(): boolean {
  if (!title.value.trim()) { titleError.value = 'Название обязательно'; return false }
  titleError.value = ''
  return true
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    Title: title.value.trim(),
    Description: description.value.trim() || undefined,
    DueDate: dueDate.value || undefined,
    IsCompleted: isCompleted.value,
  })
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="emit('close')">
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="emit('close')" />
    <div class="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
        <h2 class="text-base font-semibold text-slate-900">Редактировать задачу</h2>
        <button type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" @click="emit('close')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form class="flex flex-col gap-4 p-6" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Название <span class="text-red-500">*</span></label>
          <input
            v-model="title"
            type="text"
            class="w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            :class="titleError ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'"
          />
          <p v-if="titleError" class="mt-1.5 text-xs text-red-500">{{ titleError }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Описание</label>
          <textarea v-model="description" rows="3" class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 resize-none hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Срок</label>
            <input v-model="dueDate" type="date" class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
          </div>
          <div class="flex items-end pb-2.5">
            <label class="flex items-center gap-2.5 cursor-pointer select-none">
              <div class="relative">
                <input v-model="isCompleted" type="checkbox" class="sr-only peer" />
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
          <button type="button" class="px-4 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-100 transition-colors" @click="emit('close')">Отмена</button>
          <button type="submit" :disabled="props.loading" class="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2">
            <svg v-if="props.loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ props.loading ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
