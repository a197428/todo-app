<template>
  <div class="flex flex-wrap gap-3 items-center">
    <div class="flex gap-1">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        :class="[
          'px-3 py-1.5 text-sm rounded-md border transition-colors',
          currentFilter === option.value
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
        ]"
        @click="onFilterChange(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <select
      :value="currentSort"
      class="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  { value: 'default', label: 'По умолчанию' },
  { value: 'dueDate_asc', label: 'По дате (возр.)' },
  { value: 'dueDate_desc', label: 'По дате (убыв.)' },
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
