// API Types that match backend responses

export interface ApiPaginationResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiProduct {
  id: string
  sku: string
  barcode: string | null
  name: string
  description: string | null
  categoryId: string | null
  unitId: string | null
  costPrice: string
  sellingPrice: string
  wholesalePrice: string | null
  memberPrice: string | null
  minStock: number
  maxStock: number | null
  image: string | null
  parentId: string | null
  conversionRatio: string | null
  isBulk: boolean
  hasVariants: boolean
  trackInventory: boolean
  productType: 'inventory' | 'service' | 'non_inventory'
  variants?: ApiProduct[]
  parent?: ApiProduct | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  category?: ApiCategory | null
  unit?: ApiUnit | null
  stock?: ApiProductStock[]
  currentStock?: number
  categoryName?: string
  unitName?: string
}

export interface ApiCategory {
  id: string
  code: string
  name: string
  description: string | null
  parentId: string | null
  level: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  parent?: ApiCategory | null
  subcategories?: ApiCategory[]
  products?: ApiProduct[]
  productCount?: number
  subcategoryCount?: number
}

export interface ApiUnit {
  id: string
  code: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface ApiWarehouse {
  id: string
  code: string
  name: string
  address: string | null
  phone: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  productCount?: number
  totalStock?: number
}

export interface ApiProductStock {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  updatedAt: string
  product?: ApiProduct
  warehouse?: ApiWarehouse
}

export interface ApiUser {
  id: string
  email: string
  name: string
  role: string
}

export interface ApiLoginResponse {
  token: string
  user: ApiUser
}

// Request types
export interface ProductCreateRequest {
  sku: string
  barcode?: string
  name: string
  description?: string
  categoryId?: string
  unitId?: string
  productType: 'inventory' | 'service' | 'non_inventory'
  costPrice: number
  sellingPrice: number
  wholesalePrice?: number | null
  memberPrice?: number | null
  minStock?: number
  maxStock?: number | null
  image?: string | null
  parentId?: string | null
  conversionRatio?: number | null
  isBulk?: boolean
  trackInventory?: boolean
  isActive?: boolean
}

export interface CategoryCreateRequest {
  code: string
  name: string
  description?: string
  parentId?: string | null
  isActive?: boolean
}

export interface UnitCreateRequest {
  code: string
  name: string
}

export interface WarehouseCreateRequest {
  code: string
  name: string
  address?: string
  phone?: string
  isDefault?: boolean
  isActive?: boolean
}

// Transactions
export interface TransactionItem {
  id: string
  productId: string
  quantity: number
  price: string
  costPrice: string
  subtotal: string
  product?: ApiProduct
}

export interface Transaction {
  id: string
  number: string
  date: string
  totalAmount: string
  taxAmount: string
  discountAmount: string
  finalAmount: string
  paymentMethod: string
  cashAmount: string | null
  changeAmount: string | null
  status: string
  notes?: string
  items?: TransactionItem[]
  cashier?: ApiUser
}

export interface CreateTransactionRequest {
  items: {
    productId: string
    quantity: number
    price: number
  }[]
  paymentMethod: 'cash' | 'card' | 'qris' | 'transfer'
  cashAmount?: number
  discountAmount?: number
  cashierId?: string
  customerId?: string
  notes?: string
  shiftId?: string
}

// Suppliers
export interface Supplier {
  id: string
  code: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  isActive: boolean
}

export interface CreateSupplierRequest {
  code: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
}

// Purchases
export interface PurchaseItem {
    id: string
    productId: string
    quantity: number
    costPrice: string // Decimal as string from API usually
    subtotal: string
    product?: ApiProduct
}

export interface Purchase {
    id: string
    number: string
    date: string
    supplierId: string
    supplier?: Supplier
    totalAmount: string
    status: 'ordered' | 'received' | 'cancelled'
    notes?: string
    items?: PurchaseItem[]
}

export interface CreatePurchaseRequest {
    supplierId: string
    notes?: string
    items: {
        productId: string
        quantity: number
        costPrice: number
    }[]
}

// Customers
export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
}

export interface CreateCustomerRequest {
  name: string
  phone?: string
  email?: string
  address?: string
}
