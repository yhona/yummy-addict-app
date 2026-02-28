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
import { opnameRoutes } from './routes/opname'
import { shippingRoutes } from './routes/shipping'
import { expensesRoutes } from './routes/expenses'
import { couriersRoutes } from './routes/couriers'
import { receivablesRoutes } from './routes/receivables'
import { authMiddleware, jwtMiddleware } from './middleware/auth'
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

// Protected API Routes
const protectedApi = new Hono()
protectedApi.use('*', jwtMiddleware, authMiddleware)

protectedApi.route('/products', productsRoutes)
protectedApi.route('/categories', categoriesRoutes)
protectedApi.route('/units', unitsRoutes)
protectedApi.route('/warehouses', warehousesRoutes)
protectedApi.route('/stock', stockRoutes)
protectedApi.route('/movements', movementsRoutes)
protectedApi.route('/transactions', transactionsRoutes)
protectedApi.route('/suppliers', suppliersRoutes)
protectedApi.route('/purchases', purchasesRoutes)
protectedApi.route('/customers', customersRoutes)
protectedApi.route('/shifts', shiftsRoutes)
protectedApi.route('/analytics', analyticsRoutes)
protectedApi.route('/reports', reportsRoutes)
protectedApi.route('/returns', returnsRoutes)
protectedApi.route('/upload', uploadRoutes)
protectedApi.route('/orders', ordersRoutes)
protectedApi.route('/mcp', mcpRoutes)
protectedApi.route('/chat', chatRoutes)
protectedApi.route('/couriers', couriersRoutes)
protectedApi.route('/opname', opnameRoutes)
protectedApi.route('/shipping', shippingRoutes)
protectedApi.route('/expenses', expensesRoutes)
protectedApi.route('/receivables', receivablesRoutes)

api.route('/', protectedApi)

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
