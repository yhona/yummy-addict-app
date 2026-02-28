import { Hono } from 'hono'
import { db } from '../db'
import { stockOpname, stockOpnameItems, productStock, stockMovements, products, warehouses } from '../db/schema'
import { eq, and, sql, desc, count, isNotNull } from 'drizzle-orm'
import { z } from 'zod'

const opnameRoutes = new Hono()

// ── Validation Schemas ──────────────────────────

const createOpnameSchema = z.object({
  warehouseId: z.string().uuid(),
  notes: z.string().max(500).optional(),
})

const updateItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    physicalQty: z.number().int().min(0),
    notes: z.string().max(500).optional(),
  })),
})

// ── Helper: Generate Opname Number ──────────────

function generateOpnameNumber(): string {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timePart = String(now.getTime()).slice(-4)
  return `OP-${datePart}-${timePart}`
}

// ── GET /api/opname — List opname sessions ──────

opnameRoutes.get('/', async (c) => {
  try {
    const { page = '1', limit = '10', warehouseId, status } = c.req.query()

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
    const offset = (pageNum - 1) * limitNum

    // Build WHERE conditions
    const conditions = [eq(stockOpname.isActive, true)]
    if (warehouseId) conditions.push(eq(stockOpname.warehouseId, warehouseId))
    if (status) conditions.push(eq(stockOpname.status, status))

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Fetch sessions with warehouse info
    const sessions = await db
      .select({
        id: stockOpname.id,
        number: stockOpname.number,
        warehouseId: stockOpname.warehouseId,
        warehouseName: warehouses.name,
        status: stockOpname.status,
        notes: stockOpname.notes,
        createdAt: stockOpname.createdAt,
        finalizedAt: stockOpname.finalizedAt,
        totalItems: sql<number>`(SELECT COUNT(*) FROM stock_opname_items WHERE opname_id = ${stockOpname.id})::int`,
        countedItems: sql<number>`(SELECT COUNT(*) FROM stock_opname_items WHERE opname_id = ${stockOpname.id} AND physical_qty IS NOT NULL)::int`,
        itemsWithDifference: sql<number>`(SELECT COUNT(*) FROM stock_opname_items WHERE opname_id = ${stockOpname.id} AND difference IS NOT NULL AND difference != 0)::int`,
      })
      .from(stockOpname)
      .leftJoin(warehouses, eq(stockOpname.warehouseId, warehouses.id))
      .where(whereClause)
      .orderBy(desc(stockOpname.createdAt))
      .limit(limitNum)
      .offset(offset)

    // Count total
    const [result] = await db
      .select({ total: count() })
      .from(stockOpname)
      .where(whereClause)

    const totalStr = result?.total || 0

    return c.json({
      data: sessions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(totalStr),
        totalPages: Math.ceil(Number(totalStr) / limitNum),
      },
    })
  } catch (error) {
    console.error('List opname error:', error)
    return c.json({ message: 'Failed to list opname sessions' }, 500)
  }
})

// ── POST /api/opname — Create new opname session ─

opnameRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const data = createOpnameSchema.parse(body)

    const result = await db.transaction(async (tx) => {
      // 1. Create the opname session
      const [session] = await tx.insert(stockOpname).values({
        number: generateOpnameNumber(),
        warehouseId: data.warehouseId,
        status: 'counting',
        notes: data.notes || null,
      }).returning()

      // 2. Fetch all active products that have stock in this warehouse
      const productsWithStock = await tx
        .select({
          productId: products.id,
          quantity: productStock.quantity,
        })
        .from(products)
        .leftJoin(
          productStock,
          and(
            eq(productStock.productId, products.id),
            eq(productStock.warehouseId, data.warehouseId),
          )
        )
        .where(eq(products.isActive, true))

      // 3. Insert opname items for each product
      if (productsWithStock.length > 0) {
        await tx.insert(stockOpnameItems).values(
          productsWithStock.map((p) => ({
            opnameId: session!.id,
            productId: p.productId,
            systemQty: p.quantity || 0,
            physicalQty: null,
            difference: null,
          }))
        )
      }

      return session
    })

    return c.json(result, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ message: 'Validation error', details: error.issues }, 400)
    }
    console.error('Create opname error:', error)
    return c.json({ message: 'Failed to create opname session' }, 500)
  }
})

// ── GET /api/opname/:id — Detail session + items ─

opnameRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Fetch session
    const session = await db
      .select({
        id: stockOpname.id,
        number: stockOpname.number,
        warehouseId: stockOpname.warehouseId,
        warehouseName: warehouses.name,
        status: stockOpname.status,
        notes: stockOpname.notes,
        createdAt: stockOpname.createdAt,
        finalizedAt: stockOpname.finalizedAt,
      })
      .from(stockOpname)
      .leftJoin(warehouses, eq(stockOpname.warehouseId, warehouses.id))
      .where(and(eq(stockOpname.id, id), eq(stockOpname.isActive, true)))
      .limit(1)

    if (session.length === 0) {
      return c.json({ message: 'Opname session not found' }, 404)
    }

    // Fetch items with product info
    const items = await db
      .select({
        id: stockOpnameItems.id,
        opnameId: stockOpnameItems.opnameId,
        productId: stockOpnameItems.productId,
        productSku: products.sku,
        productName: products.name,
        systemQty: stockOpnameItems.systemQty,
        physicalQty: stockOpnameItems.physicalQty,
        difference: stockOpnameItems.difference,
        notes: stockOpnameItems.notes,
        updatedAt: stockOpnameItems.updatedAt,
      })
      .from(stockOpnameItems)
      .leftJoin(products, eq(stockOpnameItems.productId, products.id))
      .where(eq(stockOpnameItems.opnameId, id))
      .orderBy(products.name)

    const totalItems = items.length
    const countedItems = items.filter(i => i.physicalQty !== null).length
    const itemsWithDifference = items.filter(i => i.difference !== null && i.difference !== 0).length

    return c.json({
      ...session[0],
      totalItems,
      countedItems,
      itemsWithDifference,
      items,
    })
  } catch (error) {
    console.error('Get opname detail error:', error)
    return c.json({ message: 'Failed to get opname detail' }, 500)
  }
})

