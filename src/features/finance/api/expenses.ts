import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import {
  Expense,
  ExpenseCategory,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
  ExpenseListResponse,
} from '../types'

// Keys
export const expenseCategoryKeys = {
  all: ['expenseCategories'] as const,
  lists: () => [...expenseCategoryKeys.all, 'list'] as const,
}

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (params?: any) => [...expenseKeys.lists(), params] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
}

const toRecord = (params: any) => {
  const result: Record<string, string | number | boolean> = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value as string | number | boolean
    }
  })
  return result
}

// ──────────────────────────────────────────────
// Categories Hooks
// ──────────────────────────────────────────────

export function useExpenseCategoryList() {
  return useQuery({
    queryKey: expenseCategoryKeys.lists(),
    queryFn: () => api.get<ExpenseCategory[]>('/api/expenses/categories'),
  })
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExpenseCategoryRequest) =>
      api.post<ExpenseCategory>('/api/expenses/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
    },
  })
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseCategoryRequest }) =>
      api.put<ExpenseCategory>(`/api/expenses/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
      // If we update a category name, it might be reflected in the expense list
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
    },
  })
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ message: string }>(`/api/expenses/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
    },
  })
}

// ──────────────────────────────────────────────
// Expenses Hooks
// ──────────────────────────────────────────────

export function useExpenseList(params?: {
  page?: number
  limit?: number
  categoryId?: string
  startDate?: string
  endDate?: string
  search?: string
}) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => {
      const queryParams = params ? toRecord(params) : undefined
      return api.get<ExpenseListResponse>('/api/expenses', queryParams)
    },
  })
}

export function useExpenseDetail(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => api.get<Expense>(`/api/expenses/${id}`),
    enabled: !!id,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExpenseRequest) =>
      api.post<Expense>('/api/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseRequest }) =>
      api.put<Expense>(`/api/expenses/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/api/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
    },
  })
}
