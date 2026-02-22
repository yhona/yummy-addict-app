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
}

// Filter types
export interface ProductFilters {
  search?: string
  categoryId?: string
  productType?: string
  status?: 'all' | 'active' | 'inactive'
  stockStatus?: 'all' | 'low' | 'out' | 'available'
}
