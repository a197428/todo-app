# Implementation Plan: Tasks CRUD

## Overview

Реализация полного CRUD для задач в Nuxt 3 ToDo-приложении. Задачи выполняются инкрементально: сначала MSW-моки и утилиты, затем composables, компоненты, интеграция в страницу и тесты.

## Tasks

- [x] 1. Расширить MSW-обработчики: добавить PUT и DELETE для `/api/tasks/:id`
  - Добавить `rest.put('/api/tasks/:id', ...)` в `src/msw-mocks/handlers/tasks.handlers.ts`
  - Добавить `rest.delete('/api/tasks/:id', ...)` в `src/msw-mocks/handlers/tasks.handlers.ts`
  - PUT: 401 без токена, 404 если задача не найдена, 403 если не owner и не admin, 200 + обновлённая Task
  - DELETE: 401 без токена, 404 если задача не найдена, 403 если не owner и не admin, 204
  - PUT обновляет только поля Title, Description, DueDate, IsCompleted; Id и OwnerId не меняются
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x]* 1.1 Написать unit-тесты для MSW PUT/DELETE обработчиков
    - Тест: 401 без токена (PUT и DELETE)
    - Тест: 404 для несуществующего id
    - Тест: 403 для чужой задачи (не owner, не admin)
    - Тест: 200 + обновлённые данные для owner
    - Тест: 204 для owner при DELETE
    - _Requirements: 10.1–10.6_

  - [x]* 1.2 Написать property-тест для MSW PUT/DELETE
    - **Property 20: MSW PUT обновляет только разрешённые поля**
    - **Validates: Requirements 10.7**
    - **Property 21: MSW PUT идемпотентен**
    - **Validates: Requirements 10.8**
    - **Property 22: MSW возвращает 403 для неавторизованных мутаций**
    - **Validates: Requirements 5.3, 5.4**

- [x] 2. Создать утилитарные функции для фильтрации, сортировки и поиска
  - Создать `src/utils/tasks.ts` с функциями `filterTasks`, `sortTasks`, `searchTasks`
  - `filterTasks(tasks, filter: FilterOption)`: all / active / completed / overdue
  - `sortTasks(tasks, sort: SortOption)`: default / dueDate_asc / dueDate_desc / status
  - `searchTasks(tasks, search: string)`: case-insensitive поиск по Title
  - Экспортировать типы `FilterOption` и `SortOption`
  - _Requirements: 6.2, 7.2, 8.3_

  - [ ]* 2.1 Написать unit-тесты для утилит
    - Тест: `filterTasks` — пустой список, overdue на границе дат, каждый фильтр
    - Тест: `sortTasks` — каждая опция сортировки, задачи с одинаковым DueDate
    - Тест: `searchTasks` — пустая строка, регистр, нет совпадений
    - _Requirements: 6.2, 7.2, 8.3_

  - [ ]* 2.2 Написать property-тесты для утилит
    - **Property 11: Сортировка возвращает корректный порядок**
    - **Validates: Requirements 6.2**
    - **Property 12: Фильтр возвращает только подходящие задачи**
    - **Validates: Requirements 7.2**
    - **Property 13: Поиск нечувствителен к регистру**
    - **Validates: Requirements 8.3**
    - **Property 16: Идемпотентность поискового фильтра**
    - **Validates: Requirements 8.6**

- [x] 3. Создать composable `useTasks`
  - Создать `src/composables/useTasks.ts`
  - `useState('tasks-store')` как глобальный реактивный стор (`TasksState`)
  - Реализовать `fetchTasks()`: GET /api/tasks, управление `isLoading` и `error`
  - Реализовать `createTask(payload)`: POST /api/tasks, append в локальный список
  - Реализовать `updateTask(id, payload)`: клиентская проверка прав → PUT /api/tasks/:id, replace в списке
  - Реализовать `deleteTask(id)`: клиентская проверка прав → DELETE /api/tasks/:id, remove из списка
  - Клиентская проверка: если `user.id !== task.OwnerId && !isAdmin` — отклонить с ошибкой без запроса
  - _Requirements: 1.1, 1.2, 1.5, 2.4, 2.5, 2.6, 3.5, 3.6, 3.7, 4.3, 4.4, 4.5, 5.2_

  - [ ]* 3.1 Написать property-тесты для `useTasks`
    - **Property 2: Флаг загрузки активен во время запроса**
    - **Validates: Requirements 1.2**
    - **Property 3: Ошибка API сохраняется в сторе**
    - **Validates: Requirements 1.5, 2.6, 3.7, 4.5**
    - **Property 5: Создание задачи — round-trip**
    - **Validates: Requirements 2.4, 2.5**
    - **Property 8: Обновление задачи — round-trip**
    - **Validates: Requirements 3.5, 3.6**
    - **Property 9: Удаление задачи убирает её из списка**
    - **Validates: Requirements 4.3, 4.4**

