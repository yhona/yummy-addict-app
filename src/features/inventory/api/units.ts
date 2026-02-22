import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { ApiUnit, UnitCreateRequest } from '@/lib/api-types'

// Query keys
export const unitKeys = {
  all: ['units'] as const,
  lists: () => [...unitKeys.all, 'list'] as const,
  list: () => [...unitKeys.lists()] as const,
}

// Hooks
export function useUnits() {
  return useQuery({
    queryKey: unitKeys.list(),
    queryFn: () => api.get<ApiUnit[]>('/api/units'),
  })
}

export function useCreateUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UnitCreateRequest) =>
      api.post<ApiUnit>('/api/units', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() })
    },
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UnitCreateRequest> }) =>
      api.put<ApiUnit>(`/api/units/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() })
    },
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/api/units/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() })
    },
  })
}
