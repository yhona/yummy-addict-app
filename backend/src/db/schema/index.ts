import { pgTable, varchar, text, boolean, timestamp, uuid, integer, decimal } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('staff'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'subcategories',
  }),
  subcategories: many(categories, { relationName: 'subcategories' }),
  products: many(products),
}))

// Units table
export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const unitsRelations = relations(units, ({ many }) => ({
  products: many(products),
}))

// Warehouses table
export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull().default('sellable'), // sellable, rejected
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  productStock: many(productStock),
}))

// Products table
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: varchar('sku', { length: 50 }).notNull().unique(),
  barcode: varchar('barcode', { length: 50 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id),
  unitId: uuid('unit_id').references(() => units.id),
  parentId: uuid('parent_id'), // Link to bulk/parent product
  conversionRatio: decimal('conversion_ratio', { precision: 10, scale: 4 }).default('1'), // e.g., 0.1 means this product = 0.1 of parent unit
  isBulk: boolean('is_bulk').notNull().default(false), // Flag for bulk products
  costPrice: decimal('cost_price', { precision: 15, scale: 2 }).notNull().default('0'),
  sellingPrice: decimal('selling_price', { precision: 15, scale: 2 }).notNull().default('0'),
  minStock: integer('min_stock').notNull().default(0),
  maxStock: integer('max_stock'),
  image: varchar('image', { length: 500 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  unit: one(units, {
    fields: [products.unitId],
    references: [units.id],
  }),
  stock: many(productStock),
  parent: one(products, {
    fields: [products.parentId],
    references: [products.id],
    relationName: 'product_variants',
  }),
  variants: many(products, {
    relationName: 'product_variants',
  }),
}))

// Product Stock per Warehouse
export const productStock = pgTable('product_stock', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id),
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id),
  quantity: integer('quantity').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const productStockRelations = relations(productStock, ({ one }) => ({
  product: one(products, {
    fields: [productStock.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [productStock.warehouseId],
    references: [warehouses.id],
  }),
}))

// Stock Movements
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id),
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id),
  movementType: varchar('movement_type', { length: 20 }).notNull(), // in, out, adjustment
  referenceType: varchar('reference_type', { length: 20 }).notNull(), // purchase, sale, adjustment, transfer
  referenceId: uuid('reference_id'),
  referenceNumber: varchar('reference_number', { length: 50 }),
  quantityBefore: integer('quantity_before').notNull(),
  quantityChange: integer('quantity_change').notNull(),
  quantityAfter: integer('quantity_after').notNull(),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [stockMovements.warehouseId],
    references: [warehouses.id],
  }),
  createdByUser: one(users, {
    fields: [stockMovements.createdBy],
    references: [users.id],
  }),
}))


// Customers table
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: varchar('number', { length: 50 }).notNull().unique(), // e.g. TR-20240101-0001
  date: timestamp('date').notNull().defaultNow(),
  cashierId: uuid('cashier_id').references(() => users.id),
  shiftId: uuid('shift_id').references(() => shifts.id),
  customerId: uuid('customer_id').references(() => customers.id),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  discountAmount: decimal('discount_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  finalAmount: decimal('final_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(), // cash, qris, card
  cashAmount: decimal('cash_amount', { precision: 15, scale: 2 }).default('0'), // Uang diterima
  changeAmount: decimal('change_amount', { precision: 15, scale: 2 }).default('0'), // Kembalian
  
  // Shipping Details
  shippingCost: decimal('shipping_cost', { precision: 15, scale: 2 }).default('0'),
  deliveryMethod: varchar('delivery_method', { length: 20 }).default('pickup'), // pickup, delivery
  courierName: varchar('courier_name', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),

  // Receivables (Piutang) Tracking
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('PAID'), // PAID, UNPAID, PARTIAL
  dueDate: timestamp('due_date'), // Tanggal jatuh tempo

  status: varchar('status', { length: 20 }).notNull().default('completed'), // completed, cancelled
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const transactionRelations = relations(transactions, ({ one, many }) => ({
  cashier: one(users, {
    fields: [transactions.cashierId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
  shift: one(shifts, {
    fields: [transactions.shiftId],
    references: [shifts.id],
  }),
  items: many(transactionItems),
}))

export const customersRelations = relations(customers, ({ many }) => ({
  transactions: many(transactions),
}))

// Transaction Items table
export const transactionItems = pgTable('transaction_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').notNull().references(() => transactions.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 15, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 15, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
})

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  product: one(products, {
    fields: [transactionItems.productId],
    references: [products.id],
  }),
}))

// Suppliers
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  contactPerson: varchar('contact_person', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
}))

// Couriers
export const couriers = pgTable('couriers', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  defaultCost: decimal('default_cost', { precision: 15, scale: 2 }).default('0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Purchases
export const purchases = pgTable('purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: varchar('number', { length: 50 }).notNull().unique(), // PO-2024...
  date: timestamp('date').notNull().defaultNow(),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  status: varchar('status', { length: 20 }).notNull().default('ordered'), // ordered, received, cancelled
  
  // Payables (Hutang) Tracking
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('UNPAID'), // PAID, UNPAID, PARTIAL
  amountPaid: decimal('amount_paid', { precision: 15, scale: 2 }).notNull().default('0'),
  dueDate: timestamp('due_date'), // Tanggal jatuh tempo
  
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseItems),
  payments: many(purchasePayments),
}))

