import { Hono } from 'hono'
import { db } from '../db'
import { receivables, receivablePayments, customers, users, transactions } from '../db/schema'
import { eq, desc, and, ilike, sql } from 'drizzle-orm'
import { z } from 'zod'

const receivablesRoutes = new Hono()

// Validation Schemas
const createReceivableSchema = z.object({
  customerId: z.string().uuid(),
  transactionId: z.string().uuid().optional(),
  amount: z.number().positive(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().uuid().optional(),
})

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['cash', 'transfer']),
  notes: z.string().optional(),
  receivedBy: z.string().uuid().optional(),
})

// GET /api/receivables
receivablesRoutes.get('/', async (c) => {
  try {
    const page = Number(c.req.query('page') || 1)
    const limit = Number(c.req.query('limit') || 20)
    const offset = (page - 1) * limit
    
    const search = c.req.query('search')
    const status = c.req.query('status')
    const customerId = c.req.query('customerId')

    const conditions = [eq(receivables.isActive, true)]

    if (search) {
      conditions.push(ilike(customers.name, `%${search}%`))
    }
    if (status) {
      conditions.push(eq(receivables.status, status))
    }
    if (customerId) {
      conditions.push(eq(receivables.customerId, customerId))
    }

    const baseQuery = db.select({
        id: receivables.id,
        number: receivables.number,
        transactionId: receivables.transactionId,
        customerId: receivables.customerId,
        amount: receivables.amount,
        remainingAmount: receivables.remainingAmount,
        dueDate: receivables.dueDate,
        status: receivables.status,
        notes: receivables.notes,
        createdAt: receivables.createdAt,
        customerName: customers.name,
      })
      .from(receivables)
      .leftJoin(customers, eq(receivables.customerId, customers.id))
      .where(and(...conditions))

    const [data, [{ count }]] = await Promise.all([
      baseQuery.limit(limit).offset(offset).orderBy(desc(receivables.createdAt)),
      db.select({ count: sql<number>`count(*)` })
        .from(receivables)
        .leftJoin(customers, eq(receivables.customerId, customers.id))
        .where(and(...conditions))
    ])

    return c.json({
      data,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit)
      }
    })
  } catch (error) {
    console.error('List receivables error:', error)
    return c.json({ error: 'Failed to list receivables' }, 500)
  }
})

// GET /api/receivables/:id
receivablesRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const receivable = await db.query.receivables.findFirst({
      where: and(eq(receivables.id, id), eq(receivables.isActive, true)),
      with: {
        customer: true,
        transaction: true,
        payments: {
          with: { receivedByUser: true },
          orderBy: (payments, { desc }) => [desc(payments.paymentDate)]
        }
      }
    })

    if (!receivable) return c.json({ error: 'Receivable not found' }, 404)

    return c.json(receivable)
  } catch (error) {
    console.error('Get receivable error:', error)
    return c.json({ error: 'Failed to get receivable' }, 500)
  }
})

// POST /api/receivables (Create new debt/kasbon)
receivablesRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validation = createReceivableSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation error', details: validation.error.flatten() }, 400)
    }

    const data = validation.data
    const number = `REC-${Date.now()}`

    const [newReceivable] = await db.insert(receivables).values({
      number,
      customerId: data.customerId,
      transactionId: data.transactionId,
      amount: String(data.amount),
      remainingAmount: String(data.amount),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      status: 'unpaid',
      notes: data.notes,
      createdBy: data.createdBy
    }).returning()

    return c.json(newReceivable, 201)
  } catch (error) {
    console.error('Create receivable error:', error)
    return c.json({ error: 'Failed to create receivable' }, 500)
  }
})

// POST /api/receivables/:id/payments (Pay a debt)
receivablesRoutes.post('/:id/payments', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validation = createPaymentSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json({ error: 'Validation error', details: validation.error.flatten() }, 400)
    }

    const data = validation.data

    const result = await db.transaction(async (tx) => {
      const receivable = await tx.query.receivables.findFirst({
        where: eq(receivables.id, id)
      })

      if (!receivable) throw new Error('Receivable not found')
      if (receivable.status === 'paid') throw new Error('Receivable is already fully paid')

      const currentRemaining = Number(receivable.remainingAmount)
      const payAmount = data.amount

      if (payAmount > currentRemaining) {
        throw new Error(`Payment amount exceeds remaining debt. Maximum allowed is: ${currentRemaining}`)
      }

      // Record the payment
      const [newPayment] = await tx.insert(receivablePayments).values({
        receivableId: id,
        amount: String(payAmount),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        receivedBy: data.receivedBy
      }).returning()

      // Calculate new remaining and status
      const newRemaining = currentRemaining - payAmount
      let newStatus = receivable.status
      if (newRemaining <= 0) {
        newStatus = 'paid'
      } else if (newRemaining < Number(receivable.amount)) {
        newStatus = 'partial'
      }

      // Update the receivable record
      const [updatedReceivable] = await tx.update(receivables)
        .set({ 
          remainingAmount: String(newRemaining),
          status: newStatus,
          updatedAt: new Date()
        })
        .where(eq(receivables.id, id))
        .returning()

      // If it's linked to a transaction, and fully paid, update the transaction payment status and overall status
      if (newStatus === 'paid' && receivable.transactionId) {
        await tx.update(transactions)
          .set({ 
            paymentStatus: 'PAID',
            status: 'completed'
          })
          .where(eq(transactions.id, receivable.transactionId))
      }

      return { payment: newPayment, receivable: updatedReceivable }
    })

    return c.json(result, 201)
  } catch (error) {
    console.error('Create payment error:', error)
    if ((error as Error).message?.includes('amount exceeds')) {
      return c.json({ error: (error as Error).message }, 400)
    }
    return c.json({ error: (error as Error).message || 'Failed to process payment' }, 500)
  }
})

// DELETE /api/receivables/:id (Soft delete)
receivablesRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const [deleted] = await db.update(receivables)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(receivables.id, id))
      .returning()
      
    if (!deleted) return c.json({ error: 'Receivable not found' }, 404)
    
    return c.json({ message: 'Receivable deleted successfully' })
  } catch (error) {
    console.error('Delete receivable error:', error)
    return c.json({ error: 'Failed to delete receivable' }, 500)
  }
})

export { receivablesRoutes }
