import { Hono } from 'hono'
import { db } from '../db'
import { warehouses, productStock } from '../db/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { z } from 'zod'

const warehousesRoutes = new Hono()

// Warehouse schema
const warehouseSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  address: z.string().optional(),
  phone: z.string().max(20).optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

// List warehouses
warehousesRoutes.get('/', async (c) => {
  try {
    const result = await db.query.warehouses.findMany({
      with: {
        productStock: true,
      },
      orderBy: [desc(warehouses.createdAt)],
    })

    return c.json(
      result.map((wh) => ({
        ...wh,
        productCount: new Set(wh.productStock.map((s) => s.productId)).size,
        totalStock: wh.productStock.reduce((sum, s) => sum + s.quantity, 0),
      }))
    )
  } catch (error) {
    console.error('Get warehouses error:', error)
    return c.json({ error: 'Failed to get warehouses' }, 500)
  }
})

// Get single warehouse
warehousesRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const warehouse = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
      with: {
        productStock: {
          with: {
            product: true,
          },
        },
      },
    })

    if (!warehouse) {
      return c.json({ error: 'Warehouse not found' }, 404)
    }

    return c.json(warehouse)
  } catch (error) {
    console.error('Get warehouse error:', error)
    return c.json({ error: 'Failed to get warehouse' }, 500)
  }
})

// Create warehouse
warehousesRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const data = warehouseSchema.parse(body)

    // Check if code exists
    const existing = await db.query.warehouses.findFirst({
      where: eq(warehouses.code, data.code),
    })

    if (existing) {
      return c.json({ error: 'Warehouse code already exists' }, 400)
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db
        .update(warehouses)
        .set({ isDefault: false })
        .where(eq(warehouses.isDefault, true))
    }

    const [newWarehouse] = await db.insert(warehouses).values(data).returning()

    return c.json(newWarehouse, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    console.error('Create warehouse error:', error)
    return c.json({ error: 'Failed to create warehouse' }, 500)
  }
})

// Update warehouse
warehousesRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const data = warehouseSchema.partial().parse(body)

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db
        .update(warehouses)
        .set({ isDefault: false })
        .where(eq(warehouses.isDefault, true))
    }

    const [updated] = await db
      .update(warehouses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(warehouses.id, id))
      .returning()

    if (!updated) {
      return c.json({ error: 'Warehouse not found' }, 404)
    }

    return c.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    console.error('Update warehouse error:', error)
    return c.json({ error: 'Failed to update warehouse' }, 500)
  }
})

// Delete warehouse
warehousesRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Check if is default
    const warehouse = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
    })

    if (warehouse?.isDefault) {
      return c.json({ error: 'Cannot delete default warehouse' }, 400)
    }

    // Check if has stock
    const stockCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(productStock)
      .where(eq(productStock.warehouseId, id))

    if (Number(stockCount[0]?.count ?? 0) > 0) {
      return c.json({ error: 'Cannot delete warehouse with stock' }, 400)
    }

    const [deleted] = await db
      .delete(warehouses)
      .where(eq(warehouses.id, id))
      .returning()

    if (!deleted) {
      return c.json({ error: 'Warehouse not found' }, 404)
    }

    return c.json({ message: 'Warehouse deleted' })
  } catch (error) {
    console.error('Delete warehouse error:', error)
    return c.json({ error: 'Failed to delete warehouse' }, 500)
  }
})

// Set warehouse as default
warehousesRoutes.put('/:id/set-default', async (c) => {
  try {
    const id = c.req.param('id')

    // Check if warehouse exists
    const warehouse = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
    })

    if (!warehouse) {
      return c.json({ error: 'Warehouse not found' }, 404)
    }

    // Unset all other defaults
    await db
      .update(warehouses)
      .set({ isDefault: false })
      .where(eq(warehouses.isDefault, true))

    // Set this warehouse as default
    const [updated] = await db
      .update(warehouses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(warehouses.id, id))
      .returning()

    return c.json(updated)
  } catch (error) {
    console.error('Set default warehouse error:', error)
    return c.json({ error: 'Failed to set default warehouse' }, 500)
  }
})

// Initialize/Check Rejected Warehouse
warehousesRoutes.post('/init-rejected', async (c) => {
  try {
    // Check if exists
    const existing = await db.query.warehouses.findFirst({
      where: eq(warehouses.type, 'rejected')
    })

    if (existing) {
      return c.json(existing)
    }

    // Create if not exists
    const [newWh] = await db.insert(warehouses).values({
      code: 'WH-REJECTED',
      name: 'Rejected / Rusak',
      type: 'rejected',
      address: 'System Warehouse for Damaged Goods',
      isActive: true,
      isDefault: false
    }).returning()

    return c.json(newWh)
  } catch (error) {
    console.error('Init rejected warehouse error:', error)
    return c.json({ error: 'Failed to init rejected warehouse' }, 500)
  }
})

export { warehousesRoutes }
