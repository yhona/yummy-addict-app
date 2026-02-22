import { Hono } from 'hono'
import { db } from '../db'
import { salesReturns, salesReturnItems, transactions, transactionItems, products, productStock, stockMovements, warehouses } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { z } from 'zod'

const returnsRoutes = new Hono()

const createReturnSchema = z.object({
  transactionId: z.string().uuid(),
  items: z.array(z.object({
    transactionItemId: z.string().uuid().optional(),
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().min(0),
  })),
  reason: z.string().optional(),
  notes: z.string().optional(),
  processedBy: z.string().uuid().optional(),
})

// Create Return
returnsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validation = createReturnSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation error', details: validation.error.flatten() }, 400)
    }
    
    const data = validation.data
    
    // Verify transaction exists
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, data.transactionId),
      with: { items: true }
    })
    
    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404)
    }
    
    const result = await db.transaction(async (tx) => {
      // Get default warehouse
      const defaultWarehouse = await tx.query.warehouses.findFirst({
        where: eq(warehouses.isDefault, true)
      })
      
      if (!defaultWarehouse) {
        throw new Error('No default warehouse configured')
      }
      
      // Calculate total
      let totalAmount = 0
      for (const item of data.items) {
        totalAmount += item.price * item.quantity
      }
      
      // Generate return number
      const number = `RET-${Date.now()}`
      
      // Create return header
      const [newReturn] = await tx.insert(salesReturns).values({
        number,
        transactionId: data.transactionId,
        date: new Date(),
        reason: data.reason,
        totalAmount: String(totalAmount),
        status: 'completed',
        processedBy: data.processedBy,
        notes: data.notes,
      }).returning()
      
      // Create return items and restore stock
      for (const item of data.items) {
        // Insert return item
        await tx.insert(salesReturnItems).values({
          returnId: newReturn!.id,
          transactionItemId: item.transactionItemId,
          productId: item.productId,
          quantity: item.quantity,
          price: String(item.price),
          subtotal: String(item.price * item.quantity),
        })
        
        // Get product to check if it tracks inventory
        const product = await tx.query.products.findFirst({
          where: eq(products.id, item.productId)
        })
        
        if (product) {
          // Get current stock
          const stockRecord = await tx.query.productStock.findFirst({
            where: and(
              eq(productStock.productId, item.productId),
              eq(productStock.warehouseId, defaultWarehouse.id)
            )
          })
          
          const currentQty = stockRecord?.quantity || 0
          const newQty = currentQty + item.quantity
          
          // Update or insert stock
          if (stockRecord) {
            await tx.update(productStock)
              .set({ 
                quantity: newQty,
                updatedAt: new Date()
              })
              .where(and(
                eq(productStock.productId, item.productId),
                eq(productStock.warehouseId, defaultWarehouse.id)
              ))
          } else {
            await tx.insert(productStock).values({
              productId: item.productId,
              warehouseId: defaultWarehouse.id,
              quantity: item.quantity,
            })
          }
          
          // Create stock movement
          await tx.insert(stockMovements).values({
            productId: item.productId,
            warehouseId: defaultWarehouse.id,
            movementType: 'in',
            referenceType: 'return',
            referenceId: newReturn!.id,
            referenceNumber: newReturn!.number,
            quantityBefore: currentQty,
            quantityChange: item.quantity,
            quantityAfter: newQty,
            createdBy: data.processedBy,
            notes: `Sales Return: ${data.reason || 'No reason provided'}`
          })
        }
      }
      
      // Fetch complete return with relations
      const fullReturn = await tx.query.salesReturns.findFirst({
        where: eq(salesReturns.id, newReturn!.id),
        with: {
          transaction: true,
          items: {
            with: { product: true }
          },
          processedByUser: true
        }
      })
      
      return fullReturn
    })
    
    return c.json(result, 201)
    
  } catch (error) {
    console.error('Return error:', error)
    return c.json({ 
      error: (error as Error).message || 'Return creation failed',
    }, 500)
  }
})

// List Returns
returnsRoutes.get('/', async (c) => {
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 20)
  const offset = (page - 1) * limit
  
  const data = await db.query.salesReturns.findMany({
    limit,
    offset,
    orderBy: [desc(salesReturns.date)],
    with: {
      transaction: true,
      processedByUser: true,
      items: {
        with: { product: true }
      }
    }
  })
  
  return c.json({ data })
})

// Get Return by ID
returnsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  
  const data = await db.query.salesReturns.findFirst({
    where: eq(salesReturns.id, id),
    with: {
      transaction: {
        with: {
          items: { with: { product: true } },
          cashier: true,
          customer: true
        }
      },
      processedByUser: true,
      items: {
        with: { product: true }
      }
    }
  })
  
  if (!data) {
    return c.json({ error: 'Return not found' }, 404)
  }
  
  return c.json(data)
})

export { returnsRoutes }
