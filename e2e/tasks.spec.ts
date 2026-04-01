import { test, expect } from '@playwright/test'

const ADMIN = { email: 'admin@test.com', password: '123456' }

async function login(page: any) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#password', ADMIN.password)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/', { timeout: 10_000 })
  await expect(page.locator('main')).not.toContainText('Загрузка', { timeout: 10_000 })
}

test.describe('Основной сценарий: Авторизация → Создание → Редактирование → Удаление', () => {
  test.setTimeout(60_000)

  test('полный CRUD-сценарий', async ({ page }) => {
    const TASK_TITLE = `E2E задача ${Date.now()}`
    const TASK_TITLE_UPDATED = `${TASK_TITLE} — обновлено`

    // ── 1. Авторизация ──────────────────────────────────────────────────────
    await login(page)
    await expect(page.locator('header')).toContainText(ADMIN.email)

    // ── 2. Создание задачи ──────────────────────────────────────────────────
    await page.click('button:has-text("Новая задача")')
    await expect(page.locator('h2:has-text("Новая задача")')).toBeVisible()

    await page.fill('#task-title', TASK_TITLE)

    const [createResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/tasks') && r.request().method() === 'POST'),
      page.click('button[type="submit"]:has-text("Создать")')
    ])
    expect(createResp.status()).toBe(201)

    // Ждём появления задачи в списке
    await expect(page.getByText(TASK_TITLE)).toBeVisible({ timeout: 10_000 })

    // ── 3. Редактирование задачи ────────────────────────────────────────────
    // Кликаем кнопку "Изменить" рядом с нашей задачей
    await page.locator('[data-testid="task-card"]')
      .filter({ hasText: TASK_TITLE })
      .getByRole('button', { name: 'Изменить' })
      .click()

    // Ждём появления модалки и поля ввода
    await expect(page.locator('h2:has-text("Редактировать задачу")')).toBeVisible()
    const titleInput = page.locator('[data-testid="modal-title-input"]')
    await expect(titleInput).toBeVisible({ timeout: 5_000 })
    await titleInput.fill(TASK_TITLE_UPDATED)

    const [updateResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/tasks') && r.request().method() === 'PUT'),
      page.click('button[type="submit"]:has-text("Сохранить")')
    ])
    expect(updateResp.status()).toBe(200)

    await expect(page.getByText(TASK_TITLE_UPDATED)).toBeVisible({ timeout: 10_000 })

    // ── 4. Удаление задачи ──────────────────────────────────────────────────
    await page.locator('[data-testid="task-card"]')
      .filter({ hasText: TASK_TITLE_UPDATED })
      .getByRole('button', { name: 'Удалить' })
      .click()

    await expect(page.locator('text=Подтвердите действие')).toBeVisible()

    const [deleteResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/tasks') && r.request().method() === 'DELETE'),
      page.locator('[data-testid="confirm-delete-btn"]').click()
    ])
    expect(deleteResp.status()).toBe(204)

    await expect(page.getByText(TASK_TITLE_UPDATED)).not.toBeVisible({ timeout: 10_000 })
  })

  test('валидация формы — пустое название', async ({ page }) => {
    await login(page)
    await page.click('button:has-text("Новая задача")')
    await page.click('button[type="submit"]:has-text("Создать")')
    await expect(page.locator('text=Название обязательно')).toBeVisible()
  })

  test('неверный пароль — сообщение об ошибке', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', ADMIN.email)
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Неверный email или пароль')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('выход из системы', async ({ page }) => {
    await login(page)
    await page.click('button:has-text("Выйти")')
    await expect(page).toHaveURL('/login')
  })
})
