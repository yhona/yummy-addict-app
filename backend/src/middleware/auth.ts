import type { Context, Next } from 'hono'
import { jwt } from 'hono/jwt'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production'

export const jwtMiddleware = jwt({
  secret: JWT_SECRET,
})

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const payload = c.get('jwtPayload')
    
    if (!payload || !payload.userId) {
      return c.json({ error: 'Invalid token payload' }, 401)
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId as string),
    })

    if (!user || (!user.isActive && user.role !== 'admin')) {
      return c.json({ error: 'Unauthorized or inactive user' }, 401)
    }

    // Pass user to context
    c.set('user', user)

    await next()
  } catch (err) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}
