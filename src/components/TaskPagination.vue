<template>
  <div v-if="totalPages > 1" class="flex items-center gap-1">
    <button
      type="button"
      :disabled="currentPage <= 1"
      class="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      @click="emit('update:page', currentPage - 1)"
    >
      Назад
    </button>

    <button
      v-for="page in totalPages"
      :key="page"
      type="button"
      :class="[
        'px-3 py-1.5 text-sm rounded-md border transition-colors',
        page === currentPage
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
      ]"
      @click="emit('update:page', page)"
    >
      {{ page }}
    </button>

    <button
      type="button"
      :disabled="currentPage >= totalPages"
      class="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      @click="emit('update:page', currentPage + 1)"
    >
      Вперёд
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentPage: number
  totalPages: number
}

defineProps<Props>()

const emit = defineEmits<{
  'update:page': [value: number]
}>()
</script>
