# Requirements Document

## Introduction

Фича реализует полный CRUD для задач в Nuxt 3 ToDo-приложении. Пользователь может просматривать список задач с фильтрацией, сортировкой и поиском, создавать новые задачи через форму с валидацией, редактировать и удалять задачи с учётом ролевых прав (только создатель или admin). Взаимодействие с бэкендом происходит через MSW-моки (GET, POST, PUT, DELETE /api/tasks). Приложение работает без SSR, авторизация уже реализована через `useAuth`.

## Glossary

- **Task_List**: компонент страницы, отображающий список задач
- **Task_Card**: компонент отдельной задачи в списке
- **Task_Form**: форма создания/редактирования задачи
- **Task_Modal**: модальное окно редактирования задачи
- **Confirm_Dialog**: диалог подтверждения удаления
- **Task_Store**: composable `useTasks`, управляющий состоянием задач
- **Task_Filter**: компонент фильтрации и сортировки
- **Task_Search**: компонент поиска по названию
- **API**: axios-инстанс `$api`, предоставляемый плагином `axios.ts`
- **Task**: объект `{ Id, Title, Description, DueDate, IsCompleted, OwnerId }`
- **Current_User**: авторизованный пользователь, возвращаемый `useAuth().user`
- **Owner**: пользователь, чей `id` совпадает с `Task.OwnerId`
- **Admin**: пользователь с `role === 'admin'`

## Requirements

### Requirement 1: Загрузка и отображение списка задач

**User Story:** As a user, I want to see a list of my tasks with a loading indicator, so that I know when data is being fetched.

#### Acceptance Criteria

1. WHEN the tasks page is mounted, THE Task_Store SHALL send `GET /api/tasks` with the `Authorization: Bearer <token>` header.
2. WHILE the request is in progress, THE Task_List SHALL display a loading spinner.
3. WHEN the request succeeds, THE Task_List SHALL render one Task_Card per task returned by the API.
4. IF the API returns a 401 status, THEN THE API SHALL redirect the user to `/login` (handled by the existing axios interceptor).
5. IF the API returns a non-401 error, THEN THE Task_Store SHALL expose an error message and THE Task_List SHALL display it to the user.
6. WHEN the task list is empty after a successful request, THE Task_List SHALL display an empty-state message.

---

### Requirement 2: Создание задачи

**User Story:** As a user, I want to create a new task via a form, so that I can add items to my to-do list.

#### Acceptance Criteria

1. THE Task_List SHALL provide a button that opens the Task_Form for creating a new task.
2. THE Task_Form SHALL contain fields: Title (required), Description (optional), DueDate (optional), IsCompleted (checkbox, default `false`).
3. WHEN the user submits the Task_Form with an empty Title, THE Task_Form SHALL display a validation error and SHALL NOT send a request to the API.
4. WHEN the user submits a valid Task_Form, THE Task_Store SHALL send `POST /api/tasks` with the task payload and the `Authorization` header.
5. WHEN the POST request succeeds, THE Task_Store SHALL append the returned Task to the local task list and THE Task_Form SHALL close.
6. IF the POST request fails, THEN THE Task_Form SHALL display an error message and SHALL remain open.

---

### Requirement 3: Редактирование задачи

**User Story:** As a task owner or admin, I want to edit a task via a modal, so that I can update its details.

#### Acceptance Criteria

1. WHEN the Current_User is the Owner of a Task OR the Current_User is an Admin, THE Task_Card SHALL display an edit button for that Task.
2. WHEN the user clicks the edit button, THE Task_Modal SHALL open pre-populated with the current Task fields.
3. THE Task_Modal SHALL contain the same fields as the Task_Form (Title required, Description, DueDate, IsCompleted).
4. WHEN the user submits the Task_Modal with an empty Title, THE Task_Modal SHALL display a validation error and SHALL NOT send a request to the API.
5. WHEN the user submits a valid Task_Modal, THE Task_Store SHALL send `PUT /api/tasks/:id` with the updated payload and the `Authorization` header.
6. WHEN the PUT request succeeds, THE Task_Store SHALL replace the corresponding Task in the local task list and THE Task_Modal SHALL close.
7. IF the PUT request fails, THEN THE Task_Modal SHALL display an error message and SHALL remain open.

---

### Requirement 4: Удаление задачи

**User Story:** As a task owner or admin, I want to delete a task after confirmation, so that I can remove completed or irrelevant items.

#### Acceptance Criteria

1. WHEN the Current_User is the Owner of a Task OR the Current_User is an Admin, THE Task_Card SHALL display a delete button for that Task.
2. WHEN the user clicks the delete button, THE Confirm_Dialog SHALL open asking the user to confirm deletion.
3. WHEN the user confirms deletion, THE Task_Store SHALL send `DELETE /api/tasks/:id` with the `Authorization` header.
4. WHEN the DELETE request succeeds, THE Task_Store SHALL remove the corresponding Task from the local task list and THE Confirm_Dialog SHALL close.
5. IF the DELETE request fails, THEN THE Confirm_Dialog SHALL display an error message.
6. WHEN the user cancels the Confirm_Dialog, THE Task_Store SHALL NOT send any request and the Task SHALL remain in the list.

