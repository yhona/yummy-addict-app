import { Hono } from 'hono'
import { db } from '../db'
import { suppliers } from '../db/schema'
import { eq, desc, like, sql } from 'drizzle-orm'
import { z } from 'zod'

const suppliersRoutes = new Hono()

const supplierSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  contactPerson: z.string().max(100).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
})

// List
suppliersRoutes.get('/', async (c) => {
  try {
    const search = c.req.query('search') || ''
    const limit = Number(c.req.query('limit')) || 50
    
    const conditions = []
    if (search) {
        conditions.push(like(suppliers.name, `%${search}%`))
    }

    const data = await db.query.suppliers.findMany({
      where: search ? like(suppliers.name, `%${search}%`) : undefined,
      orderBy: [desc(suppliers.createdAt)],
      limit
    })
    return c.json({ data })
  } catch (error) {
    return c.json({ error: 'Failed to fetch suppliers' }, 500)
  }
})

// Get One
suppliersRoutes.get('/:id', async (c) => {
    const id = c.req.param('id')
    const data = await db.query.suppliers.findFirst({ where: eq(suppliers.id, id) })
    if(!data) return c.json({ error: 'Not found' }, 404)
    return c.json(data)
})

// Create
suppliersRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validation = supplierSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation error', details: validation.error.flatten() }, 400)
    }

    const existing = await db.query.suppliers.findFirst({
        where: eq(suppliers.code, validation.data.code)
    })
    if (existing) {
        return c.json({ error: 'Code already exists' }, 400)
    }

    const [newItem] = await db.insert(suppliers).values(validation.data).returning()
    return c.json(newItem, 201)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to create supplier' }, 500)
  }
})

// Update
suppliersRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validation = supplierSchema.partial().safeParse(body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation error' }, 400)
    }

    const [updated] = await db
      .update(suppliers)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning()
      
    if (!updated) return c.json({ error: 'Not found' }, 404)
    return c.json(updated)
  } catch (error) {
    return c.json({ error: 'Failed to update supplier' }, 500)
  }
})

// Delete
suppliersRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    // Check relations first? (Purchases)
    // If foreign key constraint exists, DB will fail.
    await db.delete(suppliers).where(eq(suppliers.id, id))
    return c.json({ success: true })
  } catch (error) {
    // Catch FK constraint error
    return c.json({ error: 'Failed to delete (might be used in purchases)' }, 500)
  }
})

export { suppliersRoutes }
