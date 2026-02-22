import { Hono } from 'hono'
import { db } from '../db'
import { orders, orderItems, products, productStock, stockMovements, transactions, transactionItems, warehouses, customers } from '../db/schema'
import { eq, desc, sql, and, like, or, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

const ordersRoutes = new Hono()

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().min(0),
  notes: z.string().optional(),
})

const createOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
  notes: z.string().optional(),
  paymentMethod: z.enum(['cash', 'qris', 'transfer']).optional().nullable(),
  cashAmount: z.number().min(0).optional().nullable(),
  // Shipping
  shippingCost: z.number().min(0).default(0),
  deliveryMethod: z.enum(['pickup', 'delivery']).default('pickup'),
  courierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  // Discount
  discountAmount: z.number().min(0).default(0),
})

const updateOrderSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  items: z.array(orderItemSchema).optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['cash', 'qris', 'transfer']).optional().nullable(),
  cashAmount: z.number().min(0).optional().nullable(),
  // Shipping
  shippingCost: z.number().min(0).optional(),
  deliveryMethod: z.enum(['pickup', 'delivery']).optional(),
  courierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  // Discount
  discountAmount: z.number().min(0).optional(),
})

const completeOrderSchema = z.object({
  paymentMethod: z.enum(['cash', 'qris', 'transfer']).optional(),
  cashAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).default(0),
  cashierId: z.string().uuid().optional(),
})

