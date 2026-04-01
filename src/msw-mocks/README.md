# 📝 To-Do List — Frontend Test Task (Nuxt + MSW)

Мини-приложение «Список задач», реализованное в рамках тестового задания на позицию **Frontend-разработчика**.

В качестве бэкенда используется **MSW (Mock Service Worker)**, что позволяет эмулировать полноценный REST API без реального сервера.

---

## 🚀 Технологии

- Nuxt 3 (поддерживается Nuxt 2)
- Vue 3
- Axios
- MSW (Mock Service Worker)
- TypeScript
- Tailwind CSS / Bootstrap (иконки)

---

## 📦 Функциональность

### Авторизация
- Форма входа (email / password)
- Получение fake JWT
- Хранение токена в localStorage
- Перехват 401 и редирект на страницу логина

### Задачи
- Получение списка задач
- Создание задачи
- Редактирование задачи
- Удаление задачи
- Базовая валидация данных
- Визуальная индикация загрузки

### Дополнительно
- Проверка прав доступа (владелец / админ)
- Реалистичные HTTP-коды ошибок (400, 401, 403, 404)
- Эмуляция задержек сети

---

## 📁 Структура проекта

```
src/
 ├─ mocks/
 │   ├─ browser.ts
 │   ├─ handlers/
 │   │   ├─ auth.handlers.ts
 │   │   └─ tasks.handlers.ts
 │   ├─ data/
 │   │   ├─ users.data.ts
 │   │   └─ tasks.data.ts
 │   └─ utils/
 │       └─ auth.ts
 ├─ plugins/
 │   ├─ msw.client.ts
 │   └─ axios.ts
 └─ pages/
```

---

## 🧪 Использование MSW

### Установка

```bash
npm install msw --save-dev
npx msw init public/ --save
```

---

### Инициализация MSW (Nuxt 3)

```ts
export default defineNuxtPlugin(async () => {
  if (process.env.NODE_ENV !== 'development') return

  const { worker } = await import('~/mocks/browser')

  await worker.start({
    onUnhandledRequest: 'bypass',
  })
})
```

MSW запускается только на клиенте и только в dev-режиме.

---

## 🔐 Авторизация (Axios)

```ts
import axios from 'axios'

export default defineNuxtPlugin(() => {
  const api = axios.create({
    baseURL: '/api',
  })

  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  api.interceptors.response.use(
    r => r,
    error => {
      if (error.response?.status === 401) {
        navigateTo('/login')
      }
      return Promise.reject(error)
    },
  )

  return {
    provide: { api },
  }
})
```

---

## 👤 Тестовые пользователи

| Email          | Пароль | Роль  |
|----------------|--------|-------|
| admin@test.com | 123456 | admin |
| user@test.com  | 123456 | user  |

Fake JWT = user.id

---

## 📡 API

### Авторизация

POST /api/auth/login

```json
{
  "email": "admin@test.com",
  "password": "123456"
}
```

---

### Получение задач

GET /api/tasks

Authorization: Bearer <token>

---

### Создание задачи

POST /api/tasks

```json
{
  "Title": "Новая задача",
  "Description": "Описание",
  "DueDate": "2026-02-20"
}
```

---

### Редактирование задачи

PUT /api/tasks/{id}

---

### Удаление задачи

DELETE /api/tasks/{id}

---

## ▶ Запуск проекта

```bash
npm install
npm run dev
```

---

## 📌 Примечание

MSW используется только для разработки.  
В production предполагается подключение реального REST API (ASP.NET или иной).