// Purchase Items
export const purchaseItems = pgTable('purchase_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseId: uuid('purchase_id').notNull().references(() => purchases.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  costPrice: decimal('cost_price', { precision: 15, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
})

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  product: one(products, {
    fields: [purchaseItems.productId],
    references: [products.id],
  }),
}))

// Purchase Payments (Tracking hutang supplier)
export const purchasePayments = pgTable('purchase_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseId: uuid('purchase_id').notNull().references(() => purchases.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull().default('transfer'),
  date: timestamp('date').notNull().defaultNow(),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const purchasePaymentsRelations = relations(purchasePayments, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchasePayments.purchaseId],
    references: [purchases.id],
  }),
  createdByUser: one(users, {
    fields: [purchasePayments.createdBy],
    references: [users.id],
  }),
}))
// Shifts
export const shifts = pgTable('shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  startTime: timestamp('start_time').notNull().defaultNow(),
  endTime: timestamp('end_time'),
  startCash: decimal('start_cash', { precision: 15, scale: 2 }).notNull(),
  endCash: decimal('end_cash', { precision: 15, scale: 2 }),
  expectedCash: decimal('expected_cash', { precision: 15, scale: 2 }),
  status: varchar('status', { length: 20 }).notNull().default('open'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  user: one(users, {
    fields: [shifts.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}))

// Sales Returns
export const salesReturns = pgTable('sales_returns', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: varchar('number', { length: 50 }).notNull().unique(),
  transactionId: uuid('transaction_id').notNull().references(() => transactions.id),
  date: timestamp('date').notNull().defaultNow(),
  reason: text('reason'),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  status: varchar('status', { length: 20 }).notNull().default('completed'), // pending, approved, completed, rejected
  processedBy: uuid('processed_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const salesReturnsRelations = relations(salesReturns, ({ one, many }) => ({
  transaction: one(transactions, {
    fields: [salesReturns.transactionId],
    references: [transactions.id],
  }),
  processedByUser: one(users, {
    fields: [salesReturns.processedBy],
    references: [users.id],
  }),
  items: many(salesReturnItems),
}))

// Sales Return Items
export const salesReturnItems = pgTable('sales_return_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  returnId: uuid('return_id').notNull().references(() => salesReturns.id),
  transactionItemId: uuid('transaction_item_id').references(() => transactionItems.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 15, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
})

export const salesReturnItemsRelations = relations(salesReturnItems, ({ one }) => ({
  return: one(salesReturns, {
    fields: [salesReturnItems.returnId],
    references: [salesReturns.id],
  }),
  transactionItem: one(transactionItems, {
    fields: [salesReturnItems.transactionItemId],
    references: [transactionItems.id],
  }),
  product: one(products, {
    fields: [salesReturnItems.productId],
    references: [products.id],
  }),
}))

// Orders (pending orders for order-based POS)
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: varchar('number', { length: 50 }).notNull().unique(),
  date: timestamp('date').notNull().defaultNow(),
  customerId: uuid('customer_id').references(() => customers.id),
  // Customer info snapshot (for new customers without record)
  customerName: varchar('customer_name', { length: 100 }),
  customerPhone: varchar('customer_phone', { length: 20 }),
  customerAddress: text('customer_address'),
  // Order details
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  discountAmount: decimal('discount_amount', { precision: 15, scale: 2 }).notNull().default('0'), // New field
  finalAmount: decimal('final_amount', { precision: 15, scale: 2 }).notNull().default('0'),       // New field
  notes: text('notes'),
  
  // Shipping Details
  shippingCost: decimal('shipping_cost', { precision: 15, scale: 2 }).default('0'),
  deliveryMethod: varchar('delivery_method', { length: 20 }).default('pickup'), // pickup, delivery
  courierName: varchar('courier_name', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),

  // Payment details (temporary storage before completion)
  paymentMethod: varchar('payment_method', { length: 20 }), // cash, qris, card, transfer
  cashAmount: decimal('cash_amount', { precision: 15, scale: 2 }), // Uang diterima
  
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, processing, completed, cancelled
  createdBy: uuid('created_by').references(() => users.id),
  transactionId: uuid('transaction_id').references(() => transactions.id), // Linked after payment
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  createdByUser: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
  transaction: one(transactions, {
    fields: [orders.transactionId],
    references: [transactions.id],
  }),
  items: many(orderItems),
}))

// Order Items
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 15, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
})

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))

// ──────────────────────────────────────────────
// Stock Opname (Physical Stock Count)
// ──────────────────────────────────────────────

export const stockOpname = pgTable('stock_opname', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: varchar('number', { length: 50 }).notNull().unique(),
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  finalizedAt: timestamp('finalized_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const stockOpnameRelations = relations(stockOpname, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [stockOpname.warehouseId],
    references: [warehouses.id],
  }),
  createdByUser: one(users, {
    fields: [stockOpname.createdBy],
    references: [users.id],
  }),
  items: many(stockOpnameItems),
}))

export const stockOpnameItems = pgTable('stock_opname_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  opnameId: uuid('opname_id').notNull().references(() => stockOpname.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  systemQty: integer('system_qty').notNull().default(0),
  physicalQty: integer('physical_qty'),
  difference: integer('difference'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const stockOpnameItemsRelations = relations(stockOpnameItems, ({ one }) => ({
  opname: one(stockOpname, {
    fields: [stockOpnameItems.opnameId],
    references: [stockOpname.id],
  }),
  product: one(products, {
    fields: [stockOpnameItems.productId],
    references: [products.id],
  }),
}))