// Create Order
ordersRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validation = createOrderSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation error', details: validation.error.flatten() }, 400)
    }
    
    const data = validation.data
    
    // Calculate total
    let totalAmount = 0
    for (const item of data.items) {
      totalAmount += item.price * item.quantity
    }
    
    // Add shipping cost
    if (data.shippingCost) {
      totalAmount += data.shippingCost
    }

    const discountAmount = data.discountAmount || 0
    const finalAmount = Math.max(0, totalAmount - discountAmount)
    
    const result = await db.transaction(async (tx) => {
      // Get default warehouse for stock deduction
      const defaultWarehouse = await tx.query.warehouses.findFirst({
        where: eq(warehouses.isDefault, true)
      })
      
      if (!defaultWarehouse) {
        throw new Error('No default warehouse configured')
      }

      // Generate order number
      const number = `ORD-${Date.now()}`
      
      // Additional check: Validate and Deduct Stock
      const processedItems = []
      for (const item of data.items) {
          // Get product with parent info
          const product = await tx.query.products.findFirst({
            where: eq(products.id, item.productId),
            with: { parent: true }
          })

          if (!product) {
            throw new Error(`Product not found: ${item.productId}`)
          }

          const stockRecord = await tx.query.productStock.findFirst({
            where: and(
              eq(productStock.productId, item.productId),
              eq(productStock.warehouseId, defaultWarehouse.id)
            )
          })

          const currentQty = stockRecord?.quantity || 0
          if (currentQty < item.quantity) {
             throw new Error(`Insufficient stock for ${product?.name || 'Item'} (Current: ${currentQty})`)
          }
          
          // Deduct Stock from this product
          if (stockRecord) {
            await tx.update(productStock)
              .set({ 
                quantity: currentQty - item.quantity,
                updatedAt: new Date()
              })
              .where(eq(productStock.id, stockRecord.id))
          } else {
             throw new Error(`Stock record missing for product ${item.productId}`)
          }

          // ===== BULK-TO-RETAIL CONVERSION =====
          // If product has a parent (bulk product), also deduct from parent stock
          if (product.parentId && product.conversionRatio) {
            const parentStockRecord = await tx.query.productStock.findFirst({
              where: and(
                eq(productStock.productId, product.parentId),
                eq(productStock.warehouseId, defaultWarehouse.id)
              )
            })

            const parentCurrentQty = parentStockRecord?.quantity || 0
            const conversionRatio = Number(product.conversionRatio)
            // Calculate deduction: quantity / ratio
            // e.g., sell 100 retail (ratio 100) = deduct 1 bulk unit
            const exactDeduction = item.quantity / conversionRatio
            // Use Math.floor since quantity is integer in DB
            const deductFromParent = Math.floor(exactDeduction)

            // Only deduct if at least 1 whole unit and sufficient stock
            if (parentStockRecord && deductFromParent >= 1 && parentCurrentQty >= deductFromParent) {
              await tx.update(productStock)
                .set({ 
                  quantity: parentCurrentQty - deductFromParent,
                  updatedAt: new Date()
                })
                .where(eq(productStock.id, parentStockRecord.id))

              // Record parent stock movement
              await tx.insert(stockMovements).values({
                productId: product.parentId,
                warehouseId: defaultWarehouse.id,
                movementType: 'out',
                referenceType: 'sale',
                referenceId: null, // Will be updated with order ID later
                referenceNumber: number,
                quantityBefore: parentCurrentQty,
                quantityChange: -deductFromParent,
                quantityAfter: parentCurrentQty - deductFromParent,
                notes: `Bulk conversion: Sold ${item.quantity}x ${product.name} (ratio: ${conversionRatio}, deducted: ${deductFromParent})`
              })
            }
          }
          // ===== END BULK-TO-RETAIL CONVERSION =====
          
          processedItems.push({ ...item, currentQty, product })
      }
      
      // Create order
      const [newOrder] = await tx.insert(orders).values({
        number,
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        totalAmount: String(totalAmount),
        notes: data.notes,
        status: 'pending',
        paymentMethod: data.paymentMethod,
        cashAmount: data.cashAmount ? String(data.cashAmount) : null,
        // Shipping
        shippingCost: String(data.shippingCost || 0),
        deliveryMethod: data.deliveryMethod,
        courierName: data.courierName,
        trackingNumber: data.trackingNumber,
        // Discount
        discountAmount: String(discountAmount),
        finalAmount: String(finalAmount),
      }).returning()
      
      // Create order items and Stock Movements
      for (const item of processedItems) {
        await tx.insert(orderItems).values({
          orderId: newOrder!.id,
          productId: item.productId,
          quantity: item.quantity,
          price: String(item.price),
          subtotal: String(item.price * item.quantity),
          notes: item.notes,
        })
        
        // Record movement
        await tx.insert(stockMovements).values({
          productId: item.productId,
          warehouseId: defaultWarehouse.id,
          movementType: 'out',
          referenceType: 'sale', // Using 'sale' as generic type, or could use 'order' if enum allows
          referenceId: newOrder!.id, // Linking to Order ID
          referenceNumber: newOrder!.number,
          quantityBefore: item.currentQty,
          quantityChange: -item.quantity,
          quantityAfter: item.currentQty - item.quantity,
          // createdBy: c.get('user')?.id, // If user context is available, else null
          notes: `Order Reservation ${newOrder!.number}`
        })
      }
      
      // Return full order with items
      const fullOrder = await tx.query.orders.findFirst({
        where: eq(orders.id, newOrder!.id),
        with: {
          customer: true,
          items: { with: { product: true } },
          createdByUser: true,
        }
      })
      
      return fullOrder
    })
    
    return c.json(result, 201)
  } catch (error) {
    console.error('Create order error:', error)
    return c.json({ error: (error as Error).message || 'Failed to create order' }, 500)
  }
})

