export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

export interface User {
  id: string
  name: string
}

export interface ReceivablePayment {
  id: string
  receivableId: string
  amount: string | number
  paymentDate: string
  paymentMethod: string
  receivedBy: string | null
  receivedByUser?: User
  notes: string | null
  createdAt: string
}

export interface Receivable {
  id: string
  number: string
  transactionId: string | null
  customerId: string
  customer?: Customer
  customerName?: string // From joined query
  amount: string | number
  remainingAmount: string | number
  dueDate: string | null
  status: 'unpaid' | 'partial' | 'paid'
  notes: string | null
  createdBy: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  payments?: ReceivablePayment[]
  transaction?: {
    number: string
  }
}

export interface CreateReceivableRequest {
  customerId: string
  transactionId?: string
  amount: number
  dueDate?: string // ISO string date
  notes?: string
}

export interface CreatePaymentRequest {
  amount: number
  paymentMethod: 'cash' | 'transfer'
  notes?: string
  receivedBy?: string
}

export interface ReceivablesResponse {
  data: Receivable[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
