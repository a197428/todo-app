import { test, expect } from '@playwright/test'

const ADMIN = { email: 'admin@test.com', password: '123456' }
const TASK_TITLE = `E2E задача ${Date.now()}`
const TASK_TITLE_UPDATED = `${TASK_TITLE} — обновлено`

test.describe('Основной сценарий: Авторизация → Создание → Редактирование → Удаление', () => {
  test('полный CRUD-сценарий', async ({ page }) => {
    // ── 1. Авторизация ──────────────────────────────────────────────────────
    await page.goto('/login')
    await expect(page).toHaveURL('/login')

    await page.fill('#email', ADMIN.email)
    await page.fill('#password', ADMIN.password)
    await page.click('button[type="submit"]')

    // После логина — редирект на главную
    await expect(page).toHaveURL('/')
    await expect(page.locator('header')).toContainText(ADMIN.email)

    // ── 2. Создание задачи ──────────────────────────────────────────────────
    await page.click('button:has-text("Новая задача")')

    // Модальное окно открылось
    await expect(page.locator('text=Новая задача').first()).toBeVisible()

    await page.fill('#task-title', TASK_TITLE)
    await page.fill('#task-description', 'Описание E2E задачи')
    await page.click('button[type="submit"]:has-text("Создать")')

    // Задача появилась в списке
    await expect(page.locator(`text=${TASK_TITLE}`)).toBeVisible()

    // ── 3. Редактирование задачи ────────────────────────────────────────────
    // Находим карточку с нашей задачей и кликаем "Изменить"
    const taskCard = page.locator(`text=${TASK_TITLE}`).locator('..').locator('..')
    await taskCard.locator('button:has-text("Изменить")').click()

    // Модальное окно редактирования открылось
    await expect(page.locator('text=Редактировать задачу')).toBeVisible()

    // Очищаем и вводим новое название
    await page.fill('#modal-task-title', TASK_TITLE_UPDATED)
    await page.click('button[type="submit"]:has-text("Сохранить")')

    // Обновлённое название в списке
    await expect(page.locator(`text=${TASK_TITLE_UPDATED}`)).toBeVisible()
    await expect(page.locator(`text=${TASK_TITLE}`).first()).not.toBeVisible()

    // ── 4. Удаление задачи ──────────────────────────────────────────────────
    const updatedCard = page.locator(`text=${TASK_TITLE_UPDATED}`).locator('..').locator('..')
    await updatedCard.locator('button:has-text("Удалить")').click()

    // Диалог подтверждения
    await expect(page.locator('text=Подтвердите действие')).toBeVisible()
    await page.click('button:has-text("Удалить"):not([disabled])')

    // Задача исчезла из списка
    await expect(page.locator(`text=${TASK_TITLE_UPDATED}`)).not.toBeVisible()
  })

  test('валидация формы — пустое название', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', ADMIN.email)
    await page.fill('#password', ADMIN.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')

    await page.click('button:has-text("Новая задача")')
    await page.click('button[type="submit"]:has-text("Создать")')

    // Ошибка валидации
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
    await page.goto('/login')
    await page.fill('#email', ADMIN.email)
    await page.fill('#password', ADMIN.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')

    await page.click('button:has-text("Выйти")')
    await expect(page).toHaveURL('/login')
  })
})
