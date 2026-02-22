import { Hono } from 'hono'
import { db } from '../db'
import { transactions, transactionItems, products, productStock, stockMovements, warehouses, users } from '../db/schema'
import { eq, desc, sql, and, gte, lte, like, or } from 'drizzle-orm'
import { z } from 'zod'

const transactionsRoutes = new Hono()

const createTransactionSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().min(0),
  })),
  paymentMethod: z.enum(['cash', 'qris', 'transfer']),
  cashAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).default(0),
  cashierId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  shiftId: z.string().uuid().optional(),
  notes: z.string().optional(),
})

// Create Transaction
transactionsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validation = createTransactionSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation error', details: validation.error.flatten() }, 400)
    }
    
    const data = validation.data
    
    const result = await db.transaction(async (tx) => {
      const defaultWarehouse = await tx.query.warehouses.findFirst({
        where: eq(warehouses.isDefault, true)
      })
      
      if (!defaultWarehouse) {
        throw new Error('No default warehouse configured for stock deduction')
      }

      let totalAmount = 0
      const processedItems = []
      
      for (const item of data.items) {
        const product = await tx.query.products.findFirst({
          where: eq(products.id, item.productId)
        })
        
        if (!product) {
          throw new Error(`Product ID ${item.productId} not found`)
        }
        
        const stockRecord = await tx.query.productStock.findFirst({
          where: and(
            eq(productStock.productId, item.productId),
            eq(productStock.warehouseId, defaultWarehouse.id)
          )
        })
        
        const currentQty = stockRecord?.quantity || 0
        if (currentQty < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name} (Current: ${currentQty})`)
        }
        
        totalAmount += item.price * item.quantity
        processedItems.push({
          ...item,
          product,
          costPrice: product.costPrice,
          currentQty
        })
      }
      
      const finalAmount = totalAmount - data.discountAmount
      
      const number = `TRX-${Date.now()}`
      const [newTx] = await tx.insert(transactions).values({
        number,
        date: new Date(),
        cashierId: data.cashierId,
        customerId: data.customerId,
        shiftId: data.shiftId,
        totalAmount: String(totalAmount),
        discountAmount: String(data.discountAmount),
        finalAmount: String(finalAmount),
        paymentMethod: data.paymentMethod,
        cashAmount: data.cashAmount ? String(data.cashAmount) : undefined,
        changeAmount: data.cashAmount ? String(data.cashAmount - finalAmount) : undefined,
        status: 'completed',
        notes: data.notes,
      }).returning()
      
      for (const item of processedItems) {
        await tx.insert(transactionItems).values({
          transactionId: newTx!.id,
          productId: item.productId,
          quantity: item.quantity,
          price: String(item.price),
          costPrice: String(item.product.costPrice),
          subtotal: String(item.price * item.quantity),
        })
        
        await tx.update(productStock)
          .set({ 
            quantity: item.currentQty - item.quantity,
            updatedAt: new Date()
          })
          .where(and(
            eq(productStock.productId, item.productId),
            eq(productStock.warehouseId, defaultWarehouse.id)
          ))
          
        await tx.insert(stockMovements).values({
          productId: item.productId,
          warehouseId: defaultWarehouse.id,
          movementType: 'out',
          referenceType: 'sale',
          referenceId: newTx!.id,
          referenceNumber: newTx!.number,
          quantityBefore: item.currentQty,
          quantityChange: -item.quantity,
          quantityAfter: item.currentQty - item.quantity,
          createdBy: data.cashierId,
          notes: 'POS Sale'
        })
      }
      
      const fullTx = await tx.query.transactions.findFirst({
        where: eq(transactions.id, newTx!.id),
        with: {
          items: { with: { product: true } },
          cashier: true,
          customer: true
        }
      })
      
      return fullTx
    })
    
    return c.json(result, 201)
    
  } catch (error) {
    console.error('Transaction error:', error)
    
    if ((error as Error).message?.includes('Insufficient stock')) {
      return c.json({ error: (error as Error).message }, 400)
    }

    return c.json({ 
      error: (error as Error).message || 'Transaction failed',
    }, 500)
  }
})

// List Transactions with enhanced filtering
transactionsRoutes.get('/', async (c) => {
  try {
    const page = Number(c.req.query('page') || 1)
    const limit = Number(c.req.query('limit') || 20)
    const offset = (page - 1) * limit
    
    const dateFrom = c.req.query('dateFrom')
    const dateTo = c.req.query('dateTo')
    const status = c.req.query('status')
    const cashierId = c.req.query('cashierId')
    const search = c.req.query('search')
    
    // Build conditions
    const conditions = []
    
    if (dateFrom) {
      conditions.push(gte(transactions.date, new Date(dateFrom)))
    }
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(transactions.date, endDate))
    }
    if (status) {
      conditions.push(eq(transactions.status, status))
    }
    if (cashierId) {
      conditions.push(eq(transactions.cashierId, cashierId))
    }
    if (search) {
      conditions.push(like(transactions.number, `%${search}%`))
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    
    const [data, countResult] = await Promise.all([
      db.query.transactions.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(transactions.date)],
        with: {
          cashier: true,
          customer: true,
          items: { with: { product: true } }
        }
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(whereClause)
    ])
    
    const count = Number(countResult[0]?.count || 0)

    return c.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('List transactions error:', error)
    return c.json({ error: 'Failed to list transactions' }, 500)
  }
})

// Get transaction summary/statistics
transactionsRoutes.get('/summary', async (c) => {
  try {
    const dateFrom = c.req.query('dateFrom')
    const dateTo = c.req.query('dateTo')
    
    const conditions = [eq(transactions.status, 'completed')]
    
    if (dateFrom) {
      conditions.push(gte(transactions.date, new Date(dateFrom)))
    }
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(transactions.date, endDate))
    }
    
    const whereClause = and(...conditions)
    
    const [stats] = await db.select({
      totalTransactions: sql<number>`count(*)`,
      totalSales: sql<number>`coalesce(sum(cast(${transactions.finalAmount} as decimal)), 0)`,
      avgTransaction: sql<number>`coalesce(avg(cast(${transactions.finalAmount} as decimal)), 0)`,
    })
    .from(transactions)
    .where(whereClause)
    
    // Get total items sold
    const [itemStats] = await db.select({
      totalItems: sql<number>`coalesce(sum(${transactionItems.quantity}), 0)`
    })
    .from(transactionItems)
    .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
    .where(whereClause)
    
    return c.json({
      totalTransactions: Number(stats?.totalTransactions || 0),
      totalSales: Number(stats?.totalSales || 0),
      avgTransaction: Number(stats?.avgTransaction || 0),
      totalItems: Number(itemStats?.totalItems || 0)
    })
  } catch (error) {
    console.error('Transaction summary error:', error)
    return c.json({ error: 'Failed to get summary' }, 500)
  }
})

// Void/Cancel transaction
transactionsRoutes.put('/:id/void', async (c) => {
  try {
    const id = c.req.param('id')
    
    const result = await db.transaction(async (tx) => {
      // Get the transaction
      const trx = await tx.query.transactions.findFirst({
        where: eq(transactions.id, id),
        with: {
          items: { with: { product: true } }
        }
      })
      
      if (!trx) {
        throw new Error('Transaction not found')
      }
      
      if (trx.status === 'cancelled') {
        throw new Error('Transaction is already cancelled')
      }
      
      // Get default warehouse for stock restoration
      const defaultWarehouse = await tx.query.warehouses.findFirst({
        where: eq(warehouses.isDefault, true)
      })
      
      if (!defaultWarehouse) {
        throw new Error('No default warehouse found')
      }
      
      // Restore stock for each item
      for (const item of trx.items) {
        // Get current stock
        const stockRecord = await tx.query.productStock.findFirst({
          where: and(
            eq(productStock.productId, item.productId),
            eq(productStock.warehouseId, defaultWarehouse.id)
          )
        })
        
        const currentQty = stockRecord?.quantity || 0
        const newQty = currentQty + item.quantity
        
        // Update stock
        if (stockRecord) {
          await tx.update(productStock)
            .set({ quantity: newQty, updatedAt: new Date() })
            .where(eq(productStock.id, stockRecord.id))
        } else {
          await tx.insert(productStock).values({
            productId: item.productId,
            warehouseId: defaultWarehouse.id,
            quantity: item.quantity
          })
        }
        
        // Record stock movement (restore)
        await tx.insert(stockMovements).values({
          productId: item.productId,
          warehouseId: defaultWarehouse.id,
          movementType: 'in',
          referenceType: 'return',
          referenceId: trx.id,
          referenceNumber: `VOID-${trx.number}`,
          quantityBefore: currentQty,
          quantityChange: item.quantity,
          quantityAfter: newQty,
          notes: `Void transaction ${trx.number}`
        })
      }
      
      // Update transaction status
      const [updated] = await tx.update(transactions)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(transactions.id, id))
        .returning()
      
      return updated
    })
    
    return c.json({ message: 'Transaction voided successfully', transaction: result })
  } catch (error) {
    console.error('Void transaction error:', error)
    return c.json({ error: (error as Error).message || 'Failed to void transaction' }, 500)
  }
})

// Get single transaction
transactionsRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
      with: {
        cashier: true,
        customer: true,
        items: { with: { product: true } }
      }
    })
    
    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404)
    }
    
    return c.json(transaction)
  } catch (error) {
    console.error('Get transaction error:', error)
    return c.json({ error: 'Failed to get transaction' }, 500)
  }
})

// Get cashiers for filter dropdown
transactionsRoutes.get('/meta/cashiers', async (c) => {
  try {
    const cashiers = await db.selectDistinct({ 
      id: users.id, 
      name: users.name 
    })
    .from(users)
    .innerJoin(transactions, eq(transactions.cashierId, users.id))
    .orderBy(users.name)
    
    return c.json(cashiers)
  } catch (error) {
    console.error('Get cashiers error:', error)
    return c.json({ error: 'Failed to get cashiers' }, 500)
  }
})

export { transactionsRoutes }
