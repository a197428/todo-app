import { describe, it, expect } from 'vitest'
import { test, fc } from '@fast-check/vitest'
import { getUserFromAuthHeader } from '../../msw-mocks/utils/auth'

describe('getUserFromAuthHeader', () => {
  // 3.1 — конкретные примеры
  it('возвращает пользователя id:1 для "Bearer 1"', () => {
    const result = getUserFromAuthHeader('Bearer 1')
    expect(result?.id).toBe(1)
    expect(result?.email).toBe('admin@test.com')
  })

  it('возвращает пользователя id:2 для "Bearer 2"', () => {
    const result = getUserFromAuthHeader('Bearer 2')
    expect(result?.id).toBe(2)
    expect(result?.email).toBe('user@test.com')
  })

  it('возвращает null для undefined', () => {
    expect(getUserFromAuthHeader(undefined)).toBeNull()
  })

  it('возвращает null для пустой строки', () => {
    expect(getUserFromAuthHeader('')).toBeNull()
  })

  it('возвращает null для "Bearer 999"', () => {
    expect(getUserFromAuthHeader('Bearer 999')).toBeNull()
  })

  // 3.2 — Property 1: Round-trip getUserFromAuthHeader
  // Feature: vitest-auth-testing, Property 1: Round-trip getUserFromAuthHeader
  // Validates: Requirements 3.6
  test.prop([fc.integer({ min: 1, max: 2 })])(
    'round-trip: getUserFromAuthHeader("Bearer " + id)?.id === id',
    (id) => {
      const result = getUserFromAuthHeader(`Bearer ${id}`)
      expect(result?.id).toBe(id)
    }
  )

  // 3.3 — Property 2: Невалидный ввод возвращает null
  // Feature: vitest-auth-testing, Property 2: Невалидный ввод возвращает null
  // Validates: Requirements 3.3, 3.4, 3.5
  test.prop([fc.string().filter(s => s !== 'Bearer 1' && s !== 'Bearer 2')])(
    'невалидный ввод всегда возвращает null',
    (input) => {
      expect(getUserFromAuthHeader(input)).toBeNull()
    }
  )
})
