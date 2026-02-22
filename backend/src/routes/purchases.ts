import { Hono } from 'hono'
import { db } from '../db'
import { purchases, purchaseItems, products, productStock, stockMovements, warehouses } from '../db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { z } from 'zod'

const purchasesRoutes = new Hono()

const createPurchaseSchema = z.object({
  supplierId: z.string().uuid(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    costPrice: z.number().min(0),
  }))
})

// List Purchases
purchasesRoutes.get('/', async (c) => {
  try {
    const data = await db.query.purchases.findMany({
        with: { 
            supplier: true, 
            items: { 
                with: { product: true } 
            } 
        },
        orderBy: [desc(purchases.createdAt)],
        limit: 50
    })
    return c.json({ data })
  } catch (error) {
    return c.json({ error: 'Failed to fetch purchases' }, 500)
  }
})

// Get One
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

// Create Purchase Order
purchasesRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const result = createPurchaseSchema.safeParse(body)
    
    if (!result.success) {
      return c.json({ error: 'Validation error', details: result.error.flatten() }, 400)
    }
    
    const data = result.data
    
    const transaction = await db.transaction(async (tx) => {
       // Calculate total
       const totalAmount = data.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0)
       
       const number = `PO-${Date.now()}`
       
       const [newPo] = await tx.insert(purchases).values({
           number,
           supplierId: data.supplierId,
           totalAmount: String(totalAmount),
           status: 'ordered',
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

// Receive Purchase (Complete)
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
             
             // Get Default Warehouse
             const defaultWarehouse = await tx.query.warehouses.findFirst({
                 where: eq(warehouses.isDefault, true)
             })
             
             if (!defaultWarehouse) throw new Error("No default warehouse configured for receiving")
             
             // Update Status
             await tx.update(purchases).set({ status: 'received', updatedAt: new Date() }).where(eq(purchases.id, id))
             
             // Process Items
             for (const item of purchase.items) {
                 // 1. Update Product Cost Price (Latest Price Strategy)
                 await tx.update(products)
                    .set({ costPrice: item.costPrice, updatedAt: new Date() })
                    .where(eq(products.id, item.productId))
                 
                 // 2. Update Stock
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
                 
                 // 3. Stock Movement
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
                     // createdBy: c.get('user')?.id, // Optional - requires auth middleware
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

export { purchasesRoutes }