// List Orders
ordersRoutes.get('/', async (c) => {
  try {
    const page = Number(c.req.query('page') || 1)
    const limit = Number(c.req.query('limit') || 20)
    const offset = (page - 1) * limit
    
    const status = c.req.query('status')
    const search = c.req.query('search')
    const dateFrom = c.req.query('dateFrom')
    const dateTo = c.req.query('dateTo')
    
    const conditions = []
    
    if (status && status !== 'all') {
      conditions.push(eq(orders.status, status))
    }
    if (search) {
      conditions.push(or(
        like(orders.number, `%${search}%`),
        like(orders.customerName, `%${search}%`),
        like(orders.customerPhone, `%${search}%`)
      ))
    }
    if (dateFrom) {
      // Append time to force local time parsing instead of UTC
      conditions.push(gte(orders.date, new Date(`${dateFrom}T00:00:00`)))
    }
    if (dateTo) {
      const endDate = new Date(`${dateTo}T00:00:00`)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(orders.date, endDate))
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    
    const [data, countResult] = await Promise.all([
      db.query.orders.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(orders.date)],
        with: {
          customer: true,
          items: { with: { product: true } },
          createdByUser: true,
        }
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
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
    console.error('List orders error:', error)
    return c.json({ error: 'Failed to list orders' }, 500)
  }
})

// Get Order by ID
ordersRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        customer: true,
        items: { with: { product: true } },
        createdByUser: true,
        transaction: true,
      }
    })
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }
    
    return c.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    return c.json({ error: 'Failed to get order' }, 500)
  }
})

