import { Hono } from 'hono'
import { db } from '../db'
import { products, categories, units, productStock, stockMovements, bundleItems } from '../db/schema'
import { eq, like, and, sql, desc } from 'drizzle-orm'
import { z } from 'zod'

const productsRoutes = new Hono()

// Product schema
const productSchema = z.object({
  sku: z.string().min(1).max(50),
  barcode: z.string().max(50).optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  type: z.enum(['standard', 'bundle']).default('standard'),
  costPrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).optional(),
  image: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  isBulk: z.boolean().default(false),
  conversionRatio: z.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  bundleItems: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).optional(),
})

// List products with pagination and filters
productsRoutes.get('/', async (c) => {
  try {
    const page = Number(c.req.query('page') || 1)
    const limit = Number(c.req.query('limit') || 10)
    const search = c.req.query('search') || ''
    const categoryId = c.req.query('categoryId')
    const type = c.req.query('type')
    const status = c.req.query('status')

    const offset = (page - 1) * limit

    // Build where conditions
    const conditions = []
    if (search) {
      conditions.push(
        sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`})`
      )
    }
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId))
    }
    if (type) {
      conditions.push(eq(products.type, type))
    }
    if (status === 'active') {
      conditions.push(eq(products.isActive, true))
    } else if (status === 'inactive') {
      conditions.push(eq(products.isActive, false))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get products with relations
    const result = await db.query.products.findMany({
      where: whereClause,
      with: {
        category: true,
        variants: true,
        parent: true,
        unit: true,
        bundleItems: {
          with: { product: true }
        },
        stock: {
          with: {
            warehouse: true,
          },
        },
      },
      limit,
      offset,
      orderBy: [desc(products.createdAt)],
    })

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause)

    return c.json({
      data: result.map((p) => ({
        ...p,
        currentStock: p.stock.reduce((sum, s) => sum + s.quantity, 0),
        categoryName: p.category?.name,
        unitName: p.unit?.name,
      })),
      pagination: {
        page,
        limit,
        total: Number(countResult?.count ?? 0),
        totalPages: Math.ceil(Number(countResult?.count ?? 0) / limit),
      },
    })
  } catch (error) {
    console.error('Get products error:', error)
    return c.json({ error: 'Failed to get products' }, 500)
  }
})

// Get single product
productsRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
        unit: true,
        bundleItems: {
          with: { product: true }
        },
        stock: {
          with: {
            warehouse: true,
          },
        },
      },
    })

    if (!product) {
      return c.json({ error: 'Product not found' }, 404)
    }

    return c.json({
      ...product,
      currentStock: product.stock.reduce((sum, s) => sum + s.quantity, 0),
      categoryName: product.category?.name,
      unitName: product.unit?.name,
    })
  } catch (error) {
    console.error('Get product error:', error)
    return c.json({ error: 'Failed to get product' }, 500)
  }
})

// Create product
productsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const data = productSchema.parse(body)

    // Check if SKU exists
    const existing = await db.query.products.findFirst({
      where: eq(products.sku, data.sku),
    })

    if (existing) {
      return c.json({ error: 'SKU already exists' }, 400)
    }

    const newProduct = await db.transaction(async (tx) => {
      // 1. Insert product
      const { bundleItems: itemsToBundle, ...productData } = data
      const [insertedProduct] = await tx.insert(products).values({
        ...productData,
        costPrice: String(productData.costPrice),
        sellingPrice: String(productData.sellingPrice),
        conversionRatio: productData.conversionRatio ? String(productData.conversionRatio) : undefined,
      }).returning()

      // 2. Insert bundle items if type='bundle'
      if (insertedProduct && productData.type === 'bundle' && itemsToBundle && itemsToBundle.length > 0) {
        await tx.insert(bundleItems).values(
          itemsToBundle.map(item => ({
            bundleId: insertedProduct.id,
            productId: item.productId,
            quantity: item.quantity,
          }))
        )
      }

      return insertedProduct
    })

    return c.json(newProduct, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    console.error('Create product error:', error)
    return c.json({ error: 'Failed to create product' }, 500)
  }
})

// Update product
productsRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const data = productSchema.partial().parse(body)

    const updated = await db.transaction(async (tx) => {
      const { bundleItems: itemsToBundle, ...productData } = data
      
      const [updatedProduct] = await tx
        .update(products)
        .set({
          ...productData,
          costPrice: productData.costPrice !== undefined ? String(productData.costPrice) : undefined,
          sellingPrice: productData.sellingPrice !== undefined ? String(productData.sellingPrice) : undefined,
          conversionRatio: productData.conversionRatio !== undefined ? String(productData.conversionRatio) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning()

      if (!updatedProduct) return null

      // Handle bundle items update
      if (updatedProduct.type === 'bundle' && itemsToBundle !== undefined) {
        // Delete all existing bundle items
        await tx.delete(bundleItems).where(eq(bundleItems.bundleId, id))
        
        // Insert new bundle items
        if (itemsToBundle.length > 0) {
          await tx.insert(bundleItems).values(
            itemsToBundle.map(item => ({
              bundleId: id,
              productId: item.productId,
              quantity: item.quantity,
            }))
          )
        }
      }

      return updatedProduct
    })

    if (!updated) {
      return c.json({ error: 'Product not found' }, 404)
    }

    return c.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    console.error('Update product error:', error)
    return c.json({ error: 'Failed to update product' }, 500)
  }
})

