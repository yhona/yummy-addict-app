import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type {
  ShipmentsResponse,
  Shipment,
  UpdateShipmentRequest,
  BulkUpdateResiRequest,
  BulkUpdateResiResponse,
} from '../types'

export interface ShipmentsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  courierId?: string
  dateFrom?: string
  dateTo?: string
}

export const shipmentKeys = {
  all: ['shipments'] as const,
  lists: () => [...shipmentKeys.all, 'list'] as const,
  list: (params?: object) => [...shipmentKeys.lists(), params] as const,
  detail: (id: string) => [...shipmentKeys.all, 'detail', id] as const,
  summary: () => [...shipmentKeys.all, 'summary'] as const,
}

function toRecord(params?: ShipmentsParams): Record<string, string | number | boolean | undefined> | undefined {
  if (!params) return undefined
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  ) as Record<string, string | number | boolean | undefined>
}

export const useShipments = (params?: ShipmentsParams) => {
  return useQuery({
    queryKey: shipmentKeys.list(params),
    queryFn: () => api.get<ShipmentsResponse>('/api/shipping', toRecord(params)),
  })
}

export const useShipment = (id: string) => {
  return useQuery({
    queryKey: shipmentKeys.detail(id),
    queryFn: () => api.get<Shipment>(`/api/shipping/${id}`),
    enabled: !!id,
  })
}

export const useUpdateShipment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShipmentRequest }) =>
      api.put<Shipment>(`/api/shipping/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.all })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) })
    },
  })
}

export const useBulkUpdateResi = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkUpdateResiRequest) =>
      api.post<BulkUpdateResiResponse>('/api/shipping/bulk-update', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.all })
    },
  })
}
