import { Hono } from 'hono'
import { db } from '../db'
import { categories, products } from '../db/schema'
import { eq, isNull, sql, desc } from 'drizzle-orm'
import { z } from 'zod'

const categoriesRoutes = new Hono()

// Category schema
const categorySchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
})

// List categories
categoriesRoutes.get('/', async (c) => {
  try {
    const flat = c.req.query('flat') === 'true'

    if (flat) {
      // Return flat list
      const result = await db.query.categories.findMany({
        orderBy: [desc(categories.createdAt)],
      })
      return c.json(result)
    }

    // Return with product counts
    const result = await db.query.categories.findMany({
      with: {
        parent: true,
        subcategories: true,
        products: true,
      },
      orderBy: [desc(categories.createdAt)],
    })

    return c.json(
      result.map((cat) => ({
        ...cat,
        productCount: cat.products.length,
        subcategoryCount: cat.subcategories.length,
        parentName: cat.parent?.name,
      }))
    )
  } catch (error) {
    console.error('Get categories error:', error)
    return c.json({ error: 'Failed to get categories' }, 500)
  }
})

// Get single category
categoriesRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        parent: true,
        subcategories: true,
      },
    })

    if (!category) {
      return c.json({ error: 'Category not found' }, 404)
    }

    return c.json(category)
  } catch (error) {
    console.error('Get category error:', error)
    return c.json({ error: 'Failed to get category' }, 500)
  }
})

// Create category
categoriesRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const data = categorySchema.parse(body)

    // Check if code exists
    const existing = await db.query.categories.findFirst({
      where: eq(categories.code, data.code),
    })

    if (existing) {
      return c.json({ error: 'Category code already exists' }, 400)
    }

    const [newCategory] = await db.insert(categories).values(data).returning()

    return c.json(newCategory, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    console.error('Create category error:', error)
    return c.json({ error: 'Failed to create category' }, 500)
  }
})

// Update category
categoriesRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const data = categorySchema.partial().parse(body)

    const [updated] = await db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning()

    if (!updated) {
      return c.json({ error: 'Category not found' }, 404)
    }

    return c.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.issues }, 400)
    }
    console.error('Update category error:', error)
    return c.json({ error: 'Failed to update category' }, 500)
  }
})

// Delete category
categoriesRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Check if has products
    const productCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, id))

    if (Number(productCount[0]?.count ?? 0) > 0) {
      return c.json({ error: 'Cannot delete category with products' }, 400)
    }

    // Check if has subcategories
    const subcatCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(eq(categories.parentId, id))

    if (Number(subcatCount[0]?.count ?? 0) > 0) {
      return c.json({ error: 'Cannot delete category with subcategories' }, 400)
    }

    const [deleted] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning()

    if (!deleted) {
      return c.json({ error: 'Category not found' }, 404)
    }

    return c.json({ message: 'Category deleted' })
  } catch (error) {
    console.error('Delete category error:', error)
    return c.json({ error: 'Failed to delete category' }, 500)
  }
})

export { categoriesRoutes }
