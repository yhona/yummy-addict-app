// Product types for Retail ERP

export interface Product {
  id: string
  sku: string
  barcode?: string
  name: string
  description?: string
  categoryId?: string
  categoryName?: string
  unitId?: string
  unitName?: string
  productType: 'inventory' | 'service' | 'non_inventory'
  type?: 'standard' | 'bundle'
  costPrice: number
  sellingPrice: number
  wholesalePrice?: number
  memberPrice?: number
  minStock: number
  maxStock?: number
  currentStock: number
  hasVariants: boolean
  trackInventory: boolean
  isActive: boolean
  isBulk: boolean
  conversionRatio: number
  image?: string
  parentId?: string
  parentName?: string
  variants?: Product[]
  bundleItems?: {
    productId: string
    quantity: number
    product?: Product
  }[]
  stockDetails?: ProductStockDetail[]
  createdAt: string
  updatedAt: string
}

export interface ProductStockDetail {
  warehouseName: string
  quantity: number
}

export interface ProductImage {
  id: string
  url: string
  isPrimary: boolean
  sortOrder: number
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  barcode?: string
  name: string
  variantOptions: Record<string, string>
  costPrice?: number
  sellingPrice?: number
  currentStock: number
  isActive: boolean
}

export interface Category {
  id: string
  parentId?: string
  code?: string
  name: string
  description?: string
  level: number
  isActive: boolean
}

export interface Unit {
  id: string
  code: string
  name: string
}

// Form types
export interface ProductFormData {
  sku: string
  barcode?: string
  name: string
  description?: string
  categoryId?: string
  unitId?: string
  productType: 'inventory' | 'service' | 'non_inventory'
  type: 'standard' | 'bundle'
  costPrice: number
  sellingPrice: number
  wholesalePrice?: number
  memberPrice?: number
  minStock: number
  maxStock?: number
  trackInventory: boolean
  isActive: boolean
  isBulk: boolean
  conversionRatio: number
  parentId?: string
  bundleItems?: {
    productId: string
    quantity: number
  }[]
}

// Filter types
export interface ProductFilters {
  search?: string
  categoryId?: string
  productType?: string
  status?: 'all' | 'active' | 'inactive'
  stockStatus?: 'all' | 'low' | 'out' | 'available'
}

// ──────────────────────────────────────────────
// Stock Opname Types
// ──────────────────────────────────────────────

export interface OpnameSession {
  id: string
  number: string
  warehouseId: string
  warehouseName: string
  status: 'draft' | 'counting' | 'finalized'
  totalItems: number
  countedItems: number
  itemsWithDifference: number
  notes?: string
  createdAt: string
  finalizedAt?: string
}

export interface OpnameItem {
  id: string
  opnameId: string
  productId: string
  productSku: string
  productName: string
  unitName?: string
  systemQty: number
  physicalQty: number | null
  difference: number | null
  notes?: string
  updatedAt: string
}

export interface OpnameSummary {
  adjustedItems: number
  totalAdded: number
  totalSubtracted: number
}

// ──────────────────────────────────────────────
// Transfer Types
// ──────────────────────────────────────────────

export interface TransferRecord {
  referenceNumber: string
  date: string
  productId: string
  productSku: string
  productName: string
  fromWarehouseId: string
  fromWarehouseName: string
  toWarehouseId: string
  toWarehouseName: string
  quantity: number
  notes?: string
}
