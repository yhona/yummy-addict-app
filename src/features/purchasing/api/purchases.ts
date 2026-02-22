import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { CreatePurchaseRequest } from '@/lib/api-types'

export const usePurchases = () => {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const response = await api.get('/purchases')
      return response.data
    },
  })
}

export const useCreatePurchase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreatePurchaseRequest) => {
      const response = await api.post('/purchases', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
  })
}

export const useReceivePurchase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/purchases/${id}/receive`, {})
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // Cost price & Stock update
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    },
  })
}
