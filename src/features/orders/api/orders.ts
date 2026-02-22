import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface OrderItem {
  id?: string
  productId: string
  quantity: number
  price: number
  subtotal?: number
  notes?: string
  product?: {
    id: string
    name: string
    sku: string
    sellingPrice: string
    image?: string
  }
}

export interface Order {
  id: string
  number: string
  date: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  totalAmount: string
  notes?: string
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  transactionId?: string
  paymentMethod?: 'cash' | 'qris' | 'transfer'
  cashAmount?: string
  // Shipping
  shippingCost?: string
  deliveryMethod?: 'pickup' | 'delivery'
  courierName?: string
  trackingNumber?: string
  // Discount
  discountAmount?: string
  finalAmount?: string
  
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    name: string
    phone?: string
    email?: string
    address?: string
  }
  items: OrderItem[]
  createdByUser?: {
    id: string
    name: string
  }
}

export interface CreateOrderRequest {
  customerId?: string
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  items?: {
    productId: string
    quantity: number
    price: number
    notes?: string
  }[]
  notes?: string
  paymentMethod?: 'cash' | 'qris' | 'transfer' | null
  cashAmount?: number | null
  // Shipping
  shippingCost?: number
  deliveryMethod?: 'pickup' | 'delivery'
  courierName?: string
  trackingNumber?: string
  // Discount
  discountAmount?: number
}

export interface CompleteOrderRequest {
  paymentMethod?: 'cash' | 'qris' | 'transfer'
  cashAmount?: number
  discountAmount?: number
  cashierId?: string
}

export interface OrdersParams {
  page?: number
  limit?: number
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params?: OrdersParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
}

export const useOrders = (params?: OrdersParams) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: async () => {
      const response = await api.get('/api/orders', { params: params as any })
      return response as {
        data: Order[]
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

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/api/orders/${id}`)
      return response as Order
    },
    enabled: !!id,
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateOrderRequest) => {
      const response = await api.post('/api/orders', data)
      return response as Order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export const useUpdateOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateOrderRequest> }) => {
      const response = await api.put(`/api/orders/${id}`, data)
      return response as Order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export const useCompleteOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompleteOrderRequest }) => {
      const response = await api.put(`/api/orders/${id}/complete`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    },
  })
}

export const useCancelOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/orders/${id}`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}
