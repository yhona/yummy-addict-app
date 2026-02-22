// Stock adjustment types
export interface StockAdjustment {
  id: string
  productId: string
  productName: string
  productSku: string
  adjustmentType: 'add' | 'subtract' | 'set'
  quantityBefore: number
  quantityChange: number
  quantityAfter: number
  reason: string
  notes?: string
  createdBy: string
  createdAt: string
}

// Stock movement types
export interface StockMovement {
  id: string
  productId: string
  productName: string
  productSku: string
  movementType: 'in' | 'out' | 'adjustment'
  referenceType: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return'
  referenceId?: string
  referenceNumber?: string
  quantityBefore: number
  quantityChange: number
  quantityAfter: number
  notes?: string
  createdBy: string
  createdAt: string
}

// Mock stock adjustments history
export const mockStockAdjustments: StockAdjustment[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Indomie Goreng Original',
    productSku: 'PRD-001',
    adjustmentType: 'add',
    quantityBefore: 100,
    quantityChange: 50,
    quantityAfter: 150,
    reason: 'Received from Supplier',
    notes: 'Weekly stock replenishment',
    createdBy: 'Admin',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    productId: '4',
    productName: 'Minyak Goreng Bimoli 2L',
    productSku: 'PRD-004',
    adjustmentType: 'subtract',
    quantityBefore: 20,
    quantityChange: 20,
    quantityAfter: 0,
    reason: 'Damaged Goods',
    notes: 'Container leaked during storage',
    createdBy: 'Warehouse Staff',
    createdAt: '2024-01-14T14:00:00Z',
  },
  {
    id: '3',
    productId: '2',
    productName: 'Aqua 600ml',
    productSku: 'PRD-002',
    adjustmentType: 'set',
    quantityBefore: 50,
    quantityChange: 25,
    quantityAfter: 25,
    reason: 'Stock Count Correction',
    notes: 'Physical count shows 25 units',
    createdBy: 'Manager',
    createdAt: '2024-01-13T09:00:00Z',
  },
]

// Mock stock movements
export const mockStockMovements: StockMovement[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Indomie Goreng Original',
    productSku: 'PRD-001',
    movementType: 'in',
    referenceType: 'purchase',
    referenceNumber: 'PO-2024-001',
    quantityBefore: 100,
    quantityChange: 50,
    quantityAfter: 150,
    notes: 'Received from supplier',
    createdBy: 'Admin',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    productId: '1',
    productName: 'Indomie Goreng Original',
    productSku: 'PRD-001',
    movementType: 'out',
    referenceType: 'sale',
    referenceNumber: 'TRX-2024-0050',
    quantityBefore: 150,
    quantityChange: 5,
    quantityAfter: 145,
    createdBy: 'Cashier',
    createdAt: '2024-01-15T11:45:00Z',
  },
  {
    id: '3',
    productId: '2',
    productName: 'Aqua 600ml',
    productSku: 'PRD-002',
    movementType: 'adjustment',
    referenceType: 'adjustment',
    referenceNumber: 'ADJ-2024-001',
    quantityBefore: 50,
    quantityChange: -25,
    quantityAfter: 25,
    notes: 'Stock count correction',
    createdBy: 'Manager',
    createdAt: '2024-01-13T09:00:00Z',
  },
  {
    id: '4',
    productId: '3',
    productName: 'Beras Premium 5kg',
    productSku: 'PRD-003',
    movementType: 'out',
    referenceType: 'sale',
    referenceNumber: 'TRX-2024-0048',
    quantityBefore: 50,
    quantityChange: 5,
    quantityAfter: 45,
    createdBy: 'Cashier',
    createdAt: '2024-01-14T16:20:00Z',
  },
  {
    id: '5',
    productId: '5',
    productName: 'Teh Botol Sosro 450ml',
    productSku: 'PRD-005',
    movementType: 'in',
    referenceType: 'return',
    referenceNumber: 'RET-2024-001',
    quantityBefore: 75,
    quantityChange: 5,
    quantityAfter: 80,
    notes: 'Customer return - unopened',
    createdBy: 'Cashier',
    createdAt: '2024-01-15T09:15:00Z',
  },
]
