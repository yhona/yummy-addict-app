import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { OpnameSession, OpnameItem, OpnameSummary } from '../types'
import { stockKeys, movementKeys } from './stock'

// Types
interface OpnameDetailResponse extends OpnameSession {
  items: OpnameItem[]
}

interface OpnameListResponse {
  data: OpnameSession[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Query Keys
export const opnameKeys = {
  all: ['opname'] as const,
  list: (params?: object) => [...opnameKeys.all, 'list', params] as const,
  detail: (id: string) => [...opnameKeys.all, 'detail', id] as const,
}

// ── List opname sessions ────────────────────────

export function useOpnames(params?: { page?: number; limit?: number; warehouseId?: string; status?: string }) {
  return useQuery({
    queryKey: opnameKeys.list(params),
    queryFn: () => api.get<OpnameListResponse>('/api/opname', params),
  })
}

// ── Detail opname session + items ───────────────

export function useOpname(id: string) {
  return useQuery({
    queryKey: opnameKeys.detail(id),
    queryFn: () => api.get<OpnameDetailResponse>(`/api/opname/${id}`),
    enabled: !!id,
  })
}

// ── Create new opname session ───────────────────

export function useCreateOpname() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { warehouseId: string; notes?: string }) =>
      api.post<OpnameSession>('/api/opname', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opnameKeys.all })
    },
  })
}

// ── Update counted items ────────────────────────

export function useUpdateOpnameItems(opnameId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { items: Array<{ id: string; physicalQty: number; notes?: string }> }) =>
      api.put<{ updated: OpnameItem[] }>(`/api/opname/${opnameId}/items`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opnameKeys.detail(opnameId) })
    },
  })
}

// ── Finalize opname ─────────────────────────────

export function useFinalizeOpname(opnameId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.post<{ message: string; summary: OpnameSummary }>(`/api/opname/${opnameId}/finalize`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opnameKeys.all })
      queryClient.invalidateQueries({ queryKey: stockKeys.all })
      queryClient.invalidateQueries({ queryKey: movementKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// ── Delete opname ───────────────────────────────

export function useDeleteOpname() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/api/opname/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opnameKeys.all })
    },
  })
}
