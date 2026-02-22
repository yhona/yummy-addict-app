// Warehouse types
export interface Warehouse {
  id: string
  code: string
  name: string
  address?: string
  phone?: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Extended warehouse with product count
export interface WarehouseWithStats extends Warehouse {
  productCount: number
  totalStock: number
}

// Mock warehouses
export const mockWarehouses: Warehouse[] = [
  {
    id: '1',
    code: 'WH-MAIN',
    name: 'Gudang Utama',
    address: 'Jl. Raya Industri No. 123, Kawasan Industri MM2100, Bekasi',
    phone: '021-8912345',
    isDefault: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'WH-STORE1',
    name: 'Gudang Toko Pusat',
    address: 'Jl. Sudirman No. 45, Jakarta Selatan',
    phone: '021-5678901',
    isDefault: false,
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: '3',
    code: 'WH-STORE2',
    name: 'Gudang Cabang Bandung',
    address: 'Jl. Asia Afrika No. 88, Bandung',
    phone: '022-4567890',
    isDefault: false,
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '4',
    code: 'WH-TEMP',
    name: 'Gudang Sementara',
    address: 'Jl. Industri Kecil No. 10, Tangerang',
    phone: '',
    isDefault: false,
    isActive: false,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
]

// Get warehouses with stats
export function getWarehousesWithStats(warehouses: Warehouse[]): WarehouseWithStats[] {
  // Mock product counts for each warehouse
  const mockStats: Record<string, { productCount: number; totalStock: number }> = {
    '1': { productCount: 156, totalStock: 12500 },
    '2': { productCount: 89, totalStock: 3200 },
    '3': { productCount: 67, totalStock: 1800 },
    '4': { productCount: 0, totalStock: 0 },
  }

  return warehouses.map((wh) => ({
    ...wh,
    productCount: mockStats[wh.id]?.productCount || 0,
    totalStock: mockStats[wh.id]?.totalStock || 0,
  }))
}
