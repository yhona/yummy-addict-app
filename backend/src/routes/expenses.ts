import { Hono } from 'hono'
import { db } from '../db'
import { expenses, expenseCategories, users } from '../db/schema'
import { eq, and, sql, desc, ilike, gte, lte, or, SQL } from 'drizzle-orm'
import { z } from 'zod'

const expensesRoutes = new Hono()

// ── Validation Schemas ──────────────────────────

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
})

const createExpenseSchema = z.object({
  date: z.string().datetime().or(z.string().refine((val) => !isNaN(Date.parse(val)))),
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  title: z.string().min(1).max(255),
  notes: z.string().optional(),
  paymentMethod: z.enum(['cash', 'transfer', 'credit']),
  receiptUrl: z.string().url().optional(),
})

const updateExpenseSchema = z.object({
  date: z.string().datetime().or(z.string().refine((val) => !isNaN(Date.parse(val)))).optional(),
  categoryId: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  title: z.string().min(1).max(255).optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['cash', 'transfer', 'credit']).optional(),
  receiptUrl: z.string().url().optional(),
})


// ── Helper: Generate Expense Number ──────────────

function generateExpenseNumber(): string {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timePart = String(now.getTime()).slice(-4)
  return `EXP-${datePart}-${timePart}`
}


// ──────────────────────────────────────────────
// Categories Endpoints
// ──────────────────────────────────────────────

expensesRoutes.get('/categories', async (c) => {
  try {
    const categories = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.isActive, true))
      .orderBy(expenseCategories.name)

    return c.json(categories)
  } catch (error) {
    console.error('List expense categories error:', error)
    return c.json({ message: 'Failed to list expense categories' }, 500)
  }
})

expensesRoutes.post('/categories', async (c) => {
  try {
    const body = await c.req.json()
    const data = createCategorySchema.parse(body)

    const [category] = await db.insert(expenseCategories).values(data).returning()

    return c.json(category, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ message: 'Validation error', details: error.issues }, 400)
    }
    console.error('Create expense category error:', error)
    return c.json({ message: 'Failed to create expense category' }, 500)
  }
})

expensesRoutes.put('/categories/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const data = updateCategorySchema.parse(body)

    const existingCategory = await db.query.expenseCategories.findFirst({
      where: and(eq(expenseCategories.id, id), eq(expenseCategories.isActive, true)),
    })

    if (!existingCategory) {
      return c.json({ message: 'Expense category not found' }, 404)
    }

    const [category] = await db
      .update(expenseCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(expenseCategories.id, id))
      .returning()

    return c.json(category)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ message: 'Validation error', details: error.issues }, 400)
    }
    console.error('Update expense category error:', error)
    return c.json({ message: 'Failed to update expense category' }, 500)
  }
})

expensesRoutes.delete('/categories/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Check if category has active expenses
    const categoryExpenses = await db.query.expenses.findMany({
      where: and(eq(expenses.categoryId, id), eq(expenses.isActive, true)),
      limit: 1,
    })

    if (categoryExpenses.length > 0) {
      return c.json({ message: 'Cannot delete category that is used in active expenses' }, 400)
    }

    const [category] = await db
      .update(expenseCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(expenseCategories.id, id))
      .returning()

    if (!category) {
      return c.json({ message: 'Expense category not found' }, 404)
    }

    return c.json({ message: 'Expense category deleted successfully' })
  } catch (error) {
    console.error('Delete expense category error:', error)
    return c.json({ message: 'Failed to delete expense category' }, 500)
  }
})

// ──────────────────────────────────────────────
// Expenses Endpoints
// ──────────────────────────────────────────────

