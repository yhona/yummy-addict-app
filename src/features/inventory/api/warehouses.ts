import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { ApiWarehouse, WarehouseCreateRequest } from '@/lib/api-types'

// Query keys
export const warehouseKeys = {
  all: ['warehouses'] as const,
  lists: () => [...warehouseKeys.all, 'list'] as const,
  list: () => [...warehouseKeys.lists()] as const,
  details: () => [...warehouseKeys.all, 'detail'] as const,
  detail: (id: string) => [...warehouseKeys.details(), id] as const,
}

// Hooks
export function useWarehouses() {
  return useQuery({
    queryKey: warehouseKeys.list(),
    queryFn: () => api.get<ApiWarehouse[]>('/api/warehouses'),
  })
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => api.get<ApiWarehouse>(`/api/warehouses/${id}`),
    enabled: !!id,
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WarehouseCreateRequest) =>
      api.post<ApiWarehouse>('/api/warehouses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() })
    },
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WarehouseCreateRequest> }) =>
      api.put<ApiWarehouse>(`/api/warehouses/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(id) })
    },
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/api/warehouses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() })
    },
  })
}

export function useSetWarehouseDefault() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.put<ApiWarehouse>(`/api/warehouses/${id}/set-default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() })
    },
  })
}
