<template>
  <div class="flex flex-wrap items-center gap-2">
    <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150"
        :class="currentFilter === option.value
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'"
        @click="onFilterChange(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <select
      :value="currentSort"
      class="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:border-slate-300 transition-colors"
      @change="onSortChange(($event.target as HTMLSelectElement).value as SortOption)"
    >
      <option v-for="option in sortOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FilterOption, SortOption } from '../utils/tasks'

const emit = defineEmits<{
  'update:filter': [value: FilterOption]
  'update:sort': [value: SortOption]
}>()

const currentFilter = ref<FilterOption>('all')
const currentSort = ref<SortOption>('default')

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'completed', label: 'Выполненные' },
  { value: 'overdue', label: 'Просроченные' },
]

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Сортировка: по умолчанию' },
  { value: 'dueDate_asc', label: 'Сортировка: дата ↑' },
  { value: 'dueDate_desc', label: 'Сортировка: дата ↓' },
  { value: 'status', label: 'Сортировка: по статусу' },
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
