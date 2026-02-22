import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Supplier, CreateSupplierRequest } from '@/lib/api-types'

export const useSuppliers = (params?: { search?: string }) => {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: async () => {
      const response = await api.get('/suppliers', { params })
      return response.data
    },
  })
}

export const useCreateSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateSupplierRequest) => {
      const response = await api.post('/suppliers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/suppliers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

export const useSupplier = (id: string) => {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const response = await api.get(`/suppliers/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateSupplierRequest }) => {
      const response = await api.put(`/suppliers/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id] })
    },
  })
}
