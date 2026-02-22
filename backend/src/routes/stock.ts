import { Hono } from 'hono'
import { db } from '../db'
import { productStock, stockMovements, products, warehouses } from '../db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { z } from 'zod'

const stockRoutes = new Hono()

// Stock adjustment schema
const stockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  adjustmentType: z.enum(['add', 'subtract', 'set']),
  quantity: z.number().int().min(0),
  reason: z.string().min(1),
  notes: z.string().optional(),
})

// Get stock for a product across all warehouses
stockRoutes.get('/product/:productId', async (c) => {
  try {
    const productId = c.req.param('productId')

    const stock = await db.query.productStock.findMany({
      where: eq(productStock.productId, productId),
      with: {
        warehouse: true,
      },
    })

    return c.json(stock)
  } catch (error) {
    console.error('Get product stock error:', error)
    return c.json({ error: 'Failed to get product stock' }, 500)
  }
})

// Get stock for a warehouse
stockRoutes.get('/warehouse/:warehouseId', async (c) => {
  try {
    const warehouseId = c.req.param('warehouseId')

    const stock = await db.query.productStock.findMany({
      where: eq(productStock.warehouseId, warehouseId),
      with: {
        product: true,
      },
    })

    return c.json(stock)
  } catch (error) {
    console.error('Get warehouse stock error:', error)
    return c.json({ error: 'Failed to get warehouse stock' }, 500)
  }
})

