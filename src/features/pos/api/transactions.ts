import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { CreateTransactionRequest, Transaction } from '@/lib/api-types'

export interface TransactionsParams {
  page?: number
  limit?: number
  dateFrom?: string
  dateTo?: string
  status?: string
  cashierId?: string
  search?: string
}

export interface TransactionsSummary {
  totalTransactions: number
  totalSales: number
  avgTransaction: number
  totalItems: number
}

export interface Cashier {
  id: string
  name: string
}

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (params?: TransactionsParams) => [...transactionKeys.lists(), params] as const,
  summary: (params?: { dateFrom?: string; dateTo?: string }) => [...transactionKeys.all, 'summary', params] as const,
  cashiers: () => [...transactionKeys.all, 'cashiers'] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
}

export const useTransactions = (params?: TransactionsParams) => {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: async () => {
      const response = await api.get('/api/transactions', { params })
      return response as {
        data: Transaction[]
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }
    },
  })
}

export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/api/transactions/${id}`)
      return response as Transaction
    },
    enabled: !!id,
  })
}

export const useTransactionsSummary = (params?: { dateFrom?: string; dateTo?: string }) => {
  return useQuery({
    queryKey: transactionKeys.summary(params),
    queryFn: async () => {
      const response = await api.get('/api/transactions/summary', { params })
      return response as TransactionsSummary
    },
  })
}

export const useCashiers = () => {
  return useQuery({
    queryKey: transactionKeys.cashiers(),
    queryFn: async () => {
      const response = await api.get('/api/transactions/meta/cashiers')
      return response as Cashier[]
    },
  })
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTransactionRequest) => {
      const response = await api.post('/api/transactions', data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    },
  })
}

export const useVoidTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/api/transactions/${id}/void`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    },
  })
}
