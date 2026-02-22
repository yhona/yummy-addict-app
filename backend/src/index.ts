import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth'
import { productsRoutes } from './routes/products'
import { categoriesRoutes } from './routes/categories'
import { unitsRoutes } from './routes/units'
import { warehousesRoutes } from './routes/warehouses'
import { stockRoutes } from './routes/stock'
import { movementsRoutes } from './routes/movements'
import { transactionsRoutes } from './routes/transactions'
import { suppliersRoutes } from './routes/suppliers'
import { purchasesRoutes } from './routes/purchases'
import { customersRoutes } from './routes/customers'
import { shiftsRoutes } from './routes/shifts'
import { analyticsRoutes } from './routes/analytics'
import { reportsRoutes } from './routes/reports'
import { returnsRoutes } from './routes/returns'
import { uploadRoutes } from './routes/upload'
import { ordersRoutes } from './routes/orders'
import { mcpRoutes } from './routes/mcp'
import { chatRoutes } from './routes/chat'
import { couriersRoutes } from './routes/couriers'
import { opnameRoutes } from './routes/opname'
import { serveStatic } from 'hono/bun'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true,
}))

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// API Routes
const api = new Hono()
api.route('/auth', authRoutes)
api.route('/products', productsRoutes)
api.route('/categories', categoriesRoutes)
api.route('/units', unitsRoutes)
api.route('/warehouses', warehousesRoutes)
api.route('/stock', stockRoutes)
api.route('/movements', movementsRoutes)
api.route('/transactions', transactionsRoutes)
api.route('/suppliers', suppliersRoutes)
api.route('/purchases', purchasesRoutes)
api.route('/customers', customersRoutes)
api.route('/shifts', shiftsRoutes)
api.route('/analytics', analyticsRoutes)
api.route('/reports', reportsRoutes)
api.route('/returns', returnsRoutes)
api.route('/upload', uploadRoutes)
api.route('/orders', ordersRoutes)
api.route('/mcp', mcpRoutes)
api.route('/chat', chatRoutes)
api.route('/couriers', couriersRoutes)
api.route('/opname', opnameRoutes)

app.route('/api', api)

// Static files
app.use('/uploads/*', serveStatic({ root: './' }))

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = process.env.PORT || 3001
console.log(`🚀 Server running at http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