- [x] 4. Создать composable `useTaskFilters`
  - Создать `src/composables/useTaskFilters.ts`
  - Реактивные refs: `filter`, `sort`, `search`, `currentPage`, `pageSize` (default: 10)
  - `debouncedSearch`: обновляется через `watch` + `setTimeout`/`clearTimeout` с задержкой 300ms
  - `filteredTasks`: computed — применяет `filterTasks`, `searchTasks` (по `debouncedSearch`), `sortTasks`
  - `paginatedTasks`: computed — срез `filteredTasks` для текущей страницы
  - `totalPages`: computed — `Math.ceil(filteredTasks.length / pageSize)`
  - `setFilter`, `setSort`, `setSearch` — сбрасывают `currentPage` в 1
  - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 8.1, 8.2, 8.3, 8.5, 9.1, 9.3, 9.4_

  - [ ]* 4.1 Написать property-тесты для `useTaskFilters`
    - **Property 14: Debounce поиска — 300ms**
    - **Validates: Requirements 8.2**
    - **Property 15: Очистка поиска восстанавливает полный список**
    - **Validates: Requirements 8.5**
    - **Property 17: Пагинация возвращает корректный срез**
    - **Validates: Requirements 9.1, 9.3**
    - **Property 18: Видимость пагинации зависит от количества задач**
    - **Validates: Requirements 9.2, 9.5**
    - **Property 19: Изменение фильтра/сортировки/поиска сбрасывает страницу на 1**
    - **Validates: Requirements 9.4**

- [x] 5. Checkpoint — убедиться, что все тесты проходят
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Создать компонент `TaskCard.vue`
  - Создать `src/components/TaskCard.vue`
  - Props: `task: Task`, `canEdit: boolean`, `canDelete: boolean`
  - Emits: `edit`, `delete`
  - Отображать: Title, Description (truncated), DueDate, статус IsCompleted
  - Кнопки edit/delete рендерить только при `canEdit`/`canDelete`
  - _Requirements: 3.1, 4.1, 5.1_

  - [ ]* 6.1 Написать property-тест для видимости кнопок `TaskCard`
    - **Property 6: Видимость кнопок edit/delete зависит от прав**
    - **Validates: Requirements 3.1, 4.1, 5.1, 5.2**

- [x] 7. Создать компоненты `TaskForm.vue` и `TaskModal.vue`
  - Создать `src/components/TaskForm.vue`
    - Props: `loading?: boolean`, `error?: string | null`
    - Emits: `submit(payload: CreateTaskPayload)`, `cancel`
    - Поля: Title (required), Description, DueDate, IsCompleted (checkbox, default false)
    - Валидация: Title не может быть пустым или состоять только из пробелов
  - Создать `src/components/TaskModal.vue`
    - Props: `task: Task`, `loading?: boolean`, `error?: string | null`
    - Emits: `submit(payload: UpdateTaskPayload)`, `close`
    - При открытии инициализировать поля значениями из `task`
    - Та же валидация Title
  - _Requirements: 2.2, 2.3, 3.2, 3.3, 3.4_

  - [ ]* 7.1 Написать property-тесты для форм
    - **Property 4: Пустой Title не проходит валидацию**
    - **Validates: Requirements 2.3, 3.4**
    - **Property 7: Модальное окно редактирования предзаполнено данными задачи**
    - **Validates: Requirements 3.2**

- [x] 8. Создать компоненты `ConfirmDialog.vue`, `TaskFilter.vue`, `TaskSearch.vue`, `TaskPagination.vue`
  - `src/components/ConfirmDialog.vue`: Props `message?`, `loading?`, `error?`; Emits `confirm`, `cancel`
  - `src/components/TaskFilter.vue`: Emits `update:filter(FilterOption)`, `update:sort(SortOption)`; select/кнопки для фильтра и сортировки
  - `src/components/TaskSearch.vue`: Emits `update:search(string)`; текстовый input
  - `src/components/TaskPagination.vue`: Props `currentPage: number`, `totalPages: number`; Emits `update:page(number)`; рендерить только если `totalPages > 1`
  - _Requirements: 2.1, 4.2, 4.6, 6.1, 7.1, 8.1, 9.2, 9.5_

  - [ ]* 8.1 Написать property-тест для `ConfirmDialog`
    - **Property 10: Отмена диалога не изменяет список**
    - **Validates: Requirements 4.6**

- [x] 9. Интегрировать всё в `src/pages/index.vue`
  - Подключить `useTasks` и вызвать `fetchTasks()` в `onMounted`
  - Подключить `useTaskFilters`, передать `tasks` из `useTasks`
  - Отрендерить спиннер загрузки (пока `isLoading`)
  - Отрендерить сообщение об ошибке (если `error`)
  - Отрендерить empty-state (если список пуст после загрузки)
  - Отрендерить `TaskSearch`, `TaskFilter`, `TaskPagination`
  - Отрендерить список `TaskCard` по `paginatedTasks`; передать `canEdit`/`canDelete` на основе `user` и `isAdmin`
  - Кнопка "Создать задачу" открывает `TaskForm`
  - При emit `edit` от `TaskCard` — открыть `TaskModal` с выбранной задачей
  - При emit `delete` от `TaskCard` — открыть `ConfirmDialog`
  - Обработать submit/cancel/close от форм и диалогов через методы `useTasks`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.5, 2.6, 3.6, 3.7, 4.4, 4.5, 4.6, 7.3, 8.4, 9.4_

  - [ ]* 9.1 Написать property-тест для рендеринга списка
    - **Property 1: Список задач отображает корректное количество карточек**
    - **Validates: Requirements 1.3**

- [x] 10. Final checkpoint — убедиться, что все тесты проходят
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Задачи, помеченные `*`, опциональны и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для трассируемости
- Property-тесты пишутся в `src/tests/unit/tasks.property.test.ts`, unit-тесты в `src/tests/unit/tasks-util.test.ts`
- MSW v1.x: использовать `rest` из `msw`, не обновлять до v2
- `$api` доступен через `useNuxtApp().$api`
