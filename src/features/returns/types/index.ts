import { User } from '@/features/users/types'
import { Product } from '@/features/inventory/types'
// Minimal localized types to prevent cross-module coupling errors
export interface Transaction {
  id: string
  number: string
  date: string
  finalAmount: string | number
  cashier?: User
  customer?: any
  items?: TransactionItem[]
}

export interface TransactionItem {
  id: string
  transactionId: string
  productId: string
  quantity: number
  price: string | number
  subtotal: string | number
  product?: Product
}

// Match database schema 'salesReturns'
export interface SalesReturn {
  id: string
  number: string
  transactionId: string
  date: string
  reason: string | null
  totalAmount: string | number
  status: 'pending' | 'approved' | 'completed' | 'rejected'
  processedBy: string | null
  notes: string | null
  createdAt: string
  updatedAt: string

  // Relations
  transaction?: Transaction
  processedByUser?: User
  items?: SalesReturnItem[]
}

// Match database schema 'salesReturnItems'
export interface SalesReturnItem {
  id: string
  returnId: string
  transactionItemId: string | null
  productId: string
  quantity: number
  price: string | number
  subtotal: string | number

  // Relations
  product?: Product
  transactionItem?: TransactionItem
}

// Payload for POST /api/returns
export interface CreateReturnRequest {
  transactionId: string
  items: {
    transactionItemId?: string
    productId: string
    quantity: number
    price: number
  }[]
  reason?: string
  notes?: string
  processedBy?: string
}
