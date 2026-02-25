import { Hono } from 'hono'
import { db } from '../db'
import { purchases, purchaseItems, purchasePayments, products, productStock, stockMovements, warehouses, suppliers } from '../db/schema'
import { eq, desc, and, sql, like, or, gte, lte, count } from 'drizzle-orm'
import { z } from 'zod'

const purchasesRoutes = new Hono()

const createPurchaseSchema = z.object({
  supplierId: z.string().uuid(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    costPrice: z.number().min(0),
  }))
})

// ==========================================
// LIST PURCHASES (with filter & pagination)
// ==========================================
purchasesRoutes.get('/', async (c) => {
  try {
    const page = Number(c.req.query('page') || '1')
    const limit = Number(c.req.query('limit') || '20')
    const search = c.req.query('search')
    const status = c.req.query('status')
    const paymentStatus = c.req.query('paymentStatus')
    const supplierId = c.req.query('supplierId')
    const dateFrom = c.req.query('dateFrom')
    const dateTo = c.req.query('dateTo')

    // Build WHERE conditions
    const conditions = []
    if (status) conditions.push(eq(purchases.status, status))
    if (paymentStatus) conditions.push(eq(purchases.paymentStatus, paymentStatus))
    if (supplierId) conditions.push(eq(purchases.supplierId, supplierId))
    if (dateFrom) conditions.push(gte(purchases.date, new Date(dateFrom)))
    if (dateTo) conditions.push(lte(purchases.date, new Date(dateTo + 'T23:59:59')))

    // Search (PO number or supplier name)
    if (search) {
      const searchResults = await db.select({ id: suppliers.id })
        .from(suppliers)
        .where(like(suppliers.name, `%${search}%`))
      const supplierIds = searchResults.map(s => s.id)

      conditions.push(
        or(
          like(purchases.number, `%${search}%`),
          ...(supplierIds.length > 0
            ? supplierIds.map(sid => eq(purchases.supplierId, sid))
            : [])
        )!
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Data query with pagination
    const data = await db.query.purchases.findMany({
      where: whereClause,
      with: {
        supplier: true,
        items: { with: { product: true } }
      },
      orderBy: [desc(purchases.createdAt)],
      limit,
      offset: (page - 1) * limit,
    })

    // Total count for pagination
    const [totalResult] = await db.select({ count: count() })
      .from(purchases)
      .where(whereClause)
    const total = totalResult?.count || 0

    // Summary counts
    const [summaryResult] = await db.select({
      totalOrdered: sql<number>`COUNT(*) FILTER (WHERE ${purchases.status} = 'ordered')`,
      totalReceived: sql<number>`COUNT(*) FILTER (WHERE ${purchases.status} = 'received')`,
      totalCancelled: sql<number>`COUNT(*) FILTER (WHERE ${purchases.status} = 'cancelled')`,
      totalOutstanding: sql<string>`COALESCE(SUM(CAST(${purchases.totalAmount} AS DECIMAL) - CAST(${purchases.amountPaid} AS DECIMAL)) FILTER (WHERE ${purchases.paymentStatus} != 'PAID' AND ${purchases.status} != 'cancelled'), 0)`,
    }).from(purchases)

    return c.json({
      data,
      summary: {
        totalOrdered: Number(summaryResult?.totalOrdered || 0),
        totalReceived: Number(summaryResult?.totalReceived || 0),
        totalCancelled: Number(summaryResult?.totalCancelled || 0),
        totalOutstanding: String(summaryResult?.totalOutstanding || '0'),
      },
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      }
    })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch purchases' }, 500)
  }
})

// ==========================================
// GET ONE PURCHASE
// ==========================================
purchasesRoutes.get('/:id', async (c) => {
    const id = c.req.param('id')
    const data = await db.query.purchases.findFirst({ 
        where: eq(purchases.id, id),
        with: { 
            supplier: true, 
            items: { 
                with: { product: true } 
            } 
        }
    })
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json(data)
})

// ==========================================
// CREATE PURCHASE ORDER
// ==========================================
purchasesRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const result = createPurchaseSchema.safeParse(body)
    
    if (!result.success) {
      return c.json({ error: 'Validation error', details: result.error.flatten() }, 400)
    }
    
    const data = result.data
    
    const transaction = await db.transaction(async (tx) => {
       const totalAmount = data.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0)
       
       const number = `PO-${Date.now()}`
       
       const [newPo] = await tx.insert(purchases).values({
           number,
           supplierId: data.supplierId,
           totalAmount: String(totalAmount),
           status: 'ordered',
           paymentStatus: 'UNPAID',
           amountPaid: '0',
           dueDate: data.dueDate ? new Date(data.dueDate) : null,
           notes: data.notes
       }).returning()
       
       for (const item of data.items) {
           await tx.insert(purchaseItems).values({
               purchaseId: newPo!.id,
               productId: item.productId,
               quantity: item.quantity,
               costPrice: String(item.costPrice),
               subtotal: String(item.costPrice * item.quantity)
           })
       }
       
       return newPo
    })
    
    return c.json(transaction, 201)
  } catch (error) {
      console.error(error)
      return c.json({ error: 'Failed to create purchase' }, 500)
  }
})

