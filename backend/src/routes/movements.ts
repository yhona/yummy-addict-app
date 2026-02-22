import { Hono } from 'hono'
import { db } from '../db'
import { stockMovements } from '../db/schema'
import { eq, and, sql, desc, or, like } from 'drizzle-orm'
import { z } from 'zod'

const movementsRoutes = new Hono()

// Get all movements with filters
movementsRoutes.get('/', async (c) => {
  try {
    const page = Number(c.req.query('page') || 1)
    const limit = Number(c.req.query('limit') || 20)
    const search = c.req.query('search') || ''
    const movementType = c.req.query('type')
    const productId = c.req.query('productId')
    const warehouseId = c.req.query('warehouseId')
    const dateFrom = c.req.query('dateFrom')
    const dateTo = c.req.query('dateTo')

    const offset = (page - 1) * limit

    // Build where conditions
    const conditions = []
    if (movementType && movementType !== 'all') {
      conditions.push(eq(stockMovements.movementType, movementType))
    }
    if (productId) {
      conditions.push(eq(stockMovements.productId, productId))
    }
    if (warehouseId) {
      conditions.push(eq(stockMovements.warehouseId, warehouseId))
    }
    if (dateFrom) {
      conditions.push(sql`${stockMovements.createdAt} >= ${dateFrom}`)
    }
    if (dateTo) {
      // Add one day to include the end date fully
      const endDate = new Date(dateTo)
      endDate.setDate(endDate.getDate() + 1)
      conditions.push(sql`${stockMovements.createdAt} < ${endDate.toISOString()}`)
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const movements = await db.query.stockMovements.findMany({
      where: whereClause,
      with: {
        product: true,
        warehouse: true,
      },
      limit,
      offset,
      orderBy: [desc(stockMovements.createdAt)],
    })

    // Filter by search if provided (product name, sku, or reference number)
    let filteredMovements = movements
    if (search) {
      const searchLower = search.toLowerCase()
      filteredMovements = movements.filter((m) =>
        m.product?.name.toLowerCase().includes(searchLower) ||
        m.product?.sku.toLowerCase().includes(searchLower) ||
        m.referenceNumber?.toLowerCase().includes(searchLower)
      )
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stockMovements)
      .where(whereClause)

    return c.json({
      data: filteredMovements,
      pagination: {
        page,
        limit,
        total: Number(countResult?.count ?? 0),
        totalPages: Math.ceil(Number(countResult?.count ?? 0) / limit),
      },
    })
  } catch (error) {
    console.error('Get movements error:', error)
    return c.json({ error: 'Failed to get movements' }, 500)
  }
})

// Get movement stats (summary)
movementsRoutes.get('/stats', async (c) => {
  try {
    const warehouseId = c.req.query('warehouseId')
    const period = c.req.query('period') || 'today' // today, week, month

    // Calculate period start date
    let periodStart: Date
    const now = new Date()
    switch (period) {
      case 'week':
        periodStart = new Date(now.setDate(now.getDate() - 7))
        break
      case 'month':
        periodStart = new Date(now.setMonth(now.getMonth() - 1))
        break
      default: // today
        periodStart = new Date()
        periodStart.setHours(0, 0, 0, 0)
    }

    // Build conditions
    const conditions = [sql`${stockMovements.createdAt} >= ${periodStart.toISOString()}`]
    if (warehouseId) {
      conditions.push(eq(stockMovements.warehouseId, warehouseId))
    }

    // Get movements for the period
    const movements = await db.query.stockMovements.findMany({
      where: and(...conditions),
    })

    // Calculate stats
    let totalIn = 0
    let totalOut = 0
    let totalAdjustments = 0

    movements.forEach((m) => {
      if (m.movementType === 'in') {
        totalIn += m.quantityChange
      } else if (m.movementType === 'out') {
        totalOut += Math.abs(m.quantityChange)
      } else if (m.movementType === 'adjustment') {
        totalAdjustments++
      }
    })

    return c.json({
      period,
      totalIn,
      totalOut,
      totalAdjustments,
      netChange: totalIn - totalOut,
      movementCount: movements.length,
    })
  } catch (error) {
    console.error('Get movement stats error:', error)
    return c.json({ error: 'Failed to get movement stats' }, 500)
  }
})

// Get single movement
movementsRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const movement = await db.query.stockMovements.findFirst({
      where: eq(stockMovements.id, id),
      with: {
        product: true,
        warehouse: true,
      },
    })

    if (!movement) {
      return c.json({ error: 'Movement not found' }, 404)
    }

    return c.json(movement)
  } catch (error) {
    console.error('Get movement error:', error)
    return c.json({ error: 'Failed to get movement' }, 500)
  }
})

export { movementsRoutes }
