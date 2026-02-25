import { Hono } from 'hono'
import { db } from '../db'
import { orders, orderItems, products, customers, couriers } from '../db/schema'
import { eq, desc, and, sql, like, or, gte, lte, count, isNull, isNotNull } from 'drizzle-orm'
import { z } from 'zod'

const shippingRoutes = new Hono()

// ==========================================
// HELPER: Compute shipping status from order fields
// ==========================================
function computeShippingStatus(order: { status: string; trackingNumber: string | null }): string {
  if (order.status === 'cancelled' && order.trackingNumber) return 'returned'
  if (order.status === 'cancelled') return 'failed'
  if (order.status === 'completed') return 'delivered'
  if (order.trackingNumber) return 'shipped'
  return 'pending'
}

// ==========================================
// GET /api/shipping — List all delivery orders
// ==========================================
shippingRoutes.get('/', async (c) => {
  try {
    const page = Number(c.req.query('page') || '1')
    const limit = Number(c.req.query('limit') || '20')
    const search = c.req.query('search')
    const status = c.req.query('status')
    const courierId = c.req.query('courierId')
    const dateFrom = c.req.query('dateFrom')
    const dateTo = c.req.query('dateTo')

    // Base condition: only delivery orders
    const conditions: any[] = [eq(orders.deliveryMethod, 'delivery')]

    // Status filter (computed from order fields)
    if (status === 'pending') {
      conditions.push(
        or(eq(orders.status, 'pending'), eq(orders.status, 'processing'))!
      )
      conditions.push(isNull(orders.trackingNumber))
    } else if (status === 'shipped') {
      conditions.push(isNotNull(orders.trackingNumber))
      conditions.push(
        or(eq(orders.status, 'pending'), eq(orders.status, 'processing'))!
      )
    } else if (status === 'delivered') {
      conditions.push(eq(orders.status, 'completed'))
    } else if (status === 'returned') {
      conditions.push(eq(orders.status, 'cancelled'))
      conditions.push(isNotNull(orders.trackingNumber))
    } else if (status === 'failed') {
      conditions.push(eq(orders.status, 'cancelled'))
      conditions.push(isNull(orders.trackingNumber))
    }

    if (search) {
      conditions.push(
        or(
          like(orders.number, `%${search}%`),
          like(orders.customerName, `%${search}%`),
          like(orders.trackingNumber, `%${search}%`)
        )!
      )
    }

    if (courierId) {
      // Look up courier name from courierId
      const courier = await db.query.couriers.findFirst({ where: eq(couriers.id, courierId) })
      if (courier) {
        conditions.push(eq(orders.courierName, courier.name))
      }
    }

    if (dateFrom) conditions.push(gte(orders.date, new Date(dateFrom)))
    if (dateTo) conditions.push(lte(orders.date, new Date(dateTo + 'T23:59:59')))

    const whereClause = and(...conditions)

    // Fetch data
    const data = await db.query.orders.findMany({
      where: whereClause,
      with: {
        items: { with: { product: true } },
        customer: true,
      },
      orderBy: [desc(orders.createdAt)],
      limit,
      offset: (page - 1) * limit,
    })

    // Total count
    const [totalResult] = await db.select({ count: count() })
      .from(orders)
      .where(whereClause)
    const total = totalResult?.count || 0

    // Map to shipment format
    const shipments = data.map(order => ({
      id: order.id,
      orderNumber: order.number,
      orderDate: order.date?.toISOString() || '',
      customerName: order.customerName || order.customer?.name || '—',
      customerPhone: order.customerPhone || order.customer?.phone || undefined,
      customerAddress: order.customerAddress || order.customer?.address || undefined,
      items: order.items?.map((item: any) => ({
        productName: item.product?.name || '—',
        sku: item.product?.sku || '—',
        qty: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })) || [],
      courierName: order.courierName || undefined,
      trackingNumber: order.trackingNumber || undefined,
      shippingCost: Number(order.shippingCost || 0),
      deliveryMethod: order.deliveryMethod || 'delivery',
      shippingStatus: computeShippingStatus({ status: order.status, trackingNumber: order.trackingNumber }),
      statusHistory: buildStatusHistory(order),
      orderStatus: order.status,
      finalAmount: Number(order.finalAmount || 0),
      notes: order.notes || undefined,
      createdAt: order.createdAt?.toISOString() || '',
      updatedAt: order.updatedAt?.toISOString() || '',
    }))

    // Summary — compute across ALL delivery orders (not just filtered)
    const allDeliveryWhere = eq(orders.deliveryMethod, 'delivery')
    const [summary] = await db.select({
      pending: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('pending', 'processing') AND ${orders.trackingNumber} IS NULL)`,
      shipped: sql<number>`COUNT(*) FILTER (WHERE ${orders.trackingNumber} IS NOT NULL AND ${orders.status} IN ('pending', 'processing'))`,
      delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'completed')`,
      returned: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'cancelled' AND ${orders.trackingNumber} IS NOT NULL)`,
      failed: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'cancelled' AND ${orders.trackingNumber} IS NULL)`,
      totalShippingCost: sql<number>`COALESCE(SUM(CAST(${orders.shippingCost} AS DECIMAL)), 0)`,
    }).from(orders).where(allDeliveryWhere)

    return c.json({
      data: shipments,
      summary: {
        pending: Number(summary?.pending || 0),
        shipped: Number(summary?.shipped || 0),
        delivered: Number(summary?.delivered || 0),
        returned: Number(summary?.returned || 0),
        failed: Number(summary?.failed || 0),
        totalShippingCost: Number(summary?.totalShippingCost || 0),
      },
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch shipments' }, 500)
  }
})

