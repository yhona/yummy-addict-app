
import { Hono } from 'hono'
import { db } from '../db'
import { couriers } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { z } from 'zod'

const couriersRoutes = new Hono()

const createCourierSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  defaultCost: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

const updateCourierSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  defaultCost: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

// Get all couriers
couriersRoutes.get('/', async (c) => {
  try {
    const isActive = c.req.query('isActive')
    
    let whereClause = undefined
    if (isActive === 'true') {
        whereClause = eq(couriers.isActive, true)
    }

    const data = await db.query.couriers.findMany({
      where: whereClause,
      orderBy: [desc(couriers.createdAt)]
    })
    
    return c.json({ data })
  } catch (error) {
    console.error('List couriers error:', error)
    return c.json({ error: 'Failed to list couriers' }, 500)
  }
})

// Get courier by ID
couriersRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const courier = await db.query.couriers.findFirst({
      where: eq(couriers.id, id)
    })
    
    if (!courier) {
      return c.json({ error: 'Courier not found' }, 404)
    }
    
    return c.json(courier)
  } catch (error) {
    return c.json({ error: 'Failed to get courier' }, 500)
  }
})

// Create courier
couriersRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validation = createCourierSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation error', details: validation.error.flatten() }, 400)
    }
    
    const data = validation.data
    
    const [newCourier] = await db.insert(couriers).values({
      code: data.code,
      name: data.name,
      description: data.description,
      defaultCost: data.defaultCost ? String(data.defaultCost) : '0',
      isActive: data.isActive !== undefined ? data.isActive : true,
    }).returning()
    
    return c.json(newCourier, 201)
  } catch (error) {
    console.error('Create courier error:', error)
    return c.json({ error: 'Failed to create courier' }, 500)
  }
})

// Update courier
couriersRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validation = updateCourierSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation error', details: validation.error.flatten() }, 400)
    }
    
    const data = validation.data
    
    const [updatedCourier] = await db.update(couriers)
      .set({
        ...data,
        defaultCost: data.defaultCost ? String(data.defaultCost) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(couriers.id, id))
      .returning()
      
    if (!updatedCourier) {
      return c.json({ error: 'Courier not found' }, 404)
    }
    
    return c.json(updatedCourier)
  } catch (error) {
    console.error('Update courier error:', error)
    return c.json({ error: 'Failed to update courier' }, 500)
  }
})

// Delete courier
couriersRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    await db.delete(couriers).where(eq(couriers.id, id))
    
    return c.json({ message: 'Courier deleted successfully' })
  } catch (error) {
    console.error('Delete courier error:', error)
    return c.json({ error: 'Failed to delete courier' }, 500)
  }
})

export { couriersRoutes }
