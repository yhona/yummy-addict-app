import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { productKeys } from './products'

// Types
export interface StockAdjustment {
  productId: string
  warehouseId: string
  adjustmentType: 'add' | 'subtract' | 'set'
  quantity: number
  reason: string
  notes?: string
}

export interface StockRecord {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  updatedAt: string
  product?: {
    id: string
    sku: string
    name: string
  }
  warehouse?: {
    id: string
    code: string
    name: string
  }
}

export interface StockMovement {
  id: string
  productId: string
  warehouseId: string
  movementType: string
  referenceType: string
  referenceId: string | null
  referenceNumber: string | null
  quantityBefore: number
  quantityChange: number
  quantityAfter: number
  notes: string | null
  createdBy: string | null
  createdAt: string
  product?: {
    id: string
    sku: string
    name: string
  }
  warehouse?: {
    id: string
    code: string
    name: string
  }
}

export interface MovementStats {
  period: string
  totalIn: number
  totalOut: number
  totalAdjustments: number
  netChange: number
  movementCount: number
}

export interface MovementsResponse {
  data: StockMovement[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Query keys
export const stockKeys = {
  all: ['stock'] as const,
  product: (productId: string) => [...stockKeys.all, 'product', productId] as const,
  warehouse: (warehouseId: string) => [...stockKeys.all, 'warehouse', warehouseId] as const,
  adjustments: (params?: object) => [...stockKeys.all, 'adjustments', params] as const,
}

export const movementKeys = {
  all: ['movements'] as const,
  list: (params?: object) => [...movementKeys.all, 'list', params] as const,
  stats: (params?: object) => [...movementKeys.all, 'stats', params] as const,
  detail: (id: string) => [...movementKeys.all, 'detail', id] as const,
}

// Stock Hooks
export function useProductStock(productId: string) {
  return useQuery({
    queryKey: stockKeys.product(productId),
    queryFn: () => api.get<StockRecord[]>(`/api/stock/product/${productId}`),
    enabled: !!productId,
  })
}

export function useWarehouseStock(warehouseId: string) {
  return useQuery({
    queryKey: stockKeys.warehouse(warehouseId),
    queryFn: () => api.get<StockRecord[]>(`/api/stock/warehouse/${warehouseId}`),
    enabled: !!warehouseId,
  })
}

export function useStockAdjustments(params?: { limit?: number; productId?: string; warehouseId?: string }) {
  return useQuery({
    queryKey: stockKeys.adjustments(params),
    queryFn: () => api.get<StockMovement[]>('/api/stock/adjustments', params),
  })
}


export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StockAdjustment) =>
      api.post<{ stock: StockRecord; movement: StockMovement; message: string }>('/api/stock/adjust', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all })
      queryClient.invalidateQueries({ queryKey: movementKeys.all })
      // Force refresh product list to show updated stock counts
      queryClient.invalidateQueries({ queryKey: ['products'] }) 
    },
  })
}

export function useAdjustStockBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StockAdjustment[]) =>
      api.post<{ message: string; results: any[] }>('/api/stock/adjust/batch', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all })
      queryClient.invalidateQueries({ queryKey: movementKeys.all })
      // Force refresh product list
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// Movement Hooks
export interface MovementsParams {
  [key: string]: string | number | boolean | undefined
  page?: number
  limit?: number
  type?: string
  productId?: string
  warehouseId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export function useMovements(params: MovementsParams = {}) {
  return useQuery({
    queryKey: movementKeys.list(params),
    queryFn: () => api.get<MovementsResponse>('/api/movements', params),
  })
}

export function useMovementStats(params?: { warehouseId?: string; period?: 'today' | 'week' | 'month' }) {
  return useQuery({
    queryKey: movementKeys.stats(params),
    queryFn: () => api.get<MovementStats>('/api/movements/stats', params),
  })
}

export function useMovement(id: string) {
  return useQuery({
    queryKey: movementKeys.detail(id),
    queryFn: () => api.get<StockMovement>(`/api/movements/${id}`),
    enabled: !!id,
  })
}

// Stock Transfer
export interface StockTransfer {
  productId: string
  fromWarehouseId: string
  toWarehouseId: string
  quantity: number
  notes?: string
}

export function useTransferStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StockTransfer) =>
      api.post<{ message: string; transferRef: string }>('/api/stock/transfer', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all })
      queryClient.invalidateQueries({ queryKey: movementKeys.all })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