// ==========================================
// RECEIVE PURCHASE (mark as received + update stock)
// ==========================================
purchasesRoutes.post('/:id/receive', async (c) => {
    const id = c.req.param('id')
    
    try {
        const result = await db.transaction(async (tx) => {
             const purchase = await tx.query.purchases.findFirst({
                 where: eq(purchases.id, id),
                 with: { items: true }
             })
             
             if (!purchase) throw new Error("Purchase not found")
             if (purchase.status !== 'ordered') throw new Error(`Purchase status is ${purchase.status}, cannot receive`)
             
             const defaultWarehouse = await tx.query.warehouses.findFirst({
                 where: eq(warehouses.isDefault, true)
             })
             
             if (!defaultWarehouse) throw new Error("No default warehouse configured for receiving")
             
             await tx.update(purchases).set({ status: 'received', updatedAt: new Date() }).where(eq(purchases.id, id))
             
             for (const item of purchase.items) {
                 await tx.update(products)
                    .set({ costPrice: item.costPrice, updatedAt: new Date() })
                    .where(eq(products.id, item.productId))
                 
                 const currentStock = await tx.query.productStock.findFirst({
                     where: and(
                         eq(productStock.productId, item.productId),
                         eq(productStock.warehouseId, defaultWarehouse.id)
                     )
                 })
                 
                 if (currentStock) {
                     await tx.update(productStock)
                       .set({ quantity: currentStock.quantity + item.quantity, updatedAt: new Date() })
                       .where(eq(productStock.id, currentStock.id))
                 } else {
                     await tx.insert(productStock).values({
                         productId: item.productId,
                         warehouseId: defaultWarehouse.id,
                         quantity: item.quantity
                     })
                 }
                 
                 await tx.insert(stockMovements).values({
                     productId: item.productId,
                     warehouseId: defaultWarehouse.id,
                     movementType: 'in',
                     referenceType: 'purchase',
                     referenceId: purchase.id,
                     referenceNumber: purchase.number,
                     quantityBefore: currentStock?.quantity || 0,
                     quantityChange: item.quantity,
                     quantityAfter: (currentStock?.quantity || 0) + item.quantity,
                     notes: `Received PO ${purchase.number}`
                 })
             }
             
             return { message: 'Purchase received and stock updated' }
        })
        
        return c.json(result)
        
    } catch (error) {
        console.error(error)
        return c.json({ error: (error as Error).message }, 400)
    }
})

// ==========================================
// CANCEL PURCHASE ORDER
// ==========================================
purchasesRoutes.post('/:id/cancel', async (c) => {
  const id = c.req.param('id')
  
  try {
    const purchase = await db.query.purchases.findFirst({
      where: eq(purchases.id, id)
    })
    
    if (!purchase) return c.json({ error: 'Purchase not found' }, 404)
    if (purchase.status !== 'ordered') {
      return c.json({ error: `Cannot cancel PO with status '${purchase.status}'` }, 400)
    }
    
    await db.update(purchases)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(purchases.id, id))
    
    return c.json({ message: 'Purchase cancelled successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to cancel purchase' }, 500)
  }
})

