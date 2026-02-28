export interface ExpenseCategory {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  number: string
  date: string
  categoryId: string
  categoryName?: string // Joined from expenseCategories
  amount: number
  title: string
  notes: string | null
  paymentMethod: 'cash' | 'transfer' | 'credit'
  receiptUrl: string | null
  createdBy: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Request Types
export interface CreateExpenseCategoryRequest {
  name: string
  description?: string
}

export interface UpdateExpenseCategoryRequest {
  name?: string
  description?: string
}

export interface CreateExpenseRequest {
  date: string
  categoryId: string
  amount: number
  title: string
  notes?: string
  paymentMethod: 'cash' | 'transfer' | 'credit'
  receiptUrl?: string
}

export interface UpdateExpenseRequest {
  date?: string
  categoryId?: string
  amount?: number
  title?: string
  notes?: string
  paymentMethod?: 'cash' | 'transfer' | 'credit'
  receiptUrl?: string
}

export interface ExpenseListResponse {
  data: Expense[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
