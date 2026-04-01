# Design Document: Auth

## Overview

Система авторизации для Nuxt 3 ToDo-приложения (SSR отключён). Реализует форму входа, хранение JWT-токена в `localStorage`, реактивное состояние через composable (`useAuth`), защиту маршрутов через Nuxt route middleware и обработку 401 ошибок в существующем axios-плагине.

Ключевые ограничения:
- SSR отключён — `localStorage` и `navigateTo` доступны только на клиенте
- MSW v1.x (legacy API: `rest` из `msw`)
- TypeScript strict mode
- Тестирование через Vitest + `@fast-check/vitest` (уже установлен)

---

## Architecture

```mermaid
graph TD
    A[login.vue] -->|вызывает login()| B[useAuth composable]
    B -->|POST /api/auth/login| C[axios plugin]
    C -->|перехватчик запроса| D[localStorage: token]
    C -->|перехватчик 401| B
    B -->|useState| E[Auth_Store state]
    F[auth middleware] -->|читает isAuthenticated| E
    F -->|navigateTo| G[router]
    A -->|navigateTo после логина| G
```

Поток данных:
1. `login.vue` вызывает `useAuth().login(email, password)`
2. `useAuth` делает POST через `$api` (axios-инстанс из плагина)
3. При успехе: токен → `localStorage`, user → `useState`
4. `auth.ts` middleware проверяет `isAuthenticated` перед каждой навигацией
5. Axios-перехватчик 401 вызывает `useAuth().logout()` и редиректит на `/login`

---

## Components and Interfaces

### `src/composables/useAuth.ts`

```typescript
interface AuthUser {
  id: number
  email: string
  role: 'admin' | 'user'
}

interface AuthState {
  user: AuthUser | null
  token: string | null
}

// Публичный интерфейс composable
interface UseAuth {
  // Реактивное состояние (readonly)
  isAuthenticated: ComputedRef<boolean>
  isAdmin: ComputedRef<boolean>
  user: ComputedRef<AuthUser | null>

  // Методы
  login(email: string, password: string): Promise<void>
  logout(): void
  initAuth(): void  // читает токен из localStorage при инициализации
}
```

`useState` используется как глобальный реактивный стор (Nuxt built-in). Ключ: `'auth'`.

### `src/pages/login.vue`

Компонент формы входа. Локальное состояние:
- `email: string`, `password: string` — поля формы
- `errors: { email?: string; password?: string }` — ошибки валидации
- `apiError: string | null` — ошибка от сервера
- `isLoading: boolean` — состояние запроса

Зависимости: `useAuth()`, `navigateTo` (Nuxt auto-import).

### `src/middleware/auth.ts`

Nuxt route middleware (глобальный, применяется ко всем маршрутам).

```typescript
// Логика:
// if route === '/login' && isAuthenticated → navigateTo('/')
// if route !== '/login' && !isAuthenticated → navigateTo('/login')
```

### `src/plugins/axios.ts` (модификация)

Существующий перехватчик 401 нужно расширить: помимо `navigateTo('/login')` — очищать токен из `localStorage`. Вызов `useAuth().logout()` из плагина создаёт циклическую зависимость, поэтому очистка делается напрямую:

```typescript
// В перехватчике 401:
localStorage.removeItem('token')
navigateTo('/login')
```

`useAuth().initAuth()` вызывается в `app.vue` или плагине при старте приложения.

---

## Data Models

### LoginRequest
```typescript
interface LoginRequest {
  email: string
  password: string
}
```

### LoginResponse (от MSW)
```typescript
interface LoginResponse {
  token: string
  user: {
    id: number
    email: string
    role: 'admin' | 'user'
  }
}
```

### AuthState (внутри useState)
```typescript
interface AuthState {
  user: { id: number; email: string; role: 'admin' | 'user' } | null
  token: string | null
}
```

