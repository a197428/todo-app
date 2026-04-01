import { describe, it, expect, beforeEach } from 'vitest'
import { tasks } from '../../msw-mocks/data/tasks.data'

// Базовый URL для MSW в node-окружении
const BASE = 'http://localhost'

function authHeader(userId: number) {
  return { Authorization: `Bearer ${userId}` }
}

async function putTask(id: number, body: object, headers: Record<string, string> = {}) {
  return fetch(`${BASE}/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

async function deleteTask(id: number, headers: Record<string, string> = {}) {
  return fetch(`${BASE}/api/tasks/${id}`, {
    method: 'DELETE',
    headers,
  })
}

// Сбрасываем массив задач перед каждым тестом
beforeEach(() => {
  tasks.length = 0
  tasks.push(
    { Id: 1, Title: 'Сделать логин', Description: 'Форма email/password', DueDate: '2026-02-15', IsCompleted: false, OwnerId: 1 },
    { Id: 2, Title: 'Список задач', Description: 'Фильтрация и сортировка', DueDate: '2026-02-18', IsCompleted: true, OwnerId: 2 },
  )
})

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────

describe('PUT /api/tasks/:id', () => {
  it('401 без токена', async () => {
    const res = await putTask(1, { Title: 'New' })
    expect(res.status).toBe(401)
  })

  it('404 для несуществующего id', async () => {
    const res = await putTask(999, { Title: 'New' }, authHeader(1))
    expect(res.status).toBe(404)
  })

  it('403 для чужой задачи (user пытается изменить задачу admin)', async () => {
    // user id=2 пытается изменить задачу id=1 (OwnerId=1)
    const res = await putTask(1, { Title: 'Hacked' }, authHeader(2))
    expect(res.status).toBe(403)
  })

  it('200 + обновлённые данные для owner', async () => {
    const payload = { Title: 'Updated', Description: 'New desc', DueDate: '2027-01-01', IsCompleted: true }
    const res = await putTask(2, payload, authHeader(2))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.Title).toBe('Updated')
    expect(body.Description).toBe('New desc')
    expect(body.DueDate).toBe('2027-01-01')
    expect(body.IsCompleted).toBe(true)
    // Id и OwnerId не меняются
    expect(body.Id).toBe(2)
    expect(body.OwnerId).toBe(2)
  })

  it('200 для admin на чужой задаче', async () => {
    // admin id=1 может редактировать задачу id=2 (OwnerId=2)
    const res = await putTask(2, { Title: 'Admin edit' }, authHeader(1))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.Title).toBe('Admin edit')
  })
})

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────

describe('DELETE /api/tasks/:id', () => {
  it('401 без токена', async () => {
    const res = await deleteTask(1)
    expect(res.status).toBe(401)
  })

  it('404 для несуществующего id', async () => {
    const res = await deleteTask(999, authHeader(1))
    expect(res.status).toBe(404)
  })

  it('403 для чужой задачи', async () => {
    // user id=2 пытается удалить задачу id=1 (OwnerId=1)
    const res = await deleteTask(1, authHeader(2))
    expect(res.status).toBe(403)
  })

  it('204 для owner', async () => {
    const res = await deleteTask(2, authHeader(2))
    expect(res.status).toBe(204)
    // Задача удалена из массива
    expect(tasks.find(t => t.Id === 2)).toBeUndefined()
  })

  it('204 для admin на чужой задаче', async () => {
    const res = await deleteTask(2, authHeader(1))
    expect(res.status).toBe(204)
    expect(tasks.find(t => t.Id === 2)).toBeUndefined()
  })
})
