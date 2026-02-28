import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { OpnameSession, OpnameItem } from '../types'

// Extended interface for creation wrapper
export interface CreateOpnameRequest {
  warehouseId: string
  notes?: string
}

export interface UpdateOpnameItemRequest {
  physicalQty: number | null
  notes?: string
}

// Query keys
export const opnameKeys = {
  all: ['opnames'] as const,
  lists: () => [...opnameKeys.all, 'list'] as const,
  list: (params?: { status?: string; warehouseId?: string }) =>
    [...opnameKeys.lists(), params] as const,
  details: () => [...opnameKeys.all, 'detail'] as const,
  detail: (id: string) => [...opnameKeys.details(), id] as const,
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
export function useOpnameList(params?: {
  status?: string
  warehouseId?: string
}) {
  return useQuery({
    queryKey: opnameKeys.list(params),
    queryFn: () => {
      const queryParams = params ? toRecord(params) : undefined
      return api.get<OpnameSession[]>('/api/opname', queryParams)
    },
  })
}

export function useOpnameDetail(id: string) {
  return useQuery({
    queryKey: opnameKeys.detail(id),
    queryFn: () =>
      api.get<
        OpnameSession & {
          items: OpnameItem[]
        }
      >(`/api/opname/${id}`),
    enabled: !!id,
  })
}

export function useCreateOpname() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateOpnameRequest) =>
      api.post<OpnameSession>('/api/opname', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opnameKeys.lists() })
    },
  })
}

export function useUpdateOpnameItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      opnameId,
      itemId,
      data,
    }: {
      opnameId: string
      itemId: string
      data: UpdateOpnameItemRequest
    }) => api.put<{ updated: OpnameItem[] }>(`/api/opname/${opnameId}/items`, { 
      items: [{ id: itemId, ...data }] 
    }),
    onSuccess: (_, { opnameId }) => {
      queryClient.invalidateQueries({ queryKey: opnameKeys.detail(opnameId) })
    },
  })
}

export function useFinalizeOpname() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ message: string; session: OpnameSession }>(
        `/api/opname/${id}/finalize`
      ),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: opnameKeys.lists() })
      queryClient.invalidateQueries({ queryKey: opnameKeys.detail(id) })
    },
  })
}

export function useDeleteOpname() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/api/opname/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opnameKeys.lists() })
    },
  })
}
