import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { ApiShift } from '@/lib/api-types' // I need to define ApiShift type or use any for now
// Actually I'll use inline types or define them here for speed if api-types is large.

export interface Shift {
    id: string
    userId: string
    startCash: string
    status: 'open' | 'closed'
    startTime: string
    endTime?: string
    notes?: string
}

export interface OpenShiftRequest {
    userId: string
    startCash: number
    notes?: string
}

export interface CloseShiftRequest {
    endCash: number
    notes?: string
}

export const useActiveShift = (userId: string) => {
    return useQuery({
        queryKey: ['active-shift', userId],
        queryFn: async () => {
            try {
                const response = await api.get<Shift | null>(`/api/shifts/active/${userId}`)
                return response
            } catch (e) {
                return null
            }
        },
        enabled: !!userId,
        retry: false
    })
}

export const useOpenShift = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: OpenShiftRequest) => {
            const response = await api.post('/api/shifts/open', data)
            return response
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['active-shift', variables.userId] })
        }
    })
}

export const useCloseShift = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: CloseShiftRequest }) => {
            const response = await api.post(`/api/shifts/${id}/close`, data)
            return response
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-shift'] })
        }
    })
}