// ==========================================
// GET /api/shipping/:id — Shipment detail
// ==========================================
shippingRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: { with: { product: true } },
        customer: true,
      },
    })

    if (!order) return c.json({ error: 'Shipment not found' }, 404)

    const shipment = {
      id: order.id,
      orderNumber: order.number,
      orderDate: order.date?.toISOString() || '',
      customerName: order.customerName || order.customer?.name || '—',
      customerPhone: order.customerPhone || order.customer?.phone || undefined,
      customerAddress: order.customerAddress || order.customer?.address || undefined,
      items: order.items?.map((item: any) => ({
        productName: item.product?.name || '—',
        sku: item.product?.sku || '—',
        qty: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })) || [],
      courierName: order.courierName || undefined,
      trackingNumber: order.trackingNumber || undefined,
      shippingCost: Number(order.shippingCost || 0),
      deliveryMethod: order.deliveryMethod || 'delivery',
      shippingStatus: computeShippingStatus({ status: order.status, trackingNumber: order.trackingNumber }),
      statusHistory: buildStatusHistory(order),
      orderStatus: order.status,
      finalAmount: Number(order.finalAmount || 0),
      notes: order.notes || undefined,
      createdAt: order.createdAt?.toISOString() || '',
      updatedAt: order.updatedAt?.toISOString() || '',
    }

    return c.json(shipment)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch shipment' }, 500)
  }
})

// ==========================================
// PUT /api/shipping/:id — Update shipment
// ==========================================
const updateShipmentSchema = z.object({
  courierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippingCost: z.number().optional(),
  shippingStatus: z.enum(['pending', 'shipped', 'delivered', 'returned', 'failed']).optional(),
  statusNote: z.string().optional(),
})

shippingRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const body = await c.req.json()
    const result = updateShipmentSchema.safeParse(body)

    if (!result.success) {
      return c.json({ error: 'Validation error', details: result.error.flatten() }, 400)
    }

    const data = result.data
    const updateFields: Record<string, any> = { updatedAt: new Date() }

    if (data.courierName !== undefined) updateFields.courierName = data.courierName
    if (data.trackingNumber !== undefined) updateFields.trackingNumber = data.trackingNumber
    if (data.shippingCost !== undefined) updateFields.shippingCost = String(data.shippingCost)

    // Status transitions
    if (data.shippingStatus === 'delivered') {
      updateFields.status = 'completed'
    } else if (data.shippingStatus === 'returned' || data.shippingStatus === 'failed') {
      updateFields.status = 'cancelled'
    }

    await db.update(orders).set(updateFields).where(eq(orders.id, id))

    // Fetch updated
    const updated = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: { with: { product: true } }, customer: true },
    })

    if (!updated) return c.json({ error: 'Not found' }, 404)

    return c.json({
      id: updated.id,
      orderNumber: updated.number,
      shippingStatus: computeShippingStatus({ status: updated.status, trackingNumber: updated.trackingNumber }),
      courierName: updated.courierName,
      trackingNumber: updated.trackingNumber,
      shippingCost: Number(updated.shippingCost || 0),
      message: 'Shipment updated successfully',
    })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to update shipment' }, 500)
  }
})

// ==========================================
// POST /api/shipping/bulk-update — Bulk update tracking numbers
// ==========================================
const bulkUpdateSchema = z.object({
  items: z.array(z.object({
    orderNumber: z.string(),
    courierName: z.string(),
    trackingNumber: z.string(),
  }))
})

shippingRoutes.post('/bulk-update', async (c) => {
  try {
    const body = await c.req.json()
    const result = bulkUpdateSchema.safeParse(body)

    if (!result.success) {
      return c.json({ error: 'Validation error', details: result.error.flatten() }, 400)
    }

    let success = 0
    let failed = 0
    const errors: string[] = []

    for (const item of result.data.items) {
      try {
        const order = await db.query.orders.findFirst({
          where: eq(orders.number, item.orderNumber),
        })

        if (!order) {
          failed++
          errors.push(`Order ${item.orderNumber} tidak ditemukan`)
          continue
        }

        await db.update(orders).set({
          courierName: item.courierName,
          trackingNumber: item.trackingNumber,
          updatedAt: new Date(),
        }).where(eq(orders.id, order.id))

        success++
      } catch (e) {
        failed++
        errors.push(`Gagal update ${item.orderNumber}: ${(e as Error).message}`)
      }
    }

    return c.json({ success, failed, errors })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to process bulk update' }, 500)
  }
})

// ==========================================
// HELPER: Build status history from order dates
// ==========================================
function buildStatusHistory(order: any) {
  const history: { status: string; date: string; note?: string }[] = []

  if (order.createdAt) {
    history.push({ status: 'pending', date: order.createdAt.toISOString(), note: 'Order dibuat' })
  }
  if (order.trackingNumber) {
    history.push({ status: 'shipped', date: order.updatedAt?.toISOString() || '', note: `Resi: ${order.trackingNumber}` })
  }
  if (order.status === 'completed') {
    history.push({ status: 'delivered', date: order.updatedAt?.toISOString() || '', note: 'Diterima customer' })
  }
  if (order.status === 'cancelled') {
    history.push({
      status: order.trackingNumber ? 'returned' : 'failed',
      date: order.updatedAt?.toISOString() || '',
      note: order.trackingNumber ? 'Dikembalikan' : 'Pengiriman gagal'
    })
  }

  return history
}

export { shippingRoutes }
