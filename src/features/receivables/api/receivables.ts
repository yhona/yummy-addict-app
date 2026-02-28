import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import {
  Receivable,
  ReceivablesResponse,
  CreateReceivableRequest,
  CreatePaymentRequest,
} from '../types'

// Query keys
export const receivableKeys = {
  all: ['receivables'] as const,
  lists: () => [...receivableKeys.all, 'list'] as const,
  list: (params?: { search?: string; status?: string; customerId?: string }) =>
    [...receivableKeys.lists(), params] as const,
  details: () => [...receivableKeys.all, 'detail'] as const,
  detail: (id: string) => [...receivableKeys.details(), id] as const,
}

// Helpers
const toRecord = (params: any) => {
  const result: Record<string, string | number | boolean> = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value as string | number | boolean
    }
  })
  return result
}

// Hooks
export function useReceivableList(params?: {
  search?: string
  status?: string
  customerId?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: receivableKeys.list(params),
    queryFn: () => {
      const queryParams = params ? toRecord(params) : undefined
      return api.get<ReceivablesResponse>('/api/receivables', queryParams)
    },
  })
}

export function useReceivableDetail(id: string) {
  return useQuery({
    queryKey: receivableKeys.detail(id),
    queryFn: () => api.get<Receivable>(`/api/receivables/${id}`),
    enabled: !!id,
  })
}

export function useCreateReceivable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReceivableRequest) =>
      api.post<Receivable>('/api/receivables', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receivableKeys.lists() })
    },
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreatePaymentRequest }) =>
      api.post<any>(`/api/receivables/${id}/payments`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: receivableKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: receivableKeys.lists() })
    },
  })
}
