import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { CreateCustomerRequest } from '@/lib/api-types'

export interface CustomerStats {
  totalSpent: number
  orderCount: number
  avgOrder: number
  lastPurchase: string | null
}

export interface CustomerWithStats {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  stats: CustomerStats
}

export const useCustomers = (params?: { search?: string; limit?: number }) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      return api.get('/api/customers', { params })
    },
  })
}

export const useCustomer = (id: string) => {
  return useQuery<CustomerWithStats>({
    queryKey: ['customers', id],
    queryFn: async () => {
      return api.get(`/api/customers/${id}`)
    },
    enabled: !!id,
  })
}

export const useCustomerTransactions = (id: string, params?: { limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ['customers', id, 'transactions', params],
    queryFn: async () => {
      return api.get(`/api/customers/${id}/transactions`, params)
    },
    enabled: !!id,
  })
}

export const useCreateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      return api.post('/api/customers', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateCustomerRequest }) => {
      return api.put(`/api/customers/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/customers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

