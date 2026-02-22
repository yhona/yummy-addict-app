
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface Courier {
  id: string
  code: string
  name: string
  description?: string
  defaultCost?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CreateCourierRequest = Omit<Courier, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCourierRequest = Partial<CreateCourierRequest>

export const useCouriers = (params?: { isActive?: boolean }) => {
  return useQuery({
    queryKey: ['couriers', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive))
      
      const response = await api.get<{ data: Courier[] }>(`/api/couriers?${searchParams.toString()}`)
      return response.data
    },
  })
}

export const useCourier = (id: string) => {
  return useQuery({
    queryKey: ['couriers', id],
    queryFn: async () => {
      const response = await api.get<Courier>(`/api/couriers/${id}`)
      return response
    },
    enabled: !!id,
  })
}

export const useCreateCourier = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateCourierRequest) => {
      const response = await api.post<Courier>('/api/couriers', data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couriers'] })
    },
  })
}

export const useUpdateCourier = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCourierRequest }) => {
      const response = await api.put<Courier>(`/api/couriers/${id}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couriers'] })
    },
  })
}

export const useDeleteCourier = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ message: string }>(`/api/couriers/${id}`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couriers'] })
    },
  })
}
