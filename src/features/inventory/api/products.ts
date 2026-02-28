import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import {
  ApiProduct,
  ApiPaginationResponse,
  ProductCreateRequest,
} from '@/lib/api-types'

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: Record<string, unknown> | ProductsListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
}

// Types
export interface ProductsListParams {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  status?: 'active' | 'inactive' | 'all'
  type?: 'standard' | 'bundle'
}

// Hooks
export function useProducts(params: ProductsListParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () =>
      api.get<ApiPaginationResponse<ApiProduct>>('/api/products', {
        page: params.page,
        limit: params.limit,
        search: params.search,
        categoryId: params.categoryId,
        status: params.status,
        type: params.type,
      }),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => api.get<ApiProduct>(`/api/products/${id}`),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProductCreateRequest) =>
      api.post<ApiProduct>('/api/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductCreateRequest> }) =>
      api.put<ApiProduct>(`/api/products/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useDeleteProducts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.delete(`/api/products/${id}`)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useBreakDownStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { quantity: number; targetVariantId: string } }) =>
      api.post<{ message: string }>(`/api/products/${id}/break-down`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
    },
  })
}
