import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { z } from 'zod'

export const returnSchema = z.object({
  transactionId: z.string().uuid(),
  items: z.array(z.object({
    transactionItemId: z.string().uuid().optional(),
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().min(0),
  })),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

export interface Return {
  id: string
  number: string
  date: string
  transactionId: string
  totalAmount: string
  status: 'pending' | 'completed' | 'cancelled'
  reason?: string
  notes?: string
  transaction?: {
    number: string
  }
}

export type CreateReturnRequest = z.infer<typeof returnSchema>

export const useCreateReturn = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: CreateReturnRequest) => {
            const response = await api.post('/returns', data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['returns'] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['products'] }) // Stock updates
        }
    })
}

export const useReturns = (params?: { page?: number, limit?: number }) => {
    return useQuery({
        queryKey: ['returns', params],
        queryFn: async () => {
            const response = await api.get('/returns', { params })
            return response.data
        }
    })
}
