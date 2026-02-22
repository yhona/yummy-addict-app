import { Hono } from 'hono'
import { db } from '../db'
import { transactions, products, productStock, customers } from '../db/schema'
import { eq, sql, sum, count, desc, and, gte } from 'drizzle-orm'

const analyticsRoutes = new Hono()

analyticsRoutes.get('/dashboard', async (c) => {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Parallel queries
        const [salesResult, txCountResult, customerCountResult, pendingOrdersResult] = await Promise.all([
            db.select({ total: sum(transactions.finalAmount) })
              .from(transactions)
              .where(gte(transactions.date, today)),
            
            db.select({ count: count() })
              .from(transactions)
              .where(gte(transactions.date, today)),
            
            db.select({ count: count() })
              .from(customers),

            db.select({ count: count() })
              .from(require('../db/schema').orders) // Using require to avoid top-level import cycle if any, or just import it at top
              .where(eq(require('../db/schema').orders.status, 'pending'))
        ])

        // Low stock calculation (Global stock vs Min stock)
        // Fetch all products that track inventory
        const allProducts = await db.query.products.findMany({
            with: {
                stock: true
            }
        })
        
        
        let lowStockCount = 0
        const lowStockItems = []
        
        for (const p of allProducts) {
            const totalStock = p.stock.reduce((acc, s) => acc + s.quantity, 0)
            if (totalStock <= p.minStock) {
                lowStockCount++
                if (lowStockItems.length < 5) {
                    lowStockItems.push({
                        id: p.id,
                        name: p.name,
                        sku: p.sku,
                        currentStock: totalStock,
                        minStock: p.minStock,
                        image: p.image
                    })
                }
            }
        }

        // Recent Transactions
        const recentTransactions = await db.query.transactions.findMany({
            limit: 5,
            orderBy: [desc(transactions.date)],
            with: {
                cashier: true,
                customer: true
            }
        })

        return c.json({
            stats: {
                salesToday: Number(salesResult[0]?.total || 0),
                transactionsToday: Number(txCountResult[0]?.count || 0),
                totalCustomers: Number(customerCountResult[0]?.count || 0),
                pendingOrdersCount: Number(pendingOrdersResult[0]?.count || 0),
                lowStockCount
            },
            recentTransactions,
            lowStockItems
        })
    } catch (error) {
        console.error("Dashboard stats error", error)
        return c.json({ error: 'Failed to fetch dashboard stats' }, 500)
    }
})

analyticsRoutes.get('/chart', async (c) => {
    try {
        // Return last 30 days sales
        const range = new Date()
        range.setDate(range.getDate() - 30)
        
        // Postgres date truncation
        const results = await db.select({
            date: sql<string>`to_char(${transactions.date}, 'YYYY-MM-DD')`,
            total: sum(transactions.finalAmount)
        })
        .from(transactions)
        .where(gte(transactions.date, range))
        .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${transactions.date}, 'YYYY-MM-DD')`)

        return c.json(results)
    } catch (error) {
        console.error("Chart data error", error)
        return c.json({ error: 'Failed to fetch chart data' }, 500)
    }
})

export { analyticsRoutes }
