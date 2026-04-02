<script setup lang="ts">
import { AlertTriangle, Loader2, XCircle } from 'lucide-vue-next'

interface Props {
  message?: string
  loading?: boolean
  error?: string | null
}

withDefaults(defineProps<Props>(), { loading: false, error: null })
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="emit('cancel')" />
    <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
      <div class="flex items-start gap-4">
        <div class="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle class="w-5 h-5 text-red-600" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-slate-900 mb-1">Подтвердите действие</h3>
          <p class="text-sm text-slate-500">{{ message ?? 'Вы уверены? Это действие нельзя отменить.' }}</p>
        </div>
      </div>

      <div v-if="error" class="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
        <XCircle class="w-4 h-4 shrink-0" />
        {{ error }}
      </div>

      <div class="flex gap-2 justify-end mt-6">
        <button type="button" class="px-4 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-100 transition-colors" @click="emit('cancel')">
          Отмена
        </button>
        <button
          type="button"
          :disabled="loading"
          data-testid="confirm-delete-btn"
          class="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          @click="emit('confirm')"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          {{ loading ? 'Удаление...' : 'Удалить' }}
        </button>
      </div>
    </div>
  </div>
</template>
