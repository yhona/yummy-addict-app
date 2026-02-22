import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

interface ReturnItem {
  transactionItemId?: string
  productId: string
  quantity: number
  price: number
}

interface CreateReturnRequest {
  transactionId: string
  items: ReturnItem[]
  reason?: string
  notes?: string
  processedBy?: string
}

interface SalesReturn {
  id: string
  number: string
  transactionId: string
  date: string
  reason: string | null
  totalAmount: string
  status: string
  processedBy: string | null
  notes: string | null
  transaction?: {
    id: string
    number: string
  }
  processedByUser?: {
    id: string
    name: string
  }
  items: {
    id: string
    productId: string
    quantity: number
    price: string
    subtotal: string
    product: {
      id: string
      name: string
      sku: string
    }
  }[]
}

export const useReturns = (params?: { page?: number; limit?: number }) => {
  return useQuery<{ data: SalesReturn[] }>({
    queryKey: ['returns', params],
    queryFn: async () => {
      return api.get('/api/returns', params)
    },
  })
}

export const useReturn = (id: string) => {
  return useQuery<SalesReturn>({
    queryKey: ['returns', id],
    queryFn: async () => {
      return api.get(`/api/returns/${id}`)
    },
    enabled: !!id,
  })
}

export const useCreateReturn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateReturnRequest) => {
      return api.post('/api/returns', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    },
  })
}
