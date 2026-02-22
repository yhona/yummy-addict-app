import { Hono } from 'hono'
import { db } from '../db'
import { customers, transactions, transactionItems, products } from '../db/schema'
import { eq, desc, like, or, and, sql } from 'drizzle-orm'
import { z } from 'zod'

const customersRoutes = new Hono()

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
})

// List customers
customersRoutes.get('/', async (c) => {
    try {
        const search = c.req.query('search') || ''
        const limit = Number(c.req.query('limit')) || 20
        
        const where = search ? or(
            like(customers.name, `%${search}%`),
            like(customers.phone, `%${search}%`),
            like(customers.email, `%${search}%`)
        ) : undefined

        const data = await db.query.customers.findMany({
            where: where ? and(where, eq(customers.isActive, true)) : eq(customers.isActive, true),
            orderBy: [desc(customers.createdAt)],
            limit
        })
        return c.json({ data })
    } catch (e) {
        return c.json({ error: "Failed to fetch customers" }, 500)
    }
})

// Get customer by ID with stats
customersRoutes.get('/:id', async (c) => {
    const id = c.req.param('id')
    
    try {
        const customer = await db.query.customers.findFirst({
            where: eq(customers.id, id)
        })
        
        if (!customer) {
            return c.json({ error: 'Customer not found' }, 404)
        }
        
        // Get stats
        const [stats] = await db.select({
            totalSpent: sql<string>`COALESCE(SUM(${transactions.finalAmount}), 0)`,
            orderCount: sql<number>`COUNT(*)`,
            avgOrder: sql<string>`COALESCE(AVG(${transactions.finalAmount}), 0)`,
            lastPurchase: sql<string>`MAX(${transactions.date})`,
        })
        .from(transactions)
        .where(and(
            eq(transactions.customerId, id),
            eq(transactions.status, 'completed')
        ))
        
        return c.json({
            ...customer,
            stats: {
                totalSpent: Number(stats?.totalSpent ?? 0),
                orderCount: stats?.orderCount ?? 0,
                avgOrder: Number(stats?.avgOrder ?? 0),
                lastPurchase: stats?.lastPurchase ?? null,
            }
        })
    } catch (e) {
        console.error('Customer detail error:', e)
        return c.json({ error: 'Failed to fetch customer' }, 500)
    }
})

// Get customer transactions
customersRoutes.get('/:id/transactions', async (c) => {
    const id = c.req.param('id')
    const limit = Number(c.req.query('limit')) || 20
    const offset = Number(c.req.query('offset')) || 0
    
    try {
        const data = await db.query.transactions.findMany({
            where: eq(transactions.customerId, id),
            orderBy: [desc(transactions.date)],
            limit,
            offset,
            with: {
                items: {
                    with: { product: true }
                },
                cashier: true
            }
        })
        
        return c.json({ data })
    } catch (e) {
        return c.json({ error: 'Failed to fetch transactions' }, 500)
    }
})

// Create customer
customersRoutes.post('/', async (c) => {
    try {
        const body = await c.req.json()
        const result = schema.safeParse(body)
        if (!result.success) return c.json({ error: "Validation failed", details: result.error.flatten() }, 400)
        
        const [newItem] = await db.insert(customers).values(result.data).returning()
        return c.json(newItem, 201)
    } catch (e) {
        return c.json({ error: "Failed to create customer" }, 500)
    }
})

// Update customer
customersRoutes.put('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    const result = schema.safeParse(body)
    if (!result.success) return c.json({ error: result.error }, 400)
    
    const [updated] = await db.update(customers)
        .set({...result.data, updatedAt: new Date()})
        .where(eq(customers.id, id))
        .returning()
    
    return c.json(updated)
})

// Soft delete customer
customersRoutes.delete('/:id', async (c) => {
    const id = c.req.param('id')
    
    try {
        const [deleted] = await db.update(customers)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(customers.id, id))
            .returning()
        
        if (!deleted) {
            return c.json({ error: 'Customer not found' }, 404)
        }
        
        return c.json({ message: 'Customer deleted', id: deleted.id })
    } catch (e) {
        return c.json({ error: 'Failed to delete customer' }, 500)
    }
})

export { customersRoutes }

