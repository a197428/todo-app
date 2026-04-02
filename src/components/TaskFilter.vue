<script setup lang="ts">
import { ref } from 'vue'
import { ListFilter, ArrowUpDown, ArrowUpNarrowWide, ArrowDownNarrowWide, CheckCircle2, Clock, AlertCircle, Layers } from 'lucide-vue-next'
import type { FilterOption, SortOption } from '../utils/tasks'

const emit = defineEmits<{
  'update:filter': [value: FilterOption]
  'update:sort': [value: SortOption]
}>()

const currentFilter = ref<FilterOption>('all')
const currentSort = ref<SortOption>('default')

const filterOptions: { value: FilterOption; label: string; icon: typeof ListFilter }[] = [
  { value: 'all', label: 'Все', icon: Layers },
  { value: 'active', label: 'Активные', icon: Clock },
  { value: 'completed', label: 'Выполненные', icon: CheckCircle2 },
  { value: 'overdue', label: 'Просроченные', icon: AlertCircle },
]

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'dueDate_asc', label: 'Дата ↑' },
  { value: 'dueDate_desc', label: 'Дата ↓' },
  { value: 'status', label: 'По статусу' },
]

function onFilterChange(value: FilterOption) {
  currentFilter.value = value
  emit('update:filter', value)
}

function onSortChange(value: SortOption) {
  currentSort.value = value
  emit('update:sort', value)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5"
        :class="currentFilter === option.value
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'"
        @click="onFilterChange(option.value)"
      >
        <component :is="option.icon" class="w-3.5 h-3.5" />
        {{ option.label }}
      </button>
    </div>

    <div class="relative">
      <ArrowUpDown class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      <select
        :value="currentSort"
        class="pl-8 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:border-slate-300 transition-colors appearance-none"
        @change="onSortChange(($event.target as HTMLSelectElement).value as SortOption)"
      >
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>