expensesRoutes.get('/', async (c) => {
  try {
    const { page = '1', limit = '10', categoryId, startDate, endDate, search } = c.req.query()

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
    const offset = (pageNum - 1) * limitNum

    const conditions: SQL[] = [eq(expenses.isActive, true)]

    if (categoryId) conditions.push(eq(expenses.categoryId, categoryId))
    if (startDate) conditions.push(gte(expenses.date, new Date(startDate)))
    if (endDate) conditions.push(lte(expenses.date, new Date(endDate)))
    
    if (search) {
      conditions.push(
        or(
          ilike(expenses.title, `%${search}%`),
          ilike(expenses.number, `%${search}%`)
        )!
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const results = await db
      .select({
        id: expenses.id,
        number: expenses.number,
        date: expenses.date,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        amount: expenses.amount,
        title: expenses.title,
        notes: expenses.notes,
        paymentMethod: expenses.paymentMethod,
        receiptUrl: expenses.receiptUrl,
        createdBy: expenses.createdBy,
        isActive: expenses.isActive,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(whereClause)
      .orderBy(desc(expenses.date), desc(expenses.createdAt))
      .limit(limitNum)
      .offset(offset)

    const [countResult] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(expenses)
      .where(whereClause)

    const total = countResult?.total || 0

    return c.json({
      data: results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error('List expenses error:', error)
    return c.json({ message: 'Failed to list expenses' }, 500)
  }
})

expensesRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const result = await db
      .select({
        id: expenses.id,
        number: expenses.number,
        date: expenses.date,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        amount: expenses.amount,
        title: expenses.title,
        notes: expenses.notes,
        paymentMethod: expenses.paymentMethod,
        receiptUrl: expenses.receiptUrl,
        createdBy: expenses.createdBy,
        isActive: expenses.isActive,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(and(eq(expenses.id, id), eq(expenses.isActive, true)))
      .limit(1)

    if (result.length === 0) {
      return c.json({ message: 'Expense not found' }, 404)
    }

    return c.json(result[0])
  } catch (error) {
    console.error('Get expense detail error:', error)
    return c.json({ message: 'Failed to get expense detail' }, 500)
  }
})

expensesRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const data = createExpenseSchema.parse(body)

    // TODO: Get real user ID from auth context once implemented properly
    // For now we'll allow null since createdBy is optional in schema

    const [expense] = await db
      .insert(expenses)
      .values({
        number: generateExpenseNumber(),
        date: new Date(data.date),
        categoryId: data.categoryId,
        amount: data.amount.toString(),
        title: data.title,
        notes: data.notes || null,
        paymentMethod: data.paymentMethod,
        receiptUrl: data.receiptUrl || null,
      })
      .returning()

    return c.json(expense, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ message: 'Validation error', details: error.issues }, 400)
    }
    console.error('Create expense error:', error)
    return c.json({ message: 'Failed to create expense' }, 500)
  }
})

expensesRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const data = updateExpenseSchema.parse(body)

    const existingExpense = await db.query.expenses.findFirst({
      where: and(eq(expenses.id, id), eq(expenses.isActive, true)),
    })

    if (!existingExpense) {
      return c.json({ message: 'Expense not found' }, 404)
    }

    const updates: any = {
      updatedAt: new Date()
    }

    if (data.date) updates.date = new Date(data.date)
    if (data.categoryId) updates.categoryId = data.categoryId
    if (data.amount !== undefined) updates.amount = data.amount.toString()
    if (data.title) updates.title = data.title
    if (data.notes !== undefined) updates.notes = data.notes || null
    if (data.paymentMethod) updates.paymentMethod = data.paymentMethod
    if (data.receiptUrl !== undefined) updates.receiptUrl = data.receiptUrl || null

    const [expense] = await db
      .update(expenses)
      .set(updates)
      .where(eq(expenses.id, id))
      .returning()

    return c.json(expense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ message: 'Validation error', details: error.issues }, 400)
    }
    console.error('Update expense error:', error)
    return c.json({ message: 'Failed to update expense' }, 500)
  }
})

expensesRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const [expense] = await db
      .update(expenses)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning()

    if (!expense) {
      return c.json({ message: 'Expense not found' }, 404)
    }

    return c.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Delete expense error:', error)
    return c.json({ message: 'Failed to delete expense' }, 500)
  }
})

export { expensesRoutes }
