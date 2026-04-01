# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tasks.spec.ts >> Основной сценарий: Авторизация → Создание → Редактирование → Удаление >> полный CRUD-сценарий
- Location: e2e/tasks.spec.ts:17:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="modal-title-input"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="modal-title-input"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - status [ref=e3]
    - generic [ref=e4]:
      - banner [ref=e5]:
        - generic [ref=e6]:
          - img [ref=e8]
          - generic [ref=e10]: ToDo App
        - generic [ref=e11]:
          - generic [ref=e12]:
            - generic [ref=e13]: A
            - generic [ref=e14]: admin@test.com
            - generic [ref=e15]: admin
          - button "Выйти" [ref=e16] [cursor=pointer]:
            - img [ref=e17]
            - text: Выйти
      - main [ref=e19]:
        - generic [ref=e20]:
          - button "Новая задача" [ref=e21] [cursor=pointer]:
            - img [ref=e22]
            - text: Новая задача
          - generic [ref=e25]:
            - img
            - textbox "Поиск задач..." [ref=e26]
        - generic [ref=e27]:
          - generic [ref=e28]:
            - button "Все" [ref=e29] [cursor=pointer]
            - button "Активные" [ref=e30] [cursor=pointer]
            - button "Готовые" [ref=e31] [cursor=pointer]
            - button "Просроченные" [ref=e32] [cursor=pointer]
          - combobox [ref=e33] [cursor=pointer]:
            - 'option "Сортировка: по умолчанию" [selected]'
            - 'option "Сортировка: дата ↑"'
            - 'option "Сортировка: дата ↓"'
            - 'option "Сортировка: по статусу"'
        - generic [ref=e34]:
          - generic [ref=e35]:
            - generic [ref=e36]:
              - heading "Сделать логин" [level=3] [ref=e37]
              - generic [ref=e39]:
                - img [ref=e40]
                - text: Просрочено
            - paragraph [ref=e42]: Форма email/password
            - generic [ref=e43]:
              - generic [ref=e44]:
                - img [ref=e45]
                - text: 15.02.2026
              - generic [ref=e47]:
                - button "Изменить" [ref=e48] [cursor=pointer]:
                  - img [ref=e49]
                  - text: Изменить
                - button "Удалить" [ref=e51] [cursor=pointer]:
                  - img [ref=e52]
                  - text: Удалить
          - generic [ref=e54]:
            - generic [ref=e55]:
              - heading "Список задач" [level=3] [ref=e56]
              - generic [ref=e58]:
                - img [ref=e59]
                - text: Готово
            - paragraph [ref=e61]: Фильтрация и сортировка
            - generic [ref=e62]:
              - generic [ref=e63]:
                - img [ref=e64]
                - text: 18.02.2026
              - generic [ref=e66]:
                - button "Изменить" [ref=e67] [cursor=pointer]:
                  - img [ref=e68]
                  - text: Изменить
                - button "Удалить" [ref=e70] [cursor=pointer]:
                  - img [ref=e71]
                  - text: Удалить
          - generic [ref=e73]:
            - generic [ref=e74]:
              - heading "E2E задача 1775055231253" [level=3] [ref=e75]
              - generic [ref=e77]:
                - img [ref=e78]
                - text: Активна
            - generic [ref=e80]:
              - generic [ref=e81]:
                - img [ref=e82]
                - text: 01T14:53:52.979Z.04.2026
              - generic [ref=e84]:
                - button "Изменить" [active] [ref=e85] [cursor=pointer]:
                  - img [ref=e86]
                  - text: Изменить
                - button "Удалить" [ref=e88] [cursor=pointer]:
                  - img [ref=e89]
                  - text: Удалить
      - generic [ref=e93]:
        - generic [ref=e94]:
          - heading "Редактировать задачу" [level=2] [ref=e95]
          - button [ref=e96] [cursor=pointer]:
            - img [ref=e97]
        - generic [ref=e99]:
          - generic [ref=e100]:
            - generic [ref=e101]: Название *
            - textbox [ref=e102]: E2E задача 1775055231253
          - generic [ref=e103]:
            - generic [ref=e104]: Описание
            - textbox [ref=e105]
          - generic [ref=e106]:
            - generic [ref=e107]:
              - generic [ref=e108]: Срок
              - textbox [ref=e109]
            - generic [ref=e111] [cursor=pointer]:
              - checkbox "Выполнено" [ref=e113]
              - generic [ref=e116]: Выполнено
          - generic [ref=e117]:
            - button "Отмена" [ref=e118] [cursor=pointer]
            - button "Сохранить" [ref=e119] [cursor=pointer]
  - generic:
    - img
  - generic [ref=e120]:
    - button "Toggle Nuxt DevTools" [ref=e121] [cursor=pointer]:
      - img [ref=e122]
    - generic "Page load time" [ref=e125]:
      - generic [ref=e126]: "51"
      - generic [ref=e127]: ms
    - button "Toggle Component Inspector" [ref=e129] [cursor=pointer]:
      - img [ref=e130]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | const ADMIN = { email: 'admin@test.com', password: '123456' }
  4   | 
  5   | async function login(page: any) {
  6   |   await page.goto('/login')
  7   |   await page.fill('#email', ADMIN.email)
  8   |   await page.fill('#password', ADMIN.password)
  9   |   await page.click('button[type="submit"]')
  10  |   await expect(page).toHaveURL('/', { timeout: 10_000 })
  11  |   await expect(page.locator('main')).not.toContainText('Загрузка', { timeout: 10_000 })
  12  | }
  13  | 
  14  | test.describe('Основной сценарий: Авторизация → Создание → Редактирование → Удаление', () => {
  15  |   test.setTimeout(60_000)
  16  | 
  17  |   test('полный CRUD-сценарий', async ({ page }) => {
  18  |     const TASK_TITLE = `E2E задача ${Date.now()}`
  19  |     const TASK_TITLE_UPDATED = `${TASK_TITLE} — обновлено`
  20  | 
  21  |     // ── 1. Авторизация ──────────────────────────────────────────────────────
  22  |     await login(page)
  23  |     await expect(page.locator('header')).toContainText(ADMIN.email)
  24  | 
  25  |     // ── 2. Создание задачи ──────────────────────────────────────────────────
  26  |     await page.click('button:has-text("Новая задача")')
  27  |     await expect(page.locator('h2:has-text("Новая задача")')).toBeVisible()
  28  | 
  29  |     await page.fill('#task-title', TASK_TITLE)
  30  | 
  31  |     const [createResp] = await Promise.all([
  32  |       page.waitForResponse(r => r.url().includes('/api/tasks') && r.request().method() === 'POST'),
  33  |       page.click('button[type="submit"]:has-text("Создать")')
  34  |     ])
  35  |     expect(createResp.status()).toBe(201)
  36  | 
  37  |     // Ждём появления задачи в списке
  38  |     await expect(page.getByText(TASK_TITLE)).toBeVisible({ timeout: 10_000 })
  39  | 
  40  |     // ── 3. Редактирование задачи ────────────────────────────────────────────
  41  |     // Кликаем кнопку "Изменить" рядом с нашей задачей
  42  |     await page.locator('[data-testid="task-card"]')
  43  |       .filter({ hasText: TASK_TITLE })
  44  |       .getByRole('button', { name: 'Изменить' })
  45  |       .click()
  46  | 
  47  |     // Ждём появления модалки и поля ввода
  48  |     await expect(page.locator('h2:has-text("Редактировать задачу")')).toBeVisible()
  49  |     const titleInput = page.locator('[data-testid="modal-title-input"]')
> 50  |     await expect(titleInput).toBeVisible({ timeout: 5_000 })
      |                              ^ Error: expect(locator).toBeVisible() failed
  51  |     await titleInput.fill(TASK_TITLE_UPDATED)
  52  | 
  53  |     const [updateResp] = await Promise.all([
  54  |       page.waitForResponse(r => r.url().includes('/api/tasks') && r.request().method() === 'PUT'),
  55  |       page.click('button[type="submit"]:has-text("Сохранить")')
  56  |     ])
  57  |     expect(updateResp.status()).toBe(200)
  58  | 
  59  |     await expect(page.getByText(TASK_TITLE_UPDATED)).toBeVisible({ timeout: 10_000 })
  60  | 
  61  |     // ── 4. Удаление задачи ──────────────────────────────────────────────────
  62  |     await page.locator('[data-testid="task-card"]')
  63  |       .filter({ hasText: TASK_TITLE_UPDATED })
  64  |       .getByRole('button', { name: 'Удалить' })
  65  |       .click()
  66  | 
  67  |     await expect(page.locator('text=Подтвердите действие')).toBeVisible()
  68  | 
  69  |     const [deleteResp] = await Promise.all([
  70  |       page.waitForResponse(r => r.url().includes('/api/tasks') && r.request().method() === 'DELETE'),
  71  |       page.locator('[data-testid="confirm-delete-btn"]').click()
  72  |     ])
  73  |     expect(deleteResp.status()).toBe(204)
  74  | 
  75  |     await expect(page.getByText(TASK_TITLE_UPDATED)).not.toBeVisible({ timeout: 10_000 })
  76  |   })
  77  | 
  78  |   test('валидация формы — пустое название', async ({ page }) => {
  79  |     await login(page)
  80  |     await page.click('button:has-text("Новая задача")')
  81  |     await page.click('button[type="submit"]:has-text("Создать")')
  82  |     await expect(page.locator('text=Название обязательно')).toBeVisible()
  83  |   })
  84  | 
  85  |   test('неверный пароль — сообщение об ошибке', async ({ page }) => {
  86  |     await page.goto('/login')
  87  |     await page.fill('#email', ADMIN.email)
  88  |     await page.fill('#password', 'wrongpassword')
  89  |     await page.click('button[type="submit"]')
  90  |     await expect(page.locator('text=Неверный email или пароль')).toBeVisible()
  91  |     await expect(page).toHaveURL('/login')
  92  |   })
  93  | 
  94  |   test('выход из системы', async ({ page }) => {
  95  |     await login(page)
  96  |     await page.click('button:has-text("Выйти")')
  97  |     await expect(page).toHaveURL('/login')
  98  |   })
  99  | })
  100 | 
```