---

### Requirement 5: Ролевые права доступа

**User Story:** As a system, I want to restrict edit and delete actions to the task owner or admin, so that users cannot modify each other's tasks.

#### Acceptance Criteria

1. WHILE the Current_User is neither the Owner of a Task nor an Admin, THE Task_Card SHALL NOT display edit or delete buttons for that Task.
2. THE Task_Store SHALL verify ownership before sending PUT or DELETE requests: IF `Current_User.id !== Task.OwnerId` AND `Current_User.role !== 'admin'`, THEN THE Task_Store SHALL reject the operation with an error and SHALL NOT send a request to the API.
3. THE MSW handler for `PUT /api/tasks/:id` SHALL return 403 if the requesting user is neither the Owner nor an Admin.
4. THE MSW handler for `DELETE /api/tasks/:id` SHALL return 403 if the requesting user is neither the Owner nor an Admin.

---

### Requirement 6: Сортировка задач

**User Story:** As a user, I want to sort tasks by different criteria, so that I can prioritize my work.

#### Acceptance Criteria

1. THE Task_Filter SHALL provide sort options: by creation order (default), by DueDate ascending, by DueDate descending, by IsCompleted status.
2. WHEN the user selects a sort option, THE Task_List SHALL re-render the task list in the selected order without sending a new API request.
3. WHEN a sort option is applied and then a different sort option is applied, THE Task_List SHALL reflect only the most recently selected sort order.

---

### Requirement 7: Фильтрация задач

**User Story:** As a user, I want to filter tasks by status, so that I can focus on relevant items.

#### Acceptance Criteria

1. THE Task_Filter SHALL provide filter options: All (default), Active (IsCompleted = false), Completed (IsCompleted = true), Overdue (IsCompleted = false AND DueDate < current date).
2. WHEN the user selects a filter, THE Task_List SHALL display only tasks matching the filter criteria without sending a new API request.
3. WHEN a filter is active and the task list is empty, THE Task_List SHALL display an empty-state message specific to the active filter.

---

### Requirement 8: Поиск задач

**User Story:** As a user, I want to search tasks by title with debounce, so that I can quickly find a specific task without excessive re-renders.

#### Acceptance Criteria

1. THE Task_Search SHALL provide a text input for searching tasks by Title.
2. WHEN the user types in the Task_Search input, THE Task_Store SHALL debounce the search by 300ms before applying the filter to the local task list.
3. WHEN the debounce period elapses, THE Task_List SHALL display only tasks whose Title contains the search string (case-insensitive match).
4. WHEN the search yields no results, THE Task_List SHALL display a "no results found" message.
5. WHEN the search input is cleared, THE Task_List SHALL display the full list subject to the active filter and sort options.
6. FOR ALL search strings S, applying the search filter twice with the same S SHALL produce the same result as applying it once (idempotence property).

---

### Requirement 9: Пагинация

**User Story:** As a user, I want paginated task list, so that I can navigate large sets of tasks without performance issues.

#### Acceptance Criteria

1. THE Task_List SHALL display tasks in pages of 10 items per page by default.
2. THE Task_List SHALL provide pagination controls (previous, next, page numbers) when the total number of filtered tasks exceeds the page size.
3. WHEN the user navigates to a page, THE Task_List SHALL display the correct slice of the filtered and sorted task list.
4. WHEN a filter, sort, or search changes, THE Task_List SHALL reset to page 1.
5. WHILE the total number of filtered tasks is less than or equal to the page size, THE Task_List SHALL NOT display pagination controls.

---

### Requirement 10: MSW-обработчики PUT и DELETE

**User Story:** As a developer, I want PUT and DELETE MSW handlers for tasks, so that the frontend can be developed and tested without a real backend.

#### Acceptance Criteria

1. WHEN `PUT /api/tasks/:id` is called with a valid Authorization header and the user is the Owner or Admin, THE MSW handler SHALL update the task in the in-memory store and return the updated Task with status 200.
2. WHEN `DELETE /api/tasks/:id` is called with a valid Authorization header and the user is the Owner or Admin, THE MSW handler SHALL remove the task from the in-memory store and return status 204.
3. IF `PUT /api/tasks/:id` is called without a valid Authorization header, THEN THE MSW handler SHALL return status 401.
4. IF `DELETE /api/tasks/:id` is called without a valid Authorization header, THEN THE MSW handler SHALL return status 401.
5. IF `PUT /api/tasks/:id` is called for a non-existent task id, THEN THE MSW handler SHALL return status 404.
6. IF `DELETE /api/tasks/:id` is called for a non-existent task id, THEN THE MSW handler SHALL return status 404.
7. THE MSW handler for `PUT /api/tasks/:id` SHALL parse the request body and update only the fields: Title, Description, DueDate, IsCompleted.
8. FOR ALL valid Tasks T, calling PUT with the same payload twice SHALL produce the same stored Task state as calling it once (idempotence property).