// ── PUT /api/opname/:id/items — Update counted items ─

opnameRoutes.put('/:id/items', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const data = updateItemsSchema.parse(body)

    // Validate session exists & not finalized & active
    const session = await db.query.stockOpname.findFirst({
      where: and(eq(stockOpname.id, id), eq(stockOpname.isActive, true)),
    })

    if (!session) {
      return c.json({ message: 'Opname session not found' }, 404)
    }
    if (session.status === 'finalized') {
      return c.json({ message: 'Cannot update finalized opname' }, 400)
    }

    // Update each item
    const updated = []
    for (const item of data.items) {
      // Get the current item to calculate difference
      const existingItem = await db.query.stockOpnameItems.findFirst({
        where: eq(stockOpnameItems.id, item.id),
      })

      if (!existingItem) continue

      const difference = item.physicalQty - existingItem.systemQty

      const [updatedItem] = await db
        .update(stockOpnameItems)
        .set({
          physicalQty: item.physicalQty,
          difference,
          notes: item.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(stockOpnameItems.id, item.id))
        .returning()

      updated.push(updatedItem)
    }

    return c.json({ updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ message: 'Validation error', details: error.issues }, 400)
    }
    console.error('Update opname items error:', error)
    return c.json({ message: 'Failed to update opname items' }, 500)
  }
})

// ── POST /api/opname/:id/finalize — Apply adjustments ─

opnameRoutes.post('/:id/finalize', async (c) => {
  try {
    const id = c.req.param('id')

    // 1. Validate session
    const session = await db.query.stockOpname.findFirst({
      where: and(eq(stockOpname.id, id), eq(stockOpname.isActive, true)),
    })

    if (!session) return c.json({ message: 'Opname session not found' }, 404)
    if (session.status === 'finalized') return c.json({ message: 'Already finalized' }, 400)

    // 2. Fetch all items
    const items = await db
      .select()
      .from(stockOpnameItems)
      .where(eq(stockOpnameItems.opnameId, id))

    // 3. Validate all items are counted
    const uncountedItems = items.filter(i => i.physicalQty === null)
    if (uncountedItems.length > 0) {
      return c.json({
        message: `${uncountedItems.length} item(s) belum dihitung. Hitung semua item sebelum finalisasi.`,
      }, 400)
    }

    // 4. Apply adjustments in a transaction
    let totalAdded = 0
    let totalSubtracted = 0
    let adjustedItems = 0

    await db.transaction(async (tx) => {
      for (const item of items) {
        if (item.difference === null || item.difference === 0) continue

        adjustedItems++
        const quantityChange = item.difference!

        if (quantityChange > 0) totalAdded += quantityChange
        else totalSubtracted += Math.abs(quantityChange)

        // Get current stock
        const currentStock = await tx.query.productStock.findFirst({
          where: and(
            eq(productStock.productId, item.productId),
            eq(productStock.warehouseId, session.warehouseId),
          ),
        })

        const quantityBefore = currentStock?.quantity || 0
        const quantityAfter = quantityBefore + quantityChange

        // Update or create stock record
        if (currentStock) {
          await tx
            .update(productStock)
            .set({ quantity: quantityAfter, updatedAt: new Date() })
            .where(eq(productStock.id, currentStock.id))
        } else {
          await tx.insert(productStock).values({
            productId: item.productId,
            warehouseId: session.warehouseId,
            quantity: quantityAfter,
          })
        }

        // Record the stock movement
        await tx.insert(stockMovements).values({
          productId: item.productId,
          warehouseId: session.warehouseId,
          movementType: quantityChange > 0 ? 'in' : 'out',
          referenceType: 'opname',
          referenceNumber: session.number,
          quantityBefore,
          quantityChange: Math.abs(quantityChange),
          quantityAfter,
          notes: `Stock Opname adjustment: ${quantityChange > 0 ? '+' : ''}${quantityChange}`,
        })
      }

      // Mark session as finalized
      await tx
        .update(stockOpname)
        .set({
          status: 'finalized',
          finalizedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(stockOpname.id, id))
    })

    return c.json({
      message: 'Opname finalized successfully',
      summary: { adjustedItems, totalAdded, totalSubtracted },
    })
  } catch (error) {
    console.error('Finalize opname error:', error)
    return c.json({ message: 'Failed to finalize opname' }, 500)
  }
})

// ── DELETE /api/opname/:id — Delete draft only ───

opnameRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const session = await db.query.stockOpname.findFirst({
      where: and(eq(stockOpname.id, id), eq(stockOpname.isActive, true)),
    })

    if (!session) return c.json({ message: 'Opname session not found' }, 404)
    if (session.status === 'finalized') {
      return c.json({ message: 'Cannot delete finalized opname' }, 400)
    }

    // Soft delete session
    await db.update(stockOpname).set({ isActive: false }).where(eq(stockOpname.id, id))

    return c.json({ message: 'Opname session deleted' })
  } catch (error) {
    console.error('Delete opname error:', error)
    return c.json({ message: 'Failed to delete opname' }, 500)
  }
})

export { opnameRoutes }
