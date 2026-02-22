import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export const useDashboardStats = () => {
    return useQuery({
         queryKey: ['dashboard-stats'],
         queryFn: async () => {
            const res = await api.get<any>('/api/analytics/dashboard')
            return res
         }
    })
}

export const useChartData = () => {
    return useQuery({
        queryKey: ['chart-data'],
        queryFn: async () => {
             const res = await api.get<any[]>('/api/analytics/chart')
             return res
        }
    })
}
