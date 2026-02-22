
import { db } from '../db'
import { 
  orders, orderItems, 
  transactions, transactionItems, 
  stockMovements, 
  salesReturns, salesReturnItems 
} from '../db/schema'
import { sql } from 'drizzle-orm'

async function resetTransactions() {
  console.log('⚠️  DANGER: Starting Transaction History Reset ⚠️')
  console.log('This will delete all sales, orders, and stock movements related to sales.')

  try {
    await db.transaction(async (tx) => {
      // 1. Delete Order Items & Orders
      console.log('Deleting Orders...')
      await tx.delete(orderItems)
      await tx.delete(orders)

      // 2. Delete Sales Returns
      console.log('Deleting Returns...')
      await tx.delete(salesReturnItems)
      await tx.delete(salesReturns)

      // 3. Delete Transaction Items & Transactions
      console.log('Deleting Transactions...')
      await tx.delete(transactionItems)
      await tx.delete(transactions)

      // 4. Delete Stock Movements
      console.log('Deleting Stock Movements...')
      await tx.delete(stockMovements)

      console.log('✅ All transaction history deleted successfully.')
    })
  } catch (error) {
    console.error('❌ Failed to reset transactions:', error)
    process.exit(1)
  }

  process.exit(0)
}

resetTransactions()
