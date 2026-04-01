# Implementation Plan: vitest-auth-testing

## Overview

Установка Vitest, настройка тестовой инфраструктуры с MSW v1.x в Node-окружении и написание unit/integration тестов для слоя авторизации. Реализация ведётся на TypeScript в строгом режиме.

## Tasks

- [x] 1. Установить зависимости и создать `vitest.config.ts`
  - Установить `vitest@^1.6.0`, `jsdom@^24.0.0`, `@vitest/coverage-v8@^1.6.0`, `@fast-check/vitest`, `fast-check` в devDependencies
  - Создать `vitest.config.ts` в корне проекта с `environment: 'jsdom'`, `setupFiles: ['src/tests/setup.ts']`, `include: ['src/**/*.test.ts']` и алиасами `~`/`@` → `src/`
  - Добавить скрипты `"test": "vitest --run"` и `"test:watch": "vitest"` в `package.json`
  - _Requirements: 1.1, 1.3, 1.5, 6.2, 6.3_

- [x] 2. Создать глобальный файл инициализации `src/tests/setup.ts`
  - Создать файл `src/tests/setup.ts`
  - Создать MSW-сервер через `setupServer(...authHandlers)` из `msw/node`
  - Добавить `beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))`, `afterEach(() => server.resetHandlers())`, `afterAll(() => server.close())`
  - Замокировать Nuxt globals через `vi.stubGlobal('navigateTo', vi.fn())` и `vi.stubGlobal('defineNuxtPlugin', (fn) => fn)`
  - _Requirements: 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 2.6, 6.4_

- [x] 3. Написать unit-тесты для `getUserFromAuthHeader`
  - [x] 3.1 Создать `src/tests/unit/auth-util.test.ts` с конкретными примерами
    - Тест: `"Bearer 1"` → пользователь с `id: 1`, `email: 'admin@test.com'`
    - Тест: `"Bearer 2"` → пользователь с `id: 2`, `email: 'user@test.com'`
    - Тест: `undefined` → `null`
    - Тест: `""` → `null`
    - Тест: `"Bearer 999"` → `null`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.2 Написать property-тест для Property 1: Round-trip getUserFromAuthHeader
    - **Property 1: Round-trip getUserFromAuthHeader**
    - **Validates: Requirements 3.6**
    - Использовать `test.prop([fc.integer({ min: 1, max: 2 })])` из `@fast-check/vitest`
    - Проверить: `getUserFromAuthHeader("Bearer " + id)?.id === id` для всех валидных id

  - [ ]* 3.3 Написать property-тест для Property 2: Невалидный ввод возвращает null
    - **Property 2: Невалидный ввод возвращает null**
    - **Validates: Requirements 3.3, 3.4, 3.5**
    - Использовать `fc.string()` с фильтром, исключающим `"Bearer 1"` и `"Bearer 2"`
    - Проверить: результат всегда `null`

- [x] 4. Checkpoint — убедиться, что unit-тесты проходят
  - Запустить `npm run test`, убедиться что все тесты из `src/tests/unit/` проходят. Спросить пользователя, если возникнут вопросы.

- [x] 5. Написать интеграционные тесты для `POST /api/auth/login`
  - [x] 5.1 Создать `src/tests/integration/auth-login.test.ts` с конкретными примерами
    - Тест: admin credentials → статус 200, `token: '1'`, `user.role: 'admin'`
    - Тест: user credentials → статус 200, `user.role: 'user'`
    - Тест: неверный пароль → статус 401, `{ message: 'Invalid credentials' }`
    - Тест: несуществующий email → статус 401
    - Тест: пустое тело `{}` → статус 401
    - Использовать `fetch` напрямую (без axios), чтобы изолировать от интерцепторов
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.2 Написать property-тест для Property 3: Валидные credentials → 200
    - **Property 3: Валидные credentials возвращают корректный ответ**
    - **Validates: Requirements 4.1, 4.2**
    - Использовать `fc.integer({ min: 1, max: 2 })` для выбора пользователя из `users`
    - Проверить: статус 200, `token === String(user.id)`, совпадение `id`, `email`, `role`

  - [ ]* 5.3 Написать property-тест для Property 4: Невалидные credentials → 401
    - **Property 4: Невалидные credentials возвращают 401**
    - **Validates: Requirements 4.3, 4.4, 4.5**
    - Использовать `fc.record({ email: fc.emailAddress(), password: fc.string() })` с фильтром, исключающим реальные пары
    - Проверить: статус 401, тело `{ message: 'Invalid credentials' }`

  - [x] 5.4 Написать тест для Property 5: Изоляция переопределений MSW-обработчиков
    - **Property 5: Изоляция переопределений MSW-обработчиков**
    - **Validates: Requirements 2.3, 2.5, 4.6**
    - Тест 1: переопределить обработчик через `server.use(rest.post(...))`, вернуть кастомный ответ, проверить его
    - Тест 2 (следующий тест): убедиться, что оригинальный обработчик восстановлен (admin credentials → 200)
    - _Requirements: 2.3, 2.5, 4.6_

- [x] 6. Написать тесты интерцепторов axios
  - [x] 6.1 Создать `src/tests/integration/axios-interceptors.test.ts`
    - Создать изолированный экземпляр `axios.create({ baseURL: '/api' })` с теми же интерцепторами, что в `src/plugins/axios.ts`
    - Добавить `afterEach(() => { localStorage.clear(); vi.clearAllMocks() })`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.2 Написать property-тест для Property 6: Токен в localStorage → заголовок Authorization
    - **Property 6: Токен в localStorage определяет заголовок Authorization**
    - **Validates: Requirements 5.1, 5.2**
    - Использовать `fc.string({ minLength: 1 })` для генерации токенов
    - Проверить: при наличии токена заголовок `Authorization: Bearer <token>` присутствует; при отсутствии — нет
    - Перехватывать исходящий запрос через `server.use` для инспекции заголовков

  - [x] 6.3 Написать тест для Property 7: 401 → navigateTo, 200 → без navigateTo
    - **Property 7: Статус ответа определяет вызов navigateTo**
    - **Validates: Requirements 5.3, 5.4**
    - Тест: MSW возвращает 401 → `navigateTo('/login')` вызван ровно 1 раз
    - Тест: MSW возвращает 200 → `navigateTo` не вызван
    - `navigateTo` мокируется через `vi.fn()` (уже замокирован в `setup.ts`)
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 7. Final checkpoint — все тесты проходят
  - Запустить `npm run test`, убедиться что все тесты из `src/tests/` проходят без ошибок конфигурации. Спросить пользователя, если возникнут вопросы.

## Notes

- Задачи с `*` опциональны и могут быть пропущены для быстрого MVP
- MSW v1.x — не обновлять до v2, использовать `rest` из `msw`
- `navigateTo` и `defineNuxtPlugin` мокируются глобально в `setup.ts`, не в каждом тесте
- Property-тесты используют `@fast-check/vitest` с минимум 100 итерациями (`fc.configureGlobal({ numRuns: 100 })`)
