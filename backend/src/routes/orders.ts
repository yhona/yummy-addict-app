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
      const requiredQuantities = new Map<string, { quantity: number; name: string; parentId?: string | null; conversionRatio?: string | null }>()

      for (const item of data.items) {
          const product = await tx.query.products.findFirst({
            where: eq(products.id, item.productId),
            with: { parent: true, bundleItems: { with: { product: true } } }
          })

          if (!product) {
            throw new Error(`Product not found: ${item.productId}`)
          }
          
          processedItems.push({ ...item, product })

          if (product.type === 'bundle') {
            for (const bItem of product.bundleItems) {
              const bProd = bItem.product
              const existing = requiredQuantities.get(bProd.id) || { quantity: 0, name: bProd.name, parentId: bProd.parentId, conversionRatio: bProd.conversionRatio }
              requiredQuantities.set(bProd.id, { ...existing, quantity: existing.quantity + (bItem.quantity * item.quantity) })
            }
          } else {
            const existing = requiredQuantities.get(product.id) || { quantity: 0, name: product.name, parentId: product.parentId, conversionRatio: product.conversionRatio }
            requiredQuantities.set(product.id, { ...existing, quantity: existing.quantity + item.quantity })
          }
      }

      const stockDeductions: Array<{ productId: string; warehouseId: string; quantityToDeduct: number; currentQty: number; parentId?: string | null; conversionRatio?: string | null }> = []

      for (const [productId, req] of requiredQuantities.entries()) {
        const stockRecord = await tx.query.productStock.findFirst({
          where: and(
            eq(productStock.productId, productId),
            eq(productStock.warehouseId, defaultWarehouse.id)
          )
        })

        const currentQty = stockRecord?.quantity || 0
        if (currentQty < req.quantity) {
           throw new Error(`Insufficient stock for ${req.name} (Current: ${currentQty}, Required: ${req.quantity})`)
        }

        stockDeductions.push({
          productId,
          warehouseId: defaultWarehouse.id,
          quantityToDeduct: req.quantity,
          currentQty,
          parentId: req.parentId,
          conversionRatio: req.conversionRatio
        })
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
      
      // Create order items
      for (const item of processedItems) {
        await tx.insert(orderItems).values({
          orderId: newOrder!.id,
          productId: item.productId,
          quantity: item.quantity,
          price: String(item.price),
          subtotal: String(item.price * item.quantity),
          notes: item.notes,
        })
      }

      // Stock Deductions & Movements
      for (const deduction of stockDeductions) {
        await tx.update(productStock)
          .set({ 
            quantity: deduction.currentQty - deduction.quantityToDeduct,
            updatedAt: new Date()
          })
          .where(and(
            eq(productStock.productId, deduction.productId),
            eq(productStock.warehouseId, deduction.warehouseId)
          ))
          
        await tx.insert(stockMovements).values({
          productId: deduction.productId,
          warehouseId: deduction.warehouseId,
          movementType: 'out',
          referenceType: 'sale',
          referenceId: newOrder!.id,
          referenceNumber: newOrder!.number,
          quantityBefore: deduction.currentQty,
          quantityChange: -deduction.quantityToDeduct,
          quantityAfter: deduction.currentQty - deduction.quantityToDeduct,
          notes: `Order Reservation ${newOrder!.number}`
        })

        // BULK-TO-RETAIL CONVERSION
        if (deduction.parentId && deduction.conversionRatio) {
          const parentStockRecord = await tx.query.productStock.findFirst({
            where: and(
              eq(productStock.productId, deduction.parentId),
              eq(productStock.warehouseId, deduction.warehouseId)
            )
          })

          const parentCurrentQty = parentStockRecord?.quantity || 0
          const conversionRatio = Number(deduction.conversionRatio)
          const exactDeduction = deduction.quantityToDeduct / conversionRatio
          const deductFromParent = Math.floor(exactDeduction)

          if (parentStockRecord && deductFromParent >= 1 && parentCurrentQty >= deductFromParent) {
            await tx.update(productStock)
              .set({ quantity: parentCurrentQty - deductFromParent, updatedAt: new Date() })
              .where(eq(productStock.id, parentStockRecord.id))

            await tx.insert(stockMovements).values({
              productId: deduction.parentId,
              warehouseId: deduction.warehouseId,
              movementType: 'out',
              referenceType: 'sale',
              referenceId: newOrder!.id,
              referenceNumber: newOrder!.number,
              quantityBefore: parentCurrentQty,
              quantityChange: -deductFromParent,
              quantityAfter: parentCurrentQty - deductFromParent,
              notes: `Bulk conversion: Sold ${deduction.quantityToDeduct}x retail (ratio: ${conversionRatio}, deducted: ${deductFromParent})`
            })
          }
        }
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
        where: eq(orders.id, id),
        with: { items: { with: { product: { with: { bundleItems: { with: { product: true } } } } } } }
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
        const requiredRestores = new Map<string, { quantity: number; name: string }>()
        
        for (const item of existingOrder.items) {
          if (item.product?.type === 'bundle') {
            for (const bItem of item.product.bundleItems) {
              const existing = requiredRestores.get(bItem.productId) || { quantity: 0, name: bItem.product.name }
              requiredRestores.set(bItem.productId, {
                quantity: existing.quantity + (bItem.quantity * item.quantity),
                name: bItem.product.name
              })
            }
          } else {
            const prodName = item.product?.name || 'Unknown' 
            const existing = requiredRestores.get(item.productId) || { quantity: 0, name: prodName }
            requiredRestores.set(item.productId, {
              quantity: existing.quantity + item.quantity,
              name: prodName
            })
          }
        }

        for (const [productId, restore] of requiredRestores.entries()) {
            const stockRecord = await tx.query.productStock.findFirst({
                where: and(
                    eq(productStock.productId, productId),
                    eq(productStock.warehouseId, defaultWarehouse.id)
                )
            })

            const currentQty = stockRecord?.quantity || 0
            
            if (stockRecord) {
                await tx.update(productStock)
                    .set({ 
                        quantity: currentQty + restore.quantity,
                        updatedAt: new Date()
                    })
                    .where(eq(productStock.id, stockRecord.id))
            } else {
                 await tx.insert(productStock).values({
                   productId: productId,
                   warehouseId: defaultWarehouse.id,
                   quantity: restore.quantity
                 })
            }

            // Record restoration movement
            await tx.insert(stockMovements).values({
                productId: productId,
                warehouseId: defaultWarehouse.id,
                movementType: 'in',
                referenceType: 'adjustment',
                referenceId: id,
                referenceNumber: existingOrder.number,
                quantityBefore: currentQty,
                quantityChange: restore.quantity,
                quantityAfter: currentQty + restore.quantity,
                notes: `Restore before update ${existingOrder.number}`
            })
        }

        // Delete existing items
        await tx.delete(orderItems).where(eq(orderItems.orderId, id))
        
        // Recalculate total and Deduct stock for NEW items
        totalAmount = '0'
        let total = 0
        const requiredQuantities = new Map<string, { quantity: number; name: string; parentId?: string | null; conversionRatio?: string | null }>()
        
        for (const item of data.items) {
          const product = await tx.query.products.findFirst({
            where: eq(products.id, item.productId),
            with: { parent: true, bundleItems: { with: { product: true } } }
          })
          if (!product) throw new Error(`Product not found: ${item.productId}`)
          
          total += item.price * item.quantity

          if (product.type === 'bundle') {
            for (const bItem of product.bundleItems) {
              const bProd = bItem.product
              const existing = requiredQuantities.get(bProd.id) || { quantity: 0, name: bProd.name, parentId: bProd.parentId, conversionRatio: bProd.conversionRatio }
              requiredQuantities.set(bProd.id, { ...existing, quantity: existing.quantity + (bItem.quantity * item.quantity) })
            }
          } else {
            const existing = requiredQuantities.get(product.id) || { quantity: 0, name: product.name, parentId: product.parentId, conversionRatio: product.conversionRatio }
            requiredQuantities.set(product.id, { ...existing, quantity: existing.quantity + item.quantity })
          }

          // Insert order item
          await tx.insert(orderItems).values({
            orderId: id,
            productId: item.productId,
            quantity: item.quantity,
            price: String(item.price),
            subtotal: String(item.price * item.quantity),
            notes: item.notes,
          })
        }

        for (const [productId, req] of requiredQuantities.entries()) {
          const stockRecord = await tx.query.productStock.findFirst({
            where: and(eq(productStock.productId, productId), eq(productStock.warehouseId, defaultWarehouse.id))
          })

          const currentQty = stockRecord?.quantity || 0
          if (currentQty < req.quantity) {
             throw new Error(`Insufficient stock for ${req.name} (Current: ${currentQty}, Required: ${req.quantity})`)
          }
          
          if (stockRecord) {
            await tx.update(productStock)
              .set({ quantity: currentQty - req.quantity, updatedAt: new Date() })
              .where(eq(productStock.id, stockRecord.id))
          }

          await tx.insert(stockMovements).values({
              productId,
              warehouseId: defaultWarehouse.id,
              movementType: 'out',
              referenceType: 'sale',
              referenceId: id,
              referenceNumber: existingOrder.number,
              quantityBefore: currentQty,
              quantityChange: -req.quantity,
              quantityAfter: currentQty - req.quantity,
              notes: `Update Reservation ${existingOrder.number}`
          })

          // BUGK-TO-RETAIL CONVERSION
          if (req.parentId && req.conversionRatio) {
            const parentStockRecord = await tx.query.productStock.findFirst({
              where: and(
                eq(productStock.productId, req.parentId),
                eq(productStock.warehouseId, defaultWarehouse.id)
              )
            })

            const parentCurrentQty = parentStockRecord?.quantity || 0
            const conversionRatio = Number(req.conversionRatio)
            const exactDeduction = req.quantity / conversionRatio
            const deductFromParent = Math.floor(exactDeduction)

            if (parentStockRecord && deductFromParent >= 1 && parentCurrentQty >= deductFromParent) {
              await tx.update(productStock)
                .set({ quantity: parentCurrentQty - deductFromParent, updatedAt: new Date() })
                .where(eq(productStock.id, parentStockRecord.id))

              await tx.insert(stockMovements).values({
                productId: req.parentId,
                warehouseId: defaultWarehouse.id,
                movementType: 'out',
                referenceType: 'sale',
                referenceId: id,
                referenceNumber: existingOrder.number,
                quantityBefore: parentCurrentQty,
                quantityChange: -deductFromParent,
                quantityAfter: parentCurrentQty - deductFromParent,
                notes: `Bulk conversion: Sold ${req.quantity}x retail (ratio: ${conversionRatio}, deducted: ${deductFromParent})`
              })
            }
          }
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
      with: { items: { with: { product: { with: { bundleItems: { with: { product: true } } } } } } }
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

      const requiredRestores = new Map<string, { quantity: number; name: string }>()
      
      for (const item of order.items) {
        if (item.product?.type === 'bundle') {
          for (const bItem of item.product.bundleItems) {
            const existing = requiredRestores.get(bItem.productId) || { quantity: 0, name: bItem.product.name }
            requiredRestores.set(bItem.productId, {
              quantity: existing.quantity + (bItem.quantity * item.quantity),
              name: bItem.product.name
            })
          }
        } else {
          const prodName = item.product?.name || 'Unknown' 
          const existing = requiredRestores.get(item.productId) || { quantity: 0, name: prodName }
          requiredRestores.set(item.productId, {
            quantity: existing.quantity + item.quantity,
            name: prodName
          })
        }
      }

      // Restore Stock for each item
      for (const [productId, restore] of requiredRestores.entries()) {
          // Get current stock
          const stockRecord = await tx.query.productStock.findFirst({
            where: and(
              eq(productStock.productId, productId),
              eq(productStock.warehouseId, defaultWarehouse.id)
            )
          })

          const currentQty = stockRecord?.quantity || 0
          
          // Restore Stock
          if (stockRecord) {
            await tx.update(productStock)
              .set({ 
                quantity: currentQty + restore.quantity,
                updatedAt: new Date()
              })
              .where(eq(productStock.id, stockRecord.id))
          } else {
             await tx.insert(productStock).values({
               productId: productId,
               warehouseId: defaultWarehouse.id,
               quantity: restore.quantity
             })
          }
          
          await tx.insert(stockMovements).values({
            productId: productId,
            warehouseId: defaultWarehouse.id,
            movementType: 'in',
            referenceType: 'return',
            referenceId: order.id,
            referenceNumber: order.number,
            quantityBefore: currentQty,
            quantityChange: restore.quantity,
            quantityAfter: currentQty + restore.quantity,
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
