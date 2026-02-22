import { Hono } from 'hono'
import { db } from '../db'
import { shifts, transactions } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'

const shiftsRoutes = new Hono()

const openShiftSchema = z.object({
  userId: z.string().uuid(),
  startCash: z.number().min(0),
  notes: z.string().optional(),
})

const closeShiftSchema = z.object({
    endCash: z.number().min(0),
    notes: z.string().optional(),
})

// Check active shift for user
shiftsRoutes.get('/active/:userId', async (c) => {
    try {
        const userId = c.req.param('userId')
        const shift = await db.query.shifts.findFirst({
            where: and(
                eq(shifts.userId, userId),
                eq(shifts.status, 'open')
            ),
            orderBy: [desc(shifts.startTime)]
        })
        return c.json(shift || null)
    } catch (e) {
        return c.json(null)
    }
})

// Open Shift
shiftsRoutes.post('/open', async (c) => {
    try {
        const body = await c.req.json()
        const data = openShiftSchema.parse(body)

        // Check if already open
        const existing = await db.query.shifts.findFirst({
            where: and(
                eq(shifts.userId, data.userId),
                eq(shifts.status, 'open')
            )
        })

        if (existing) {
            return c.json({ error: 'Shift already open', shift: existing }, 400)
        }

        const [newShift] = await db.insert(shifts).values({
            userId: data.userId,
            startCash: String(data.startCash),
            status: 'open',
            notes: data.notes
        }).returning()

        return c.json(newShift, 201)
    } catch (error) {
        if (error instanceof z.ZodError) return c.json({ error: error.issues }, 400)
        console.error("Open shift error", error)
        return c.json({ error: 'Failed to open shift' }, 500)
    }
})

// Close Shift
shiftsRoutes.post('/:id/close', async (c) => {
    try {
        const id = c.req.param('id')
        const body = await c.req.json()
        const data = closeShiftSchema.parse(body)

        const shift = await db.query.shifts.findFirst({ where: eq(shifts.id, id) })
        if (!shift || shift.status !== 'open') {
            return c.json({ error: 'Shift not found or already closed' }, 404)
        }

        // Calculate expected cash
        const shiftTransactions = await db.query.transactions.findMany({
            where: eq(transactions.shiftId, id)
        })

        const cashSales = shiftTransactions
             .filter(t => t.paymentMethod === 'cash' && t.status === 'completed')
             .reduce((sum, t) => sum + Number(t.finalAmount || t.totalAmount), 0)
        
        const expectedCash = Number(shift.startCash) + cashSales

        const [updatedShift] = await db.update(shifts).set({
            endTime: new Date(),
            endCash: String(data.endCash),
            expectedCash: String(expectedCash),
            status: 'closed',
            notes: data.notes ? (shift.notes ? shift.notes + '\n' + data.notes : data.notes) : shift.notes,
            updatedAt: new Date()
        }).where(eq(shifts.id, id)).returning()

        return c.json({
            ...updatedShift,
            summary: {
                startCash: Number(shift.startCash),
                cashSales,
                expectedCash,
                actualCash: data.endCash,
                difference: data.endCash - expectedCash,
                transactionCount: shiftTransactions.length
            }
        })
    } catch (error) {
        if (error instanceof z.ZodError) return c.json({ error: error.issues }, 400)
        console.error("Close shift error", error)
        return c.json({ error: 'Failed to close shift' }, 500)
    }
})

export { shiftsRoutes }
