import { rest } from 'msw'
import { users } from '../data/users.data'

export const authHandlers = [
  rest.post('http://localhost/api/auth/login', async (req, res, ctx) => {
    const { email, password } = await req.json()
    const user = users.find(u => u.email === email && u.password === password)

    if (!user) {
      return res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
    }

    return res(
      ctx.json({
        token: String(user.id),
        user: { id: user.id, email: user.email, role: user.role },
      })
    )
  }),
]