// ==========================================
// LIST PAYMENTS FOR A PURCHASE
// ==========================================
purchasesRoutes.get('/:id/payments', async (c) => {
  const id = c.req.param('id')
  
  try {
    const data = await db.select()
      .from(purchasePayments)
      .where(eq(purchasePayments.purchaseId, id))
      .orderBy(desc(purchasePayments.date))
    
    return c.json(data)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch payments' }, 500)
  }
})

// ==========================================
// ADD PAYMENT TO A PURCHASE
// ==========================================
const addPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string().default('transfer'),
  date: z.string(),
  notes: z.string().optional(),
})

purchasesRoutes.post('/:id/payments', async (c) => {
  const id = c.req.param('id')
  
  try {
    const body = await c.req.json()
    const result = addPaymentSchema.safeParse(body)
    
    if (!result.success) {
      return c.json({ error: 'Validation error', details: result.error.flatten() }, 400)
    }
    
    const data = result.data
    
    const payment = await db.transaction(async (tx) => {
      // Fetch current purchase
      const purchase = await tx.query.purchases.findFirst({
        where: eq(purchases.id, id)
      })
      
      if (!purchase) throw new Error('Purchase not found')
      if (purchase.status !== 'received') throw new Error('Cannot pay before purchase is received')
      
      const currentPaid = Number(purchase.amountPaid) || 0
      const totalAmount = Number(purchase.totalAmount) || 0
      const remaining = totalAmount - currentPaid
      
      if (data.amount > remaining + 0.01) { // +0.01 for floating point tolerance
        throw new Error(`Payment amount (${data.amount}) exceeds remaining balance (${remaining.toFixed(2)})`)
      }
      
      // Insert payment record
      const [newPayment] = await tx.insert(purchasePayments).values({
        purchaseId: id,
        amount: String(data.amount),
        paymentMethod: data.paymentMethod,
        date: new Date(data.date),
        notes: data.notes || null,
      }).returning()
      
      // Update purchase totals
      const newAmountPaid = currentPaid + data.amount
      let newPaymentStatus: string

      if (newAmountPaid >= totalAmount) {
        newPaymentStatus = 'PAID'
      } else if (newAmountPaid > 0) {
        newPaymentStatus = 'PARTIAL'
      } else {
        newPaymentStatus = 'UNPAID'
      }
      
      await tx.update(purchases).set({
        amountPaid: String(newAmountPaid),
        paymentStatus: newPaymentStatus,
        updatedAt: new Date(),
      }).where(eq(purchases.id, id))
      
      return newPayment
    })
    
    return c.json(payment, 201)
  } catch (error) {
    console.error(error)
    return c.json({ error: (error as Error).message }, 400)
  }
})

// ==========================================
// SUPPLIER STATS
// ==========================================
purchasesRoutes.get('/supplier/:supplierId/stats', async (c) => {
  const supplierId = c.req.param('supplierId')
  
  try {
    const [stats] = await db.select({
      totalPurchases: count(),
      totalAmount: sql<string>`COALESCE(SUM(CAST(${purchases.totalAmount} AS DECIMAL)), 0)`,
      outstanding: sql<string>`COALESCE(SUM(CAST(${purchases.totalAmount} AS DECIMAL) - CAST(${purchases.amountPaid} AS DECIMAL)) FILTER (WHERE ${purchases.paymentStatus} != 'PAID' AND ${purchases.status} != 'cancelled'), 0)`,
    })
    .from(purchases)
    .where(eq(purchases.supplierId, supplierId))
    
    return c.json({
      totalPurchases: Number(stats?.totalPurchases || 0),
      totalAmount: String(stats?.totalAmount || '0'),
      outstanding: String(stats?.outstanding || '0'),
    })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch supplier stats' }, 500)
  }
})

export { purchasesRoutes }
