<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  currentPage: number
  totalPages: number
}

defineProps<Props>()
const emit = defineEmits<{ 'update:page': [value: number] }>()
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-1.5">
    <button
      type="button"
      :disabled="currentPage <= 1"
      class="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      @click="emit('update:page', currentPage - 1)"
    >
      <ChevronLeft class="w-4 h-4" />
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
      <ChevronRight class="w-4 h-4" />
    </button>
  </div>
</template>
