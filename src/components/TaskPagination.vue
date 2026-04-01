<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-1">
    <button
      type="button"
      :disabled="currentPage <= 1"
      class="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      @click="emit('update:page', currentPage - 1)"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>

    <button
      v-for="page in totalPages"
      :key="page"
      type="button"
      class="w-9 h-9 text-sm rounded-lg border transition-all duration-150 font-medium"
      :class="page === currentPage
        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
      @click="emit('update:page', page)"
    >
      {{ page }}
    </button>

    <button
      type="button"
      :disabled="currentPage >= totalPages"
      class="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      @click="emit('update:page', currentPage + 1)"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentPage: number
  totalPages: number
}

defineProps<Props>()
const emit = defineEmits<{ 'update:page': [value: number] }>()
</script>
