import { users } from '../data/users.data'

export function getUserFromAuthHeader(auth?: string) {
  if (!auth) return null
  const token = auth.replace('Bearer ', '')
  const userId = Number(token)
  return users.find(u => u.id === userId) || null
}
