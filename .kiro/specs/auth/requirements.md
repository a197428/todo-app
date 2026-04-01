# Requirements Document

## Introduction

Реализация системы авторизации для Nuxt 3 ToDo-приложения. Включает страницу входа с формой email/password, хранение JWT-токена в localStorage, защиту маршрутов через middleware, обработку 401 ошибок и разграничение ролей (admin/user).

## Glossary

- **Auth_System**: система авторизации приложения
- **Login_Form**: форма входа с полями email и password
- **Auth_Store**: хранилище состояния авторизации (composable или Pinia store)
- **Token**: JWT-токен, возвращаемый сервером при успешной авторизации
- **Auth_Middleware**: Nuxt route middleware, защищающий приватные маршруты
- **User**: объект с полями `id`, `email`, `role` (`admin` | `user`)
- **API**: axios-инстанс, предоставляемый плагином `src/plugins/axios.ts`
- **MSW**: Mock Service Worker, имитирующий бэкенд в dev/test окружении

---

## Requirements

### Requirement 1: Форма входа

**User Story:** As a visitor, I want to enter my email and password on the login page, so that I can authenticate and access the application.

#### Acceptance Criteria

1. THE Login_Form SHALL contain an email input field and a password input field.
2. THE Login_Form SHALL contain a submit button.
3. WHEN the user submits the Login_Form with an empty email field, THE Login_Form SHALL display a validation error message for the email field.
4. WHEN the user submits the Login_Form with an empty password field, THE Login_Form SHALL display a validation error message for the password field.
5. WHEN the user submits the Login_Form with an invalid email format, THE Login_Form SHALL display a validation error indicating the email format is incorrect.
6. WHILE a login request is in progress, THE Login_Form SHALL disable the submit button and display a loading indicator.

---

### Requirement 2: Процесс аутентификации

**User Story:** As a visitor, I want to submit my credentials and receive a token, so that I can access protected resources.

#### Acceptance Criteria

1. WHEN the user submits valid credentials, THE Auth_System SHALL send a POST request to `/api/auth/login` with `{ email, password }` in the request body.
2. WHEN the server returns a successful response, THE Auth_System SHALL store the received Token in `localStorage` under the key `token`.
3. WHEN the server returns a successful response, THE Auth_System SHALL store the received User object in the Auth_Store.
4. WHEN the server returns a successful response, THE Auth_System SHALL redirect the user to the `/` (home) route.
5. WHEN the server returns a 401 response, THE Auth_System SHALL display an error message "Invalid credentials" on the Login_Form.
6. IF a network error occurs during login, THEN THE Auth_System SHALL display a generic error message on the Login_Form.

---

### Requirement 3: Хранение и управление токеном

**User Story:** As an authenticated user, I want my session to persist across page reloads, so that I don't have to log in every time.

#### Acceptance Criteria

1. THE Auth_Store SHALL read the Token from `localStorage` on application initialization.
2. THE Auth_Store SHALL expose a reactive `isAuthenticated` property that is `true` when a Token is present and `false` otherwise.
3. THE Auth_Store SHALL expose a reactive `user` property containing the current User object or `null`.
4. WHEN the user logs out, THE Auth_System SHALL remove the Token from `localStorage`.
5. WHEN the user logs out, THE Auth_System SHALL clear the User from the Auth_Store.
6. WHEN the user logs out, THE Auth_System SHALL redirect the user to `/login`.

---

### Requirement 4: Защита маршрутов

**User Story:** As an unauthenticated visitor, I want to be redirected to the login page when accessing protected routes, so that private data remains secure.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any route except `/login`, THE Auth_Middleware SHALL redirect the user to `/login`.
2. WHEN an authenticated user navigates to `/login`, THE Auth_Middleware SHALL redirect the user to `/`.
3. THE Auth_Middleware SHALL apply to all routes except `/login`.

---

### Requirement 5: Обработка 401 ошибок

**User Story:** As an authenticated user, I want to be automatically logged out when my session expires, so that I'm not stuck in a broken state.

#### Acceptance Criteria

1. WHEN the API returns a 401 response on any request, THE API SHALL remove the Token from `localStorage`.
2. WHEN the API returns a 401 response on any request, THE API SHALL redirect the user to `/login`.
3. WHEN the API returns a non-401 error response, THE API SHALL reject the promise with the original error without redirecting.

---

### Requirement 6: Роли пользователей

**User Story:** As the application, I want to know the role of the authenticated user, so that role-based access control can be applied.

#### Acceptance Criteria

1. WHEN the server returns a successful login response, THE Auth_Store SHALL store the `role` field (`admin` | `user`) from the User object.
2. THE Auth_Store SHALL expose a reactive `isAdmin` property that is `true` when the current user's role is `admin`.
3. WHILE a user is authenticated, THE Auth_Store SHALL provide the current user's role to any component that requests it.
