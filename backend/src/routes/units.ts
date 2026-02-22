import { Hono } from 'hono'
import { db } from '../db'
import { units, products } from '../db/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { z } from 'zod'

const unitsRoutes = new Hono()

// Unit schema
const unitSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
})

// List units
unitsRoutes.get('/', async (c) => {
  try {
    const result = await db.query.units.findMany({
      orderBy: [desc(units.createdAt)],
    })
    return c.json(result)
  } catch (error) {
    console.error('Get units error:', error)
    return c.json({ error: 'Failed to get units' }, 500)
  }
})

// Create unit
unitsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const data = unitSchema.parse(body)

    // Check if code exists
    const existing = await db.query.units.findFirst({
      where: eq(units.code, data.code.toUpperCase()),
    })

    if (existing) {
      return c.json({ error: 'Unit code already exists' }, 400)
    }

    const [newUnit] = await db.insert(units).values({
      ...data,
      code: data.code.toUpperCase(),
    }).returning()

    return c.json(newUnit, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    console.error('Create unit error:', error)
    return c.json({ error: 'Failed to create unit' }, 500)
  }
})

// Update unit
unitsRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const data = unitSchema.partial().parse(body)

    const [updated] = await db
      .update(units)
      .set({
        ...data,
        code: data.code?.toUpperCase(),
        updatedAt: new Date(),
      })
      .where(eq(units.id, id))
      .returning()

    if (!updated) {
      return c.json({ error: 'Unit not found' }, 404)
    }

    return c.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    console.error('Update unit error:', error)
    return c.json({ error: 'Failed to update unit' }, 500)
  }
})

// Delete unit
unitsRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Check if has products
    const productCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.unitId, id))

    if (Number(productCount[0]?.count ?? 0) > 0) {
      return c.json({ error: 'Cannot delete unit used by products' }, 400)
    }

    const [deleted] = await db
      .delete(units)
      .where(eq(units.id, id))
      .returning()

    if (!deleted) {
      return c.json({ error: 'Unit not found' }, 404)
    }

    return c.json({ message: 'Unit deleted' })
  } catch (error) {
    console.error('Delete unit error:', error)
    return c.json({ error: 'Failed to delete unit' }, 500)
  }
})

export { unitsRoutes }