### Validation
```typescript
interface ValidationErrors {
  email?: string
  password?: string
}

// validateLoginForm(email, password): ValidationErrors
// Правила:
//   email: обязательное, формат RFC 5322 (упрощённый regex)
//   password: обязательное (непустое после trim)
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Пустые поля не проходят валидацию

*For any* строки, состоящей только из пробельных символов (или пустой строки), переданной в качестве email или password, функция `validateLoginForm` должна вернуть объект с ошибкой для соответствующего поля.

**Validates: Requirements 1.3, 1.4**

---

### Property 2: Невалидный формат email отклоняется

*For any* строки, не соответствующей формату email (без `@`, без домена и т.д.), `validateLoginForm` должна вернуть ошибку для поля email.

**Validates: Requirements 1.5**

---

### Property 3: Тело запроса логина содержит переданные credentials

*For any* пары (email, password), вызов `login(email, password)` должен отправить POST-запрос на `/api/auth/login` с телом `{ email, password }` — без изменений.

**Validates: Requirements 2.1**

---

### Property 4: Успешный логин сохраняет токен и пользователя (round-trip)

*For any* пользователя из системы, после успешного вызова `login(email, password)` значение `localStorage.getItem('token')` должно равняться токену из ответа сервера, а `useAuth().user.value` — объекту пользователя из ответа (включая поле `role`).

**Validates: Requirements 2.2, 2.3, 6.1**

---

### Property 5: isAuthenticated отражает наличие токена

*For any* строки-токена, если `localStorage` содержит ключ `token` с непустым значением и вызван `initAuth()`, то `isAuthenticated` должен быть `true`. Если токен отсутствует или пуст — `false`.

**Validates: Requirements 3.1, 3.2**

---

### Property 6: user отражает текущее состояние стора

*For any* объекта пользователя, сохранённого в Auth_Store, `useAuth().user.value` должен возвращать тот же объект. После `logout()` — `null`.

**Validates: Requirements 3.3**

---

### Property 7: isAdmin — инвариант роли

*For any* аутентифицированного пользователя, `isAdmin` должен быть `true` тогда и только тогда, когда `user.role === 'admin'`.

**Validates: Requirements 6.2**

---

### Property 8: Logout полностью очищает состояние

*For any* аутентифицированного состояния (любой токен, любой пользователь), после вызова `logout()` должны выполняться все три условия: `localStorage.getItem('token') === null`, `user.value === null`, `isAuthenticated.value === false`.

**Validates: Requirements 3.4, 3.5**

---

### Property 9: Middleware редиректит неаутентифицированных пользователей

*For any* маршрута, отличного от `/login`, при `isAuthenticated === false` middleware должен вызвать `navigateTo('/login')`.

**Validates: Requirements 4.1**

---

### Property 10: 401 ответ очищает сессию и редиректит

*For any* HTTP-запроса, завершившегося ответом со статусом 401, axios-перехватчик должен удалить токен из `localStorage` и вызвать `navigateTo('/login')`.

**Validates: Requirements 5.1, 5.2**

---

### Property 11: Не-401 ошибки не вызывают редирект

*For any* HTTP-ответа с кодом ошибки, отличным от 401 (например, 400, 403, 500), axios-перехватчик должен отклонить промис с оригинальной ошибкой и не вызывать `navigateTo`.

**Validates: Requirements 5.3**

---

## Error Handling

| Сценарий | Поведение |
|---|---|
| Пустой email или password | Валидационная ошибка на форме, запрос не отправляется |
| Невалидный формат email | Валидационная ошибка на форме |
| 401 от `/api/auth/login` | Сообщение "Invalid credentials" на форме |
| Сетевая ошибка (нет ответа) | Сообщение "Network error. Please try again." на форме |
| 401 на любом другом запросе | Очистка токена + редирект на `/login` |
| Не-401 ошибка API | Promise.reject с оригинальной ошибкой, без редиректа |
| Навигация без токена | Middleware редиректит на `/login` |
| Аутентифицированный на `/login` | Middleware редиректит на `/` |

Ошибки валидации отображаются под соответствующим полем. API-ошибки — в общем блоке над кнопкой submit. Во время запроса кнопка задизейблена.

---

## Testing Strategy

### Инструменты

- **Vitest** — тест-раннер (уже настроен, `jsdom` environment)
- **@fast-check/vitest** — property-based тестирование (уже установлен: `@fast-check/vitest@^0.3.0`, `fast-check@^4.6.0`)
- **MSW v1.x** — мокирование HTTP в тестах (уже настроен в `src/tests/setup.ts`)

### Подход

Используется двойная стратегия: unit-тесты для конкретных примеров и граничных случаев + property-тесты для универсальных свойств.

**Unit-тесты** (`src/tests/unit/`):
- Конкретные примеры: успешный логин, 401, сетевая ошибка, редирект после логина
- Граничные случаи: пустые поля, невалидный email
- Интеграция middleware: аутентифицированный на `/login`, неаутентифицированный на `/tasks`

**Property-тесты** (`src/tests/unit/auth.property.test.ts`):
- Каждый тест запускается минимум 100 итераций (fast-check default: 100)
- Каждый тест помечен комментарием с тегом:
  `// Feature: auth, Property N: <property_text>`

### Маппинг property-тестов

| Property | Тест | Генераторы fast-check |
|---|---|---|
| P1: Пустые поля | `fc.string()` с filter на whitespace-only | `fc.constantFrom('', '   ', '\t')` |
| P2: Невалидный email | `fc.string()` без `@` | `fc.string().filter(s => !s.includes('@'))` |
| P3: Тело запроса | `fc.record({ email: fc.emailAddress(), password: fc.string() })` | MSW handler проверяет тело |
| P4: Login round-trip | `fc.constantFrom(...users)` | Проверка localStorage + store |
| P5: isAuthenticated | `fc.string({ minLength: 1 })` как токен | initAuth() после stubbing localStorage |
| P6: user в сторе | `fc.record(...)` для AuthUser | Прямая запись в useState |
| P7: isAdmin | `fc.constantFrom('admin', 'user')` | Проверка isAdmin === (role === 'admin') |
| P8: Logout | Любое аутентифицированное состояние | Проверка трёх условий после logout() |
| P9: Middleware redirect | `fc.webPath().filter(p => p !== '/login')` | Проверка вызова navigateTo('/login') |
| P10: 401 очищает сессию | Любой endpoint, статус 401 | Проверка localStorage + navigateTo |
| P11: Не-401 не редиректит | `fc.constantFrom(400, 403, 404, 500)` | Проверка отсутствия вызова navigateTo |

### Баланс тестов

Unit-тесты покрывают конкретные сценарии и интеграционные точки. Property-тесты обеспечивают покрытие широкого диапазона входных данных. Не нужно писать отдельные unit-тесты для каждого варианта невалидного email — property-тест с генератором покрывает их все.