// Adjust stock (add, subtract, or set)
stockRoutes.post('/adjust', async (c) => {
  try {
    const body = await c.req.json()
    const data = stockAdjustmentSchema.parse(body)

    // Get current stock
    let currentStock = await db.query.productStock.findFirst({
      where: and(
        eq(productStock.productId, data.productId),
        eq(productStock.warehouseId, data.warehouseId)
      ),
    })

    const quantityBefore = currentStock?.quantity || 0
    let quantityAfter: number
    let quantityChange: number

    switch (data.adjustmentType) {
      case 'add':
        quantityAfter = quantityBefore + data.quantity
        quantityChange = data.quantity
        break
      case 'subtract':
        quantityAfter = Math.max(0, quantityBefore - data.quantity)
        quantityChange = -Math.min(data.quantity, quantityBefore)
        break
      case 'set':
        quantityAfter = data.quantity
        quantityChange = data.quantity - quantityBefore
        break
    }

    // Update or create stock record
    if (currentStock) {
      await db
        .update(productStock)
        .set({ quantity: quantityAfter, updatedAt: new Date() })
        .where(eq(productStock.id, currentStock.id))
    } else {
      const [newStock] = await db.insert(productStock).values({
        productId: data.productId,
        warehouseId: data.warehouseId,
        quantity: quantityAfter,
      }).returning()
      currentStock = newStock
    }

    // Record the movement
    const [movement] = await db.insert(stockMovements).values({
      productId: data.productId,
      warehouseId: data.warehouseId,
      movementType: 'adjustment',
      referenceType: 'adjustment',
      referenceNumber: `ADJ-${Date.now()}`,
      quantityBefore,
      quantityChange,
      quantityAfter,
      notes: `${data.reason}${data.notes ? `: ${data.notes}` : ''}`,
    }).returning()

    // NEW: Handle Rejected Warehouse Transfer
    // If reason is destructive (Damaged, Expired) AND stock was reduced, move it to Rejected Warehouse
    const destructiveReasons = ['Damaged Goods', 'Expired']
    const isDestructive = destructiveReasons.some(r => data.reason.includes(r))
    
    if (isDestructive && quantityChange < 0) {
      // Find Rejected Warehouse
      const rejectedWh = await db.query.warehouses.findFirst({
        where: eq(warehouses.type, 'rejected')
      })

      if (rejectedWh && rejectedWh.id !== data.warehouseId) {
        const qtyToTransfer = Math.abs(quantityChange)
        
        // 1. Get/Create Stock in Rejected WH
        let rejectedStock = await db.query.productStock.findFirst({
          where: and(
            eq(productStock.productId, data.productId),
            eq(productStock.warehouseId, rejectedWh.id)
          )
        })

        if (rejectedStock) {
          await db.update(productStock)
            .set({ quantity: rejectedStock.quantity + qtyToTransfer, updatedAt: new Date() })
            .where(eq(productStock.id, rejectedStock.id))
        } else {
          await db.insert(productStock).values({
            productId: data.productId,
            warehouseId: rejectedWh.id,
            quantity: qtyToTransfer,
          })
        }

        // 2. Record Movement for Rejected WH
        await db.insert(stockMovements).values({
          productId: data.productId,
          warehouseId: rejectedWh.id,
          movementType: 'in',
          referenceType: 'transfer',
          referenceNumber: movement!.referenceNumber, // Link with same ref number
          quantityBefore: rejectedStock?.quantity || 0,
          quantityChange: qtyToTransfer,
          quantityAfter: (rejectedStock?.quantity || 0) + qtyToTransfer,
          notes: `Transferred from Main WH (${data.reason})`,
        })
      }
    }

    return c.json({
      stock: currentStock,
      movement,
      message: 'Stock adjusted successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    console.error('Stock adjustment error:', error)
    return c.json({ error: 'Failed to adjust stock' }, 500)
  }
})


// Batch stock adjustment
stockRoutes.post('/adjust/batch', async (c) => {
  try {
    const body = await c.req.json()
    const adjustments = z.array(stockAdjustmentSchema).parse(body)

    if (adjustments.length === 0) {
      return c.json({ message: 'No adjustments provided' })
    }

    const results = await db.transaction(async (tx) => {
      const processed = []

      for (const data of adjustments) {
        // Get current stock
        let currentStock = await tx.query.productStock.findFirst({
          where: and(
            eq(productStock.productId, data.productId),
            eq(productStock.warehouseId, data.warehouseId)
          ),
          with: {
            warehouse: true
          }
        })

        const quantityBefore = currentStock?.quantity || 0
        let quantityAfter: number = 0
        let quantityChange: number = 0

        switch (data.adjustmentType) {
          case 'add':
            quantityAfter = quantityBefore + data.quantity
            quantityChange = data.quantity
            break
          case 'subtract':
            quantityAfter = Math.max(0, quantityBefore - data.quantity)
            quantityChange = -Math.min(data.quantity, quantityBefore)
            break
          case 'set':
            quantityAfter = data.quantity
            quantityChange = data.quantity - quantityBefore
            break
        }

        // Update or create stock record
        if (currentStock) {
          await tx
            .update(productStock)
            .set({ quantity: quantityAfter, updatedAt: new Date() })
            .where(eq(productStock.id, currentStock.id))
        } else {
          const [newStock] = await tx.insert(productStock).values({
            productId: data.productId,
            warehouseId: data.warehouseId,
            quantity: quantityAfter,
          }).returning()
          // Re-fetch with relations if needed, but for now just use the basic object
          currentStock = { ...newStock, warehouse: undefined } as any
        }

        // Record the movement
        const [movement] = await tx.insert(stockMovements).values({
          productId: data.productId,
          warehouseId: data.warehouseId,
          movementType: 'adjustment',
          referenceType: 'adjustment',
          referenceNumber: `ADJ-BATCH-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          quantityBefore,
          quantityChange,
          quantityAfter,
          notes: `${data.reason}${data.notes ? `: ${data.notes}` : ''}`,
        }).returning()

        // Handle Rejected Warehouse Transfer
        const destructiveReasons = ['Damaged Goods', 'Expired']
        const isDestructive = destructiveReasons.some(r => data.reason.includes(r))
        
        if (isDestructive && quantityChange < 0) {
          const rejectedWh = await tx.query.warehouses.findFirst({
            where: eq(warehouses.type, 'rejected')
          })

          if (rejectedWh && rejectedWh.id !== data.warehouseId) {
            const qtyToTransfer = Math.abs(quantityChange)
            
            let rejectedStock = await tx.query.productStock.findFirst({
              where: and(
                eq(productStock.productId, data.productId),
                eq(productStock.warehouseId, rejectedWh.id)
              )
            })

            if (rejectedStock) {
              await tx.update(productStock)
                .set({ quantity: rejectedStock.quantity + qtyToTransfer, updatedAt: new Date() })
                .where(eq(productStock.id, rejectedStock.id))
            } else {
              await tx.insert(productStock).values({
                productId: data.productId,
                warehouseId: rejectedWh.id,
                quantity: qtyToTransfer,
              })
            }

            await tx.insert(stockMovements).values({
              productId: data.productId,
              warehouseId: rejectedWh.id,
              movementType: 'in',
              referenceType: 'transfer',
              referenceNumber: movement!.referenceNumber,
              quantityBefore: rejectedStock?.quantity || 0,
              quantityChange: qtyToTransfer,
              quantityAfter: (rejectedStock?.quantity || 0) + qtyToTransfer,
              notes: `Transferred from Main WH (${data.reason})`,
            })
          }
        }
        
        processed.push({ productId: data.productId, status: 'success' })
      }
      return processed
    })

    return c.json({
      message: `Successfully processed ${results.length} adjustments`,
      results
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    console.error('Batch stock adjustment error:', error)
    return c.json({ error: 'Failed to process batch adjustments' }, 500)
  }
})

// Get recent adjustments
stockRoutes.get('/adjustments', async (c) => {
  try {
    const limit = Number(c.req.query('limit') || 20)
    const productId = c.req.query('productId')
    const warehouseId = c.req.query('warehouseId')

    const conditions = [eq(stockMovements.movementType, 'adjustment')]
    if (productId) {
      conditions.push(eq(stockMovements.productId, productId))
    }
    if (warehouseId) {
      conditions.push(eq(stockMovements.warehouseId, warehouseId))
    }

    const adjustments = await db.query.stockMovements.findMany({
      where: and(...conditions),
      with: {
        product: true,
        warehouse: true,
      },
      limit,
      orderBy: [desc(stockMovements.createdAt)],
    })

    return c.json(adjustments)
  } catch (error) {
    console.error('Get adjustments error:', error)
    return c.json({ error: 'Failed to get adjustments' }, 500)
  }
})

// Stock transfer schema
const stockTransferSchema = z.object({
  productId: z.string().uuid(),
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
})

// Transfer stock between warehouses
stockRoutes.post('/transfer', async (c) => {
  try {
    const body = await c.req.json()
    const data = stockTransferSchema.parse(body)

    if (data.fromWarehouseId === data.toWarehouseId) {
      return c.json({ error: 'Cannot transfer to same warehouse' }, 400)
    }

    const result = await db.transaction(async (tx) => {
      // Get source stock
      const sourceStock = await tx.query.productStock.findFirst({
        where: and(
          eq(productStock.productId, data.productId),
          eq(productStock.warehouseId, data.fromWarehouseId)
        ),
        with: { warehouse: true }
      })

      if (!sourceStock || sourceStock.quantity < data.quantity) {
        throw new Error('Insufficient stock in source warehouse')
      }

      // Get destination stock
      let destStock = await tx.query.productStock.findFirst({
        where: and(
          eq(productStock.productId, data.productId),
          eq(productStock.warehouseId, data.toWarehouseId)
        ),
        with: { warehouse: true }
      })

      const transferRef = `TRF-${Date.now()}`
      const sourceQtyBefore = sourceStock.quantity
      const sourceQtyAfter = sourceStock.quantity - data.quantity
      const destQtyBefore = destStock?.quantity || 0
      const destQtyAfter = destQtyBefore + data.quantity

      // Update source warehouse stock
      await tx
        .update(productStock)
        .set({ quantity: sourceQtyAfter, updatedAt: new Date() })
        .where(eq(productStock.id, sourceStock.id))

      // Update or create destination warehouse stock
      if (destStock) {
        await tx
          .update(productStock)
          .set({ quantity: destQtyAfter, updatedAt: new Date() })
          .where(eq(productStock.id, destStock.id))
      } else {
        await tx.insert(productStock).values({
          productId: data.productId,
          warehouseId: data.toWarehouseId,
          quantity: data.quantity,
        })
      }

      // Record OUT movement from source
      await tx.insert(stockMovements).values({
        productId: data.productId,
        warehouseId: data.fromWarehouseId,
        movementType: 'out',
        referenceType: 'transfer',
        referenceNumber: transferRef,
        quantityBefore: sourceQtyBefore,
        quantityChange: -data.quantity,
        quantityAfter: sourceQtyAfter,
        notes: data.notes || `Transfer to ${destStock?.warehouse?.name || 'destination'}`,
      })

      // Record IN movement to destination
      await tx.insert(stockMovements).values({
        productId: data.productId,
        warehouseId: data.toWarehouseId,
        movementType: 'in',
        referenceType: 'transfer',
        referenceNumber: transferRef,
        quantityBefore: destQtyBefore,
        quantityChange: data.quantity,
        quantityAfter: destQtyAfter,
        notes: data.notes || `Transfer from ${sourceStock.warehouse?.name || 'source'}`,
      })

      return { transferRef, sourceQtyAfter, destQtyAfter }
    })

    return c.json({
      message: 'Stock transferred successfully',
      ...result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400)
    }
    console.error('Stock transfer error:', error)
    return c.json({ error: 'Failed to transfer stock' }, 500)
  }
})

export { stockRoutes }
