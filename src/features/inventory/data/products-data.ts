import { Product, Category, Unit } from '../types'

// Mock Categories
export const mockCategories: Category[] = [
  { id: '1', name: 'Makanan', code: 'FOOD', level: 0, isActive: true },
  { id: '2', name: 'Minuman', code: 'DRINK', level: 0, isActive: true },
  { id: '3', name: 'Snack', code: 'SNACK', parentId: '1', level: 1, isActive: true },
  { id: '4', name: 'Sembako', code: 'GROCERY', level: 0, isActive: true },
  { id: '5', name: 'Elektronik', code: 'ELEC', level: 0, isActive: true },
  { id: '6', name: 'Perawatan', code: 'CARE', level: 0, isActive: true },
]

// Mock Units
export const mockUnits: Unit[] = [
  { id: '1', code: 'PCS', name: 'Pieces' },
  { id: '2', code: 'BOX', name: 'Box' },
  { id: '3', code: 'KG', name: 'Kilogram' },
  { id: '4', code: 'L', name: 'Liter' },
  { id: '5', code: 'DZ', name: 'Dozen' },
]

// Mock Products
export const mockProducts: Product[] = [
  {
    id: '1',
    sku: 'PRD-001',
    barcode: '8991234567890',
    name: 'Indomie Goreng Original',
    description: 'Mie goreng instant rasa original',
    categoryId: '1',
    categoryName: 'Makanan',
    unitId: '1',
    unitName: 'Pieces',
    productType: 'inventory',
    costPrice: 2500,
    sellingPrice: 3500,
    wholesalePrice: 3000,
    minStock: 50,
    maxStock: 500,
    currentStock: 150,
    hasVariants: false,
    trackInventory: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    sku: 'PRD-002',
    barcode: '8991234567891',
    name: 'Aqua 600ml',
    description: 'Air mineral kemasan botol 600ml',
    categoryId: '2',
    categoryName: 'Minuman',
    unitId: '1',
    unitName: 'Pieces',
    productType: 'inventory',
    costPrice: 2000,
    sellingPrice: 3000,
    minStock: 100,
    currentStock: 25, // Low stock
    hasVariants: false,
    trackInventory: true,
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    sku: 'PRD-003',
    barcode: '8991234567892',
    name: 'Beras Premium 5kg',
    description: 'Beras putih premium kualitas tinggi',
    categoryId: '4',
    categoryName: 'Sembako',
    unitId: '3',
    unitName: 'Kilogram',
    productType: 'inventory',
    costPrice: 65000,
    sellingPrice: 75000,
    wholesalePrice: 70000,
    minStock: 20,
    currentStock: 45,
    hasVariants: false,
    trackInventory: true,
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    sku: 'PRD-004',
    barcode: '8991234567893',
    name: 'Minyak Goreng Bimoli 2L',
    description: 'Minyak goreng kemasan 2 liter',
    categoryId: '4',
    categoryName: 'Sembako',
    unitId: '1',
    unitName: 'Pieces',
    productType: 'inventory',
    costPrice: 28000,
    sellingPrice: 35000,
    minStock: 30,
    currentStock: 0, // Out of stock
    hasVariants: false,
    trackInventory: true,
    isActive: true,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
  {
    id: '5',
    sku: 'PRD-005',
    barcode: '8991234567894',
    name: 'Teh Botol Sosro 450ml',
    description: 'Teh manis kemasan botol',
    categoryId: '2',
    categoryName: 'Minuman',
    unitId: '1',
    unitName: 'Pieces',
    productType: 'inventory',
    costPrice: 3500,
    sellingPrice: 5000,
    minStock: 50,
    currentStock: 80,
    hasVariants: false,
    trackInventory: true,
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: '6',
    sku: 'PRD-006',
    name: 'Chitato Original 68g',
    categoryId: '3',
    categoryName: 'Snack',
    unitId: '1',
    unitName: 'Pieces',
    productType: 'inventory',
    costPrice: 8000,
    sellingPrice: 12000,
    minStock: 30,
    currentStock: 55,
    hasVariants: false,
    trackInventory: true,
    isActive: true,
    createdAt: '2024-01-06T00:00:00Z',
    updatedAt: '2024-01-06T00:00:00Z',
  },
  {
    id: '7',
    sku: 'PRD-007',
    name: 'Sabun Lifebuoy 100g',
    categoryId: '6',
    categoryName: 'Perawatan',
    unitId: '1',
    unitName: 'Pieces',
    productType: 'inventory',
    costPrice: 4000,
    sellingPrice: 6500,
    minStock: 20,
    currentStock: 35,
    hasVariants: false,
    trackInventory: true,
    isActive: false, // Inactive
    createdAt: '2024-01-07T00:00:00Z',
    updatedAt: '2024-01-07T00:00:00Z',
  },
  {
    id: '8',
    sku: 'PRD-008',
    name: 'Kopi Kapal Api 165g',
    categoryId: '2',
    categoryName: 'Minuman',
    unitId: '1',
    unitName: 'Pieces',
    productType: 'inventory',
    costPrice: 12000,
    sellingPrice: 18000,
    wholesalePrice: 15000,
    minStock: 25,
    currentStock: 40,
    hasVariants: false,
    trackInventory: true,
    isActive: true,
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
  },
]

// Helper function to simulate API delay
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock API functions
export async function getProducts(): Promise<Product[]> {
  await delay(500)
  return mockProducts
}

export async function getProduct(id: string): Promise<Product | undefined> {
  await delay(300)
  return mockProducts.find((p) => p.id === id)
}

export async function getCategories(): Promise<Category[]> {
  await delay(300)
  return mockCategories
}

export async function getUnits(): Promise<Unit[]> {
  await delay(200)
  return mockUnits
}
