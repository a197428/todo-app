# Requirements Document

## Introduction

Настройка тестовой среды на базе Vitest в существующем Nuxt 3 проекте (SSR отключён, srcDir: 'src/') и написание базовых тестов для авторизации через MSW v1.x бэкенд. Фича охватывает: установку и конфигурацию Vitest, интеграцию с MSW-перехватчиками в тестовой среде (Node/jsdom), unit-тесты утилит авторизации и интеграционные тесты HTTP-потока логина.

## Glossary

- **Vitest**: Фреймворк для unit/component тестирования, совместимый с Vite/Nuxt.
- **MSW**: Mock Service Worker v1.x — библиотека перехвата HTTP-запросов через `rest` API.
- **MSW_Server**: Экземпляр `setupServer` из `msw/node`, используемый в тестовой среде Node.js.
- **Auth_Handler**: MSW-обработчик `POST /api/auth/login` из `src/msw-mocks/handlers/auth.handlers.ts`.
- **Auth_Util**: Функция `getUserFromAuthHeader` из `src/msw-mocks/utils/auth.ts`.
- **Axios_Instance**: Экземпляр axios с `baseURL: '/api'` и интерцепторами токена/401.
- **Token**: Строковый идентификатор пользователя, возвращаемый при успешном логине и хранимый в localStorage.
- **Test_User**: Тестовый пользователь из `src/msw-mocks/data/users.data.ts` (admin@test.com/123456, user@test.com/123456).

---

## Requirements

### Requirement 1: Установка и конфигурация Vitest

**User Story:** As a developer, I want Vitest configured in the Nuxt 3 project, so that I can run unit and integration tests with `npm run test`.

#### Acceptance Criteria

1. THE Vitest SHALL be configured via `vitest.config.ts` в корне проекта с окружением `jsdom` и алиасами `~` и `@`, указывающими на `src/`.
2. THE Vitest SHALL разрешать Nuxt auto-imports (defineNuxtPlugin, navigateTo и др.) через `@nuxt/test-utils/e2e` или явные моки, чтобы тесты не падали с ошибкой "not defined".
3. WHEN запускается команда `npm run test`, THE Vitest SHALL выполнить все тесты из директории `src/**/*.test.ts` и вернуть результат без ошибок конфигурации.
4. THE `vitest.config.ts` SHALL включать `setupFiles` с файлом глобальной инициализации MSW_Server, чтобы перехватчики были активны для всех тестов.
5. IF в `tsconfig.json` отсутствуют пути для алиасов `~` и `@`, THEN THE Vitest SHALL добавить их через поле `resolve.alias` в `vitest.config.ts`, не изменяя `tsconfig.json`.

---

### Requirement 2: Интеграция MSW в тестовую среду

**User Story:** As a developer, I want MSW handlers active during tests, so that HTTP requests made in tests are intercepted without a real server.

#### Acceptance Criteria

1. THE MSW_Server SHALL быть создан через `setupServer(...authHandlers)` из `msw/node` в файле `src/tests/setup.ts`.
2. WHEN тестовый набор запускается, THE MSW_Server SHALL вызывать `server.listen({ onUnhandledRequest: 'error' })` в `beforeAll`, чтобы неперехваченные запросы вызывали ошибку теста.
3. WHEN тест завершается, THE MSW_Server SHALL вызывать `server.resetHandlers()` в `afterEach`, чтобы переопределения обработчиков не влияли на другие тесты.
4. WHEN все тесты в наборе завершены, THE MSW_Server SHALL вызывать `server.close()` в `afterAll`.
5. WHERE тест требует нестандартного поведения обработчика, THE MSW_Server SHALL поддерживать переопределение через `server.use(rest.post(...))` внутри конкретного теста.
6. THE `setupServer` SHALL принимать существующие `authHandlers` из `src/msw-mocks/handlers/auth.handlers.ts` без изменения этих файлов.

---

### Requirement 3: Unit-тесты утилиты `getUserFromAuthHeader`

**User Story:** As a developer, I want unit tests for `getUserFromAuthHeader`, so that I can verify token-to-user resolution logic in isolation.

#### Acceptance Criteria

