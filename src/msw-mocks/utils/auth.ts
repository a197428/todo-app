import { users } from '../data/users.data'

export function getUserFromAuthHeader(auth?: string) {
  if (!auth) return null
  if (!auth.startsWith('Bearer ')) return null
  const token = auth.slice('Bearer '.length)
  const userId = Number(token)
  return users.find(u => u.id === userId) || null
}
