import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { SalesReturn, CreateReturnRequest } from '../types'
import { Transaction } from '@/features/pos/types'

// Query keys
export const returnKeys = {
  all: ['returns'] as const,
  lists: () => [...returnKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number }) =>
    [...returnKeys.lists(), params] as const,
  details: () => [...returnKeys.all, 'detail'] as const,
  detail: (id: string) => [...returnKeys.details(), id] as const,
  searchTransaction: (number: string) => ['returns', 'search-transaction', number] as const,
}

// Hooks

export function useReturnList(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: returnKeys.list(params),
    queryFn: () => api.get<{ data: SalesReturn[] }>('/api/returns', params as Record<string, string | number>),
  })
}

export function useReturnDetail(id: string) {
  return useQuery({
    queryKey: returnKeys.detail(id),
    queryFn: () => api.get<SalesReturn>(`/api/returns/${id}`),
    enabled: !!id,
  })
}

export function useCreateReturn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReturnRequest) =>
      api.post<SalesReturn>('/api/returns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() })
    },
  })
}

// Hook to search for a transaction by its number specifically for the returns flow
export function useSearchTransaction() {
  return useMutation({
    mutationFn: (number: string) => 
      // Using the existing GET /api/transactions with ?search= to find the transaction
      // and asking back for an exact match.
      api.get<{ data: Transaction[]; pagination: any }>('/api/transactions', { search: number })
        .then(res => {
          const exactMatch = res.data?.find((t: Transaction) => t.number === number)
          if (!exactMatch) throw new Error('Transaksi tidak ditemukan atau nomor salah')
          // Fetch full detail of that exact transaction
          return api.get<Transaction>(`/api/transactions/${exactMatch.id}`)
        })
  })
}
