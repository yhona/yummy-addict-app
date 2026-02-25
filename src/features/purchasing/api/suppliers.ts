import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { CreateSupplierRequest, SupplierStats } from '@/lib/api-types'

export const useSuppliers = (params?: { search?: string }) => {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => api.get<any[]>('/api/suppliers', params as Record<string, string | number | boolean | undefined>),
  })
}

export const useSupplier = (id: string) => {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: () => api.get<any>(`/api/suppliers/${id}`),
    enabled: !!id,
  })
}

export const useCreateSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSupplierRequest) =>
      api.post<any>('/api/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateSupplierRequest }) =>
      api.put<any>(`/api/suppliers/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id] })
    },
  })
}

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

export const useSupplierStats = (id: string) => {
  return useQuery({
    queryKey: ['supplier', id, 'stats'],
    queryFn: () => api.get<SupplierStats>(`/api/purchases/supplier/${id}/stats`),
    enabled: !!id,
  })
}