// Update Order
ordersRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validation = updateOrderSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation error', details: validation.error.flatten() }, 400)
    }
    
    const data = validation.data
    
    const result = await db.transaction(async (tx) => {
      // Get existing order
      const existingOrder = await tx.query.orders.findFirst({
        where: eq(orders.id, id)
      })
      
      if (!existingOrder) {
        throw new Error('Order not found')
      }
      
      if (existingOrder.status !== 'pending') {
        throw new Error('Cannot update non-pending order')
      }
      
      // Update order details
      let totalAmount = existingOrder.totalAmount
      
      // Get default warehouse
      const defaultWarehouse = await tx.query.warehouses.findFirst({
        where: eq(warehouses.isDefault, true)
      })
      
      if (!defaultWarehouse) {
        throw new Error('No default warehouse configured')
      }

      if (data.items) {
        // 1. Restore stock for OLD items
        const oldItems = await tx.query.orderItems.findMany({
            where: eq(orderItems.orderId, id)
        })

        for (const item of oldItems) {
            // Restore stock
            const stockRecord = await tx.query.productStock.findFirst({
                where: and(
                    eq(productStock.productId, item.productId),
                    eq(productStock.warehouseId, defaultWarehouse.id)
                )
            })

            const currentQty = stockRecord?.quantity || 0
            
            if (stockRecord) {
                await tx.update(productStock)
                    .set({ 
                        quantity: currentQty + item.quantity,
                        updatedAt: new Date()
                    })
                    .where(eq(productStock.id, stockRecord.id))
            } else {
                 await tx.insert(productStock).values({
                   productId: item.productId,
                   warehouseId: defaultWarehouse.id,
                   quantity: item.quantity
                 })
            }

            // Record restoration movement
            await tx.insert(stockMovements).values({
                productId: item.productId,
                warehouseId: defaultWarehouse.id,
                movementType: 'in',
                referenceType: 'adjustment',
                referenceId: id,
                referenceNumber: existingOrder.number,
                quantityBefore: currentQty,
                quantityChange: item.quantity,
                quantityAfter: currentQty + item.quantity,
                notes: `Restore before update ${existingOrder.number}`
            })
        }

        // Delete existing items
        await tx.delete(orderItems).where(eq(orderItems.orderId, id))
        
        // Recalculate total and Deduct stock for NEW items
        totalAmount = '0'
        let total = 0
        
        for (const item of data.items) {
          // Check Stock
          const stockRecord = await tx.query.productStock.findFirst({
            where: and(
              eq(productStock.productId, item.productId),
              eq(productStock.warehouseId, defaultWarehouse.id)
            )
          })

          const currentQty = stockRecord?.quantity || 0
          if (currentQty < item.quantity) {
             const product = await tx.query.products.findFirst({
                where: eq(products.id, item.productId)
             })
             throw new Error(`Insufficient stock for ${product?.name || 'Item'} (Current: ${currentQty})`)
          }
          
          // Deduct Stock
          if (stockRecord) {
            await tx.update(productStock)
              .set({ 
                quantity: currentQty - item.quantity,
                updatedAt: new Date()
              })
              .where(eq(productStock.id, stockRecord.id))
          }

          // Record deduction movement
          await tx.insert(stockMovements).values({
              productId: item.productId,
              warehouseId: defaultWarehouse.id,
              movementType: 'out',
              referenceType: 'sale',
              referenceId: id,
              referenceNumber: existingOrder.number,
              quantityBefore: currentQty,
              quantityChange: -item.quantity,
              quantityAfter: currentQty - item.quantity,
              notes: `Update Reservation ${existingOrder.number}`
          })

          total += item.price * item.quantity
          await tx.insert(orderItems).values({
            orderId: id,
            productId: item.productId,
            quantity: item.quantity,
            price: String(item.price),
            subtotal: String(item.price * item.quantity),
            notes: item.notes,
          })
        }
        
        totalAmount = String(total)
      }
      
      // Update shipping cost if provided
      let currentShippingCost = Number(existingOrder.shippingCost || 0)
      if (data.shippingCost !== undefined) {
          currentShippingCost = data.shippingCost
      }
      
      // Recalculate total with shipping
      // If items were updated, totalAmount is the new items total
      // If items weren't updated, we need to get the existing items total
      let itemsTotal = 0
      if (data.items) {
          itemsTotal = Number(totalAmount) 
      } else {
          // Calculate from existing items
          const currentItems = await tx.query.orderItems.findMany({
            where: eq(orderItems.orderId, id)
          })
          itemsTotal = currentItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
      }
      
      totalAmount = String(itemsTotal + currentShippingCost)
      
      // Calculate Final Amount
      const currentDiscount = data.discountAmount !== undefined ? data.discountAmount : Number(existingOrder.discountAmount || 0)
      const finalAmount = Math.max(0, Number(totalAmount) - currentDiscount)

      // Update order
      await tx.update(orders)
        .set({
          customerId: data.customerId !== undefined ? data.customerId : existingOrder.customerId,
          customerName: data.customerName ?? existingOrder.customerName,
          customerPhone: data.customerPhone ?? existingOrder.customerPhone,
          customerAddress: data.customerAddress ?? existingOrder.customerAddress,
          notes: data.notes ?? existingOrder.notes,
          paymentMethod: data.paymentMethod !== undefined ? data.paymentMethod : existingOrder.paymentMethod,
          cashAmount: data.cashAmount !== undefined ? (data.cashAmount ? String(data.cashAmount) : null) : existingOrder.cashAmount,
          totalAmount,
          updatedAt: new Date(),
          // Shipping
          shippingCost: data.shippingCost !== undefined ? String(data.shippingCost) : existingOrder.shippingCost,
          deliveryMethod: data.deliveryMethod !== undefined ? data.deliveryMethod : existingOrder.deliveryMethod,
          courierName: data.courierName !== undefined ? data.courierName : existingOrder.courierName,
          trackingNumber: data.trackingNumber !== undefined ? data.trackingNumber : existingOrder.trackingNumber,
          // Discount
          discountAmount: String(currentDiscount),
          finalAmount: String(finalAmount),
        })
        .where(eq(orders.id, id))
      
      return tx.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
          customer: true,
          items: { with: { product: true } },
        }
      })
    })
    
    return c.json(result)
  } catch (error) {
    console.error('Update order error:', error)
    return c.json({ error: (error as Error).message || 'Failed to update order' }, 500)
  }
})

