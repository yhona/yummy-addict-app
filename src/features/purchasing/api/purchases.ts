import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import {
  CreatePurchaseRequest,
  PurchasesResponse,
  Purchase,
  PurchasePayment
} from '@/lib/api-types'

// ==========================================
// QUERY KEYS
// ==========================================

export const purchaseKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  list: (params?: object) => [...purchaseKeys.lists(), params] as const,
  detail: (id: string) => [...purchaseKeys.all, 'detail', id] as const,
  payments: (id: string) => [...purchaseKeys.all, 'payments', id] as const,
}

// ==========================================
// FILTER PARAMS
// ==========================================

export interface PurchasesParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  paymentStatus?: string
  supplierId?: string
  dateFrom?: string
  dateTo?: string
}

// Helper to convert typed params to Record for api.get
const toRecord = (params?: PurchasesParams): Record<string, string | number | boolean | undefined> | undefined => {
  if (!params) return undefined
  const record: Record<string, string | number | boolean | undefined> = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) record[key] = value
  })
  return record
}

// ==========================================
// QUERY HOOKS
// ==========================================

export const usePurchases = (params?: PurchasesParams) => {
  return useQuery({
    queryKey: purchaseKeys.list(params),
    queryFn: () => api.get<PurchasesResponse>('/api/purchases', toRecord(params)),
  })
}

export const usePurchase = (id: string) => {
  return useQuery({
    queryKey: purchaseKeys.detail(id),
    queryFn: () => api.get<Purchase>(`/api/purchases/${id}`),
    enabled: !!id,
  })
}

export const usePurchasePayments = (id: string) => {
  return useQuery({
    queryKey: purchaseKeys.payments(id),
    queryFn: () => api.get<PurchasePayment[]>(`/api/purchases/${id}/payments`),
    enabled: !!id,
  })
}

// ==========================================
// MUTATION HOOKS
// ==========================================

export const useCreatePurchase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePurchaseRequest) =>
      api.post<Purchase>('/api/purchases', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
    },
  })
}

export const useReceivePurchase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ message: string }>(`/api/purchases/${id}/receive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    },
  })
}

export const useCancelPurchase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ message: string }>(`/api/purchases/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
    },
  })
}

export const useAddPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string
      data: { amount: number; paymentMethod: string; date: string; notes?: string }
    }) => api.post<PurchasePayment>(`/api/purchases/${id}/payments`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.payments(id) })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() })
    },
  })
}
