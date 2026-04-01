<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
      <p class="text-gray-800 text-base mb-4">
        {{ message ?? 'Вы уверены?' }}
      </p>

      <p v-if="error" class="text-red-600 text-sm mb-4">{{ error }}</p>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          @click="emit('cancel')"
        >
          Отмена
        </button>
        <button
          type="button"
          :disabled="loading"
          class="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="emit('confirm')"
        >
          {{ loading ? 'Загрузка...' : 'Подтвердить' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string
  loading?: boolean
  error?: string | null
}

withDefaults(defineProps<Props>(), {
  message: undefined,
  loading: false,
  error: null,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>