// Complete Order (Process Payment)
ordersRoutes.put('/:id/complete', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validation = completeOrderSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation error', details: validation.error.flatten() }, 400)
    }
    
    const data = validation.data
    
    const result = await db.transaction(async (tx) => {
      // Get order with items
      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, id),
        with: { items: { with: { product: true } } }
      })
      
      if (!order) {
        throw new Error('Order not found')
      }
      
      // Validate order status
      if (order.status !== 'pending') {
        throw new Error('Order is not pending')
      }
      
      const totalAmount = Number(order.totalAmount)
      const finalAmount = totalAmount - data.discountAmount
      
      // Create financial transaction
      const txNumber = `TRX-${Date.now()}`
      const [newTx] = await tx.insert(transactions).values({
        number: txNumber,
        date: new Date(),
        cashierId: data.cashierId,
        customerId: order.customerId,
        totalAmount: String(totalAmount),
        discountAmount: String(data.discountAmount),
        finalAmount: String(finalAmount),
        paymentMethod: data.paymentMethod || order.paymentMethod || 'cash',
        cashAmount: (data.cashAmount || order.cashAmount) ? String(data.cashAmount || order.cashAmount) : undefined,
        changeAmount: (data.cashAmount || order.cashAmount) ? String((data.cashAmount || Number(order.cashAmount)) - finalAmount) : undefined,
        status: 'completed',
        notes: `From Order: ${order.number}`,
        // Shipping
        shippingCost: order.shippingCost,
        deliveryMethod: order.deliveryMethod,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
      }).returning()
      
      // Record transaction items (for reporting)
      for (const item of order.items) {
        await tx.insert(transactionItems).values({
          transactionId: newTx!.id,
          productId: item.productId,
          quantity: item.quantity,
          price: String(item.price),
          costPrice: String(item.product.costPrice),
          subtotal: String(item.subtotal),
        })
        
        // Stock deduction already happened at Order Creation (Reservation)
      }
      
      // Update order status
      await tx.update(orders)
        .set({ 
          status: 'completed',
          transactionId: newTx!.id,
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
      
      // Return full transaction
      const fullTx = await tx.query.transactions.findFirst({
        where: eq(transactions.id, newTx!.id),
        with: {
          items: { with: { product: true } },
          cashier: true,
          customer: true,
        }
      })
      
      return fullTx
    })
    
    return c.json(result)
  } catch (error) {
    console.error('Complete order error:', error)
    return c.json({ error: (error as Error).message || 'Failed to complete order' }, 500)
  }
})

// Cancel Order
ordersRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true }
    })
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }
    
    if (order.status !== 'pending') {
      return c.json({ error: 'Cannot cancel non-pending order' }, 400)
    }
    
    const result = await db.transaction(async (tx) => {
      // Get Default Warehouse
      const defaultWarehouse = await tx.query.warehouses.findFirst({
        where: eq(warehouses.isDefault, true)
      })

      if (!defaultWarehouse) {
        throw new Error('No default warehouse configured')
      }

      // Restore Stock for each item
      for (const item of order.items) {
          // Get current stock
          const stockRecord = await tx.query.productStock.findFirst({
            where: and(
              eq(productStock.productId, item.productId),
              eq(productStock.warehouseId, defaultWarehouse.id)
            )
          })

          const currentQty = stockRecord?.quantity || 0
          
          // Restore Stock
          if (stockRecord) {
            await tx.update(productStock)
              .set({ 
                quantity: currentQty + item.quantity,
                updatedAt: new Date()
              })
              .where(eq(productStock.id, stockRecord.id))
          } else {
             // If stock record missing, create it
             await tx.insert(productStock).values({
               productId: item.productId,
               warehouseId: defaultWarehouse.id,
               quantity: item.quantity
             })
          }
          
          // Record Stock Movement
          await tx.insert(stockMovements).values({
            productId: item.productId,
            warehouseId: defaultWarehouse.id,
            movementType: 'in',
            referenceType: 'return', // Using 'return' as generic type for restoration
            referenceId: order.id,
            referenceNumber: order.number,
            quantityBefore: currentQty,
            quantityChange: item.quantity,
            quantityAfter: currentQty + item.quantity,
            notes: `Restore from Cancelled Order ${order.number}`
          })
      }

      // Update Order Status
      await tx.update(orders)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(orders.id, id))
        
      return { message: 'Order cancelled and stock restored successfully' }
    })
    
    return c.json(result)
  } catch (error) {
    console.error('Cancel order error:', error)
    return c.json({ error: 'Failed to cancel order' }, 500)
  }
})

export { ordersRoutes }
