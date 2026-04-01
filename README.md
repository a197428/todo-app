# ToDo App

Тестовое задание — приложение для управления задачами на Nuxt 3 с авторизацией, CRUD-операциями, фильтрацией и сортировкой.

## Стек

- **Nuxt 3** (SSR отключён, SPA)
- **TypeScript** (strict mode)
- **Tailwind CSS**
- **MSW v1** — мок-бэкенд прямо в браузере
- **Vitest** + **@fast-check/vitest** — unit, integration и property-based тесты
- **Axios** — HTTP-клиент с интерцепторами

## Быстрый старт

```bash
npm install
npm run dev
```

Открыть: [http://localhost:3000](http://localhost:3000)

## Тестовые аккаунты

| Email | Пароль | Роль |
|-------|--------|------|
| admin@test.com | 123456 | admin — может редактировать и удалять любые задачи |
| user@test.com | 123456 | user — только свои задачи |

## Функциональность

### Авторизация
- Форма входа с валидацией email/password
- JWT-токен хранится в `localStorage`
- Автоматический редирект на `/login` при 401
- Защита маршрутов через Nuxt middleware

### Управление задачами
- Просмотр списка с индикатором загрузки
- Создание задачи (название, описание, дедлайн, статус)
- Редактирование через модальное окно
- Удаление с подтверждением
- Права: редактировать/удалять может только создатель задачи или admin

### Фильтрация и поиск
- Фильтры: Все / Активные / Выполненные / Просроченные
- Сортировка: по умолчанию / по дате (возр./убыв.) / по статусу
- Поиск по названию с debounce 300ms
- Пагинация (10 задач на страницу)

## Тесты

```bash
# Запустить все тесты
npm run test

# Режим наблюдения
npm run test:watch
```

Покрытие: 81 тест в 7 файлах — unit, integration и property-based тесты для утилит, composables и MSW-обработчиков.

## Структура проекта

```
src/
├── composables/
│   ├── useAuth.ts          # Авторизация, стор пользователя
│   ├── useTasks.ts         # CRUD задач
│   └── useTaskFilters.ts   # Фильтрация, сортировка, поиск, пагинация
├── components/
│   ├── TaskCard.vue
│   ├── TaskForm.vue
│   ├── TaskModal.vue
│   ├── TaskFilter.vue
│   ├── TaskSearch.vue
│   ├── TaskPagination.vue
│   └── ConfirmDialog.vue
├── pages/
│   ├── login.vue
│   └── index.vue
├── middleware/
│   └── auth.global.ts      # Защита маршрутов
├── msw-mocks/              # Мок-бэкенд (MSW)
│   ├── handlers/
│   │   ├── auth.handlers.ts
│   │   └── tasks.handlers.ts
│   └── data/
│       ├── users.data.ts
│       └── tasks.data.ts
├── utils/
│   ├── auth.ts             # Валидация формы
│   └── tasks.ts            # filterTasks, sortTasks, searchTasks
└── tests/
    ├── setup.ts
    ├── unit/
    └── integration/
```
