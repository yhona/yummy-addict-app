import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import bcrypt from 'bcrypt'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const authRoutes = new Hono()

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production'

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Register schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
})

// Login
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password } = loginSchema.parse(body)

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    if (!user.isActive) {
      return c.json({ error: 'Account is disabled' }, 401)
    }

    const token = await sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days expiration
      },
      JWT_SECRET
    )

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Register (for initial setup)
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password, name } = registerSchema.parse(body)

    // Check if user exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existing) {
      return c.json({ error: 'Email already registered' }, 400)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: 'admin', // First user is admin
    }).returning()

    return c.json({
      user: {
        id: newUser!.id,
        email: newUser!.email,
        name: newUser!.name,
        role: newUser!.role,
      },
    }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    console.error('Register error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Get current user
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const token = authHeader.slice(7)
    const decoded = await verify(token, JWT_SECRET) as { userId: string }

    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

export { authRoutes }
