# Implementation Plan: Auth

## Overview

Реализация системы авторизации: composable `useAuth`, страница `login.vue`, middleware `auth.ts`, обновление axios-плагина. TypeScript strict mode, Nuxt 3 (SSR off), MSW v1.x для тестов.

## Tasks

- [x] 1. Реализовать утилиту валидации формы
  - Создать `src/utils/auth.ts` с функцией `validateLoginForm(email, password): ValidationErrors`
  - Правила: email обязателен и должен соответствовать формату RFC 5322 (упрощённый regex); password обязателен (непустой после trim)
  - Экспортировать интерфейс `ValidationErrors`
  - _Requirements: 1.3, 1.4, 1.5_

  - [ ]* 1.1 Написать property-тест для validateLoginForm (P1)
    - **Property 1: Пустые поля не проходят валидацию**
    - **Validates: Requirements 1.3, 1.4**
    - Файл: `src/tests/unit/auth.property.test.ts`
    - Генераторы: `fc.constantFrom('', '   ', '\t')` для email и password

  - [ ]* 1.2 Написать property-тест для validateLoginForm (P2)
    - **Property 2: Невалидный формат email отклоняется**
    - **Validates: Requirements 1.5**
    - Генератор: `fc.string().filter(s => !s.includes('@'))`

- [x] 2. Реализовать composable `useAuth`
  - Создать `src/composables/useAuth.ts`
  - Определить интерфейсы `AuthUser`, `AuthState`, `UseAuth`
  - Реализовать `useState<AuthState>('auth', ...)` как глобальный стор
  - Реализовать `isAuthenticated`, `isAdmin`, `user` как `ComputedRef`
  - Реализовать `initAuth()`: читает токен из `localStorage`, восстанавливает состояние
  - Реализовать `login(email, password)`: POST `/api/auth/login` через `$api`, сохраняет токен в `localStorage` и user в стор, редиректит на `/`
  - Реализовать `logout()`: удаляет токен из `localStorage`, очищает стор, редиректит на `/login`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.1, 6.2, 6.3_

  - [x]* 2.1 Написать property-тест (P3): тело запроса логина
    - **Property 3: Тело запроса логина содержит переданные credentials**
    - **Validates: Requirements 2.1**
    - Генератор: `fc.record({ email: fc.emailAddress(), password: fc.string({ minLength: 1 }) })`
    - MSW handler проверяет тело запроса

  - [x]* 2.2 Написать property-тест (P4): успешный логин — round-trip
    - **Property 4: Успешный логин сохраняет токен и пользователя**
    - **Validates: Requirements 2.2, 2.3, 6.1**
    - Генератор: `fc.constantFrom(...users)` из `users.data.ts`
    - Проверить `localStorage.getItem('token')` и `useAuth().user.value`

  - [x]* 2.3 Написать property-тест (P5): isAuthenticated отражает наличие токена
    - **Property 5: isAuthenticated отражает наличие токена**
    - **Validates: Requirements 3.1, 3.2**
    - Генератор: `fc.string({ minLength: 1 })` как токен; проверить после `initAuth()`

  - [x]* 2.4 Написать property-тест (P6): user отражает состояние стора
    - **Property 6: user отражает текущее состояние стора**
    - **Validates: Requirements 3.3**
    - Генератор: `fc.record({ id: fc.integer(), email: fc.emailAddress(), role: fc.constantFrom('admin', 'user') })`

  - [x]* 2.5 Написать property-тест (P7): isAdmin — инвариант роли
    - **Property 7: isAdmin — инвариант роли**
    - **Validates: Requirements 6.2**
    - Генератор: `fc.constantFrom('admin', 'user')`; проверить `isAdmin === (role === 'admin')`

  - [x]* 2.6 Написать property-тест (P8): logout полностью очищает состояние
    - **Property 8: Logout полностью очищает состояние**
    - **Validates: Requirements 3.4, 3.5**
    - Проверить три условия: `localStorage.getItem('token') === null`, `user.value === null`, `isAuthenticated.value === false`

- [x] 3. Checkpoint — убедиться, что все тесты проходят
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Обновить axios-плагин (`src/plugins/axios.ts`)
  - В перехватчике 401: добавить `localStorage.removeItem('token')` перед `navigateTo('/login')`
  - Убедиться, что не-401 ошибки возвращают `Promise.reject(error)` без редиректа
  - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 4.1 Написать property-тест (P10): 401 очищает сессию и редиректит
    - **Property 10: 401 ответ очищает сессию и редиректит**
    - **Validates: Requirements 5.1, 5.2**
    - Файл: `src/tests/unit/auth.property.test.ts`
    - MSW возвращает 401; проверить `localStorage` и вызов `navigateTo`

  - [ ]* 4.2 Написать property-тест (P11): не-401 ошибки не вызывают редирект
    - **Property 11: Не-401 ошибки не вызывают редирект**
    - **Validates: Requirements 5.3**
    - Генератор: `fc.constantFrom(400, 403, 404, 500)`

- [x] 5. Создать middleware `src/middleware/auth.ts`
  - Глобальный Nuxt route middleware
  - Логика: если маршрут `/login` и `isAuthenticated` → `navigateTo('/')`; если маршрут не `/login` и `!isAuthenticated` → `navigateTo('/login')`
  - _Requirements: 4.1, 4.2, 4.3_

  - [x]* 5.1 Написать property-тест (P9): middleware редиректит неаутентифицированных
    - **Property 9: Middleware редиректит неаутентифицированных пользователей**
    - **Validates: Requirements 4.1**
    - Генератор: `fc.webPath().filter(p => p !== '/login')`; проверить вызов `navigateTo('/login')`

- [x] 6. Создать страницу `src/pages/login.vue`
  - Поля формы: `email`, `password` (локальный реактивный стейт)
  - Отображение ошибок валидации под полями (использовать `validateLoginForm`)
  - Отображение API-ошибки (`apiError`) над кнопкой submit
  - Кнопка submit: задизейблена и показывает индикатор загрузки во время запроса (`isLoading`)
  - При submit: вызвать `useAuth().login()`, обработать 401 ("Invalid credentials") и сетевую ошибку
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.4, 2.5, 2.6_

- [x] 7. Инициализировать `useAuth` при старте приложения
  - В `app/app.vue` вызвать `useAuth().initAuth()` в `onMounted` (или в плагине)
  - _Requirements: 3.1_

- [x] 8. Финальный checkpoint — убедиться, что все тесты проходят
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Задачи с `*` опциональны и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для трассируемости
- Property-тесты размещены в `src/tests/unit/auth.property.test.ts`
- Используй `rest` из `msw` (v1.x legacy API) во всех тестах
- `useAuth` использует `useState` (Nuxt built-in) с ключом `'auth'` — не Pinia
