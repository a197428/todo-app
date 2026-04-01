import { ref, computed, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { Task } from '../msw-mocks/data/tasks.data'
import { filterTasks, sortTasks, searchTasks } from '../utils/tasks'
import type { FilterOption, SortOption } from '../utils/tasks'

export interface UseTaskFilters {
  filter: Ref<FilterOption>
  sort: Ref<SortOption>
  search: Ref<string>
  debouncedSearch: Ref<string>
  currentPage: Ref<number>
  pageSize: Ref<number>
  filteredTasks: ComputedRef<Task[]>
  paginatedTasks: ComputedRef<Task[]>
  totalPages: ComputedRef<number>
  setFilter(f: FilterOption): void
  setSort(s: SortOption): void
  setSearch(s: string): void
  setPage(p: number): void
}

export function useTaskFilters(tasks: Ref<Task[]> | ComputedRef<Task[]>): UseTaskFilters {
  const filter = ref<FilterOption>('all')
  const sort = ref<SortOption>('default')
  const search = ref('')
  const debouncedSearch = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)

  let timer: ReturnType<typeof setTimeout> | undefined

  watch(search, (val) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedSearch.value = val
    }, 300)
  })

  watch([filter, sort, debouncedSearch], () => {
    currentPage.value = 1
  })

  const filteredTasks = computed<Task[]>(() =>
    sortTasks(
      searchTasks(
        filterTasks(tasks.value, filter.value),
        debouncedSearch.value,
      ),
      sort.value,
    )
  )

  const totalPages = computed<number>(() =>
    Math.max(1, Math.ceil(filteredTasks.value.length / pageSize.value))
  )

  const paginatedTasks = computed<Task[]>(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredTasks.value.slice(start, start + pageSize.value)
  })

  function setFilter(f: FilterOption) {
    filter.value = f
    currentPage.value = 1
  }

  function setSort(s: SortOption) {
    sort.value = s
    currentPage.value = 1
  }

  function setSearch(s: string) {
    search.value = s
    currentPage.value = 1
  }

  function setPage(p: number) {
    currentPage.value = p
  }

  return {
    filter,
    sort,
    search,
    debouncedSearch,
    currentPage,
    pageSize,
    filteredTasks,
    paginatedTasks,
    totalPages,
    setFilter,
    setSort,
    setSearch,
    setPage,
  }
}