1. WHEN `getUserFromAuthHeader` вызывается с валидным заголовком `"Bearer 1"`, THE Auth_Util SHALL вернуть объект пользователя с `id: 1` и `email: 'admin@test.com'`.
2. WHEN `getUserFromAuthHeader` вызывается с валидным заголовком `"Bearer 2"`, THE Auth_Util SHALL вернуть объект пользователя с `id: 2` и `email: 'user@test.com'`.
3. WHEN `getUserFromAuthHeader` вызывается с `undefined`, THE Auth_Util SHALL вернуть `null`.
4. WHEN `getUserFromAuthHeader` вызывается с пустой строкой `""`, THE Auth_Util SHALL вернуть `null`.
5. WHEN `getUserFromAuthHeader` вызывается с заголовком несуществующего пользователя `"Bearer 999"`, THE Auth_Util SHALL вернуть `null`.
6. FOR ALL валидных токенов пользователей из `users.data.ts`, THE Auth_Util SHALL возвращать пользователя, чей `id` совпадает с числовым значением токена (round-trip свойство: `getUserFromAuthHeader("Bearer " + user.id)?.id === user.id`).

---

### Requirement 4: Интеграционные тесты эндпоинта `POST /api/auth/login`

**User Story:** As a developer, I want integration tests for the login endpoint via MSW, so that I can verify the full request-response cycle for authentication.

#### Acceptance Criteria

1. WHEN отправляется `POST /api/auth/login` с телом `{ email: 'admin@test.com', password: '123456' }`, THE Auth_Handler SHALL вернуть статус `200` и тело `{ token: '1', user: { id: 1, email: 'admin@test.com', role: 'admin' } }`.
2. WHEN отправляется `POST /api/auth/login` с телом `{ email: 'user@test.com', password: '123456' }`, THE Auth_Handler SHALL вернуть статус `200` и тело с `user.role === 'user'`.
3. WHEN отправляется `POST /api/auth/login` с неверным паролем, THE Auth_Handler SHALL вернуть статус `401` и тело `{ message: 'Invalid credentials' }`.
4. WHEN отправляется `POST /api/auth/login` с несуществующим email, THE Auth_Handler SHALL вернуть статус `401`.
5. WHEN отправляется `POST /api/auth/login` с пустым телом `{}`, THE Auth_Handler SHALL вернуть статус `401`.
6. IF тест переопределяет Auth_Handler через `server.use(rest.post(...))`, THEN THE MSW_Server SHALL использовать переопределённый обработчик только в рамках этого теста, не затрагивая остальные.

---

### Requirement 5: Тесты интерцепторов Axios_Instance

**User Story:** As a developer, I want tests for the axios interceptors, so that I can verify token injection and 401 redirect behavior.

#### Acceptance Criteria

1. WHEN Axios_Instance выполняет запрос и в localStorage присутствует Token, THE Axios_Instance SHALL добавить заголовок `Authorization: Bearer <token>` к запросу.
2. WHEN Axios_Instance выполняет запрос и localStorage не содержит Token, THE Axios_Instance SHALL отправить запрос без заголовка `Authorization`.
3. WHEN Axios_Instance получает ответ со статусом `401`, THE Axios_Instance SHALL вызвать `navigateTo('/login')`.
4. WHEN Axios_Instance получает ответ со статусом `200`, THE Axios_Instance SHALL вернуть данные ответа без вызова `navigateTo`.
5. IF тест проверяет интерцептор 401, THEN THE тест SHALL мокировать `navigateTo` как `vi.fn()`, чтобы избежать зависимости от Nuxt router.

---

### Requirement 6: Структура тестовых файлов и скрипты

**User Story:** As a developer, I want a clear test file structure and npm scripts, so that tests are easy to find and run.

#### Acceptance Criteria

1. THE тестовые файлы SHALL располагаться в директории `src/tests/` с подпапками `unit/` и `integration/`.
2. THE `package.json` SHALL содержать скрипт `"test": "vitest --run"` для однократного запуска тестов.
3. THE `package.json` SHALL содержать скрипт `"test:watch": "vitest"` для запуска в режиме наблюдения.
4. THE файл `src/tests/setup.ts` SHALL содержать глобальную инициализацию MSW_Server и быть указан в `vitest.config.ts` в поле `setupFiles`.
5. WHEN добавляется новый MSW-обработчик в `src/msw-mocks/handlers/`, THE `src/tests/setup.ts` SHALL позволять подключить его к MSW_Server без изменения конфигурации Vitest.