// Delete product (Soft Delete)
productsRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const [deleted] = await db
      .update(products)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning()

    if (!deleted) {
      return c.json({ error: 'Product not found' }, 404)
    }

    return c.json({ message: 'Product deactivated successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    return c.json({ error: 'Failed to deactivate product' }, 500)
  }
})

// Break Down Stock (Bulk -> Retail)
productsRoutes.post('/:id/break-down', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  
  const schema = z.object({
    quantity: z.number().min(1), // Number of bulk units to break
    targetVariantId: z.string(), // ID of the retail product to stock up
    warehouseId: z.string().optional(), // Default to first available if not provided
  })

  try {
    const { quantity, targetVariantId, warehouseId } = schema.parse(body)

    await db.transaction(async (tx) => {
      // 1. Get Bulk Product & Stock
      const bulkProduct = await tx.query.products.findFirst({
        where: eq(products.id, id),
        with: {
            stock: true
        }
      })

      if (!bulkProduct) throw new Error('Bulk product not found')
      if (!bulkProduct.isBulk) throw new Error('Product is not a bulk item')

      // Determine warehouse (use provided or first available)
      const targetWarehouseId = warehouseId || bulkProduct.stock[0]?.warehouseId
      if (!targetWarehouseId) throw new Error('No warehouse stock found for this product')

      const currentBulkStock = bulkProduct.stock.find(s => s.warehouseId === targetWarehouseId)
      if (!currentBulkStock || currentBulkStock.quantity < quantity) {
        throw new Error(`Insufficient bulk stock. Available: ${currentBulkStock?.quantity || 0}`)
      }

      // 2. Get Target Variant
      const variantProduct = await tx.query.products.findFirst({
        where: eq(products.id, targetVariantId)
      })

      if (!variantProduct) throw new Error('Target variant not found')
      if (variantProduct.parentId !== id) throw new Error('Target is not a variant of this bulk product')
      
      const ratio = Number(variantProduct.conversionRatio) || 1
      const quantityToAdd = quantity * ratio

      // 3. Deduct Bulk Stock
      await tx
        .update(productStock)
        .set({ 
            quantity: sql`${productStock.quantity} - ${quantity}`,
            updatedAt: new Date()
        })
        .where(and(
            eq(productStock.productId, id),
            eq(productStock.warehouseId, targetWarehouseId)
        ))

      // 4. Record Bulk Movement (OUT)
      await tx.insert(stockMovements).values({
        productId: id,
        warehouseId: targetWarehouseId,
        movementType: 'out',
        referenceType: 'adjustment',
        referenceNumber: `BREAK-${Date.now()}`, // Temporary ref
        quantityBefore: currentBulkStock.quantity,
        quantityChange: -quantity,
        quantityAfter: currentBulkStock.quantity - quantity,
        notes: `Broken down into ${quantityToAdd} units of ${variantProduct.name}`,
      })

      // 5. Add Variant Stock
      const currentVariantStock = await tx.query.productStock.findFirst({
        where: and(
            eq(productStock.productId, targetVariantId),
            eq(productStock.warehouseId, targetWarehouseId)
        )
      })

      if (currentVariantStock) {
        await tx
            .update(productStock)
            .set({ 
                quantity: sql`${productStock.quantity} + ${quantityToAdd}`,
                updatedAt: new Date()
            })
            .where(eq(productStock.id, currentVariantStock.id))
      } else {
        await tx.insert(productStock).values({
            productId: targetVariantId,
            warehouseId: targetWarehouseId,
            quantity: quantityToAdd
        })
      }

      // 6. Record Variant Movement (IN)
      await tx.insert(stockMovements).values({
        productId: targetVariantId,
        warehouseId: targetWarehouseId,
        movementType: 'in',
        referenceType: 'adjustment',
        referenceNumber: `BREAK-${Date.now()}`,
        quantityBefore: currentVariantStock?.quantity || 0,
        quantityChange: quantityToAdd,
        quantityAfter: (currentVariantStock?.quantity || 0) + quantityToAdd,
        notes: `Result of breaking down ${quantity} ${bulkProduct.name}`,
      })
    })

    return c.json({ success: true, message: 'Stock successfully broken down' })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    return c.json({ success: false, error: error.message }, 400)
  }
})

export { productsRoutes }
