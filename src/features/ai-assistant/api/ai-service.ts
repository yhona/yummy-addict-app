import { api } from '@/lib/api-client'

export interface McpToolResponse {
  content: Array<{
    type: string
    text: string
  }>
}

export const aiService = {
  callTool: async (name: string, args: any): Promise<McpToolResponse> => {
    return api.post('/api/mcp/call-tool', { name, arguments: args })
  },

  // Helper to search products via MCP
  searchProducts: async (query: string) => {
    return aiService.callTool('search_products', { query })
  },

  // Helper to get stock via MCP
  getProductStock: async (sku: string) => {
    return aiService.callTool('get_product_stock', { sku })
  },

  // Helper to get recent orders via MCP
  getRecentOrders: async (limit: number = 5) => {
    return aiService.callTool('get_recent_orders', { limit })
  },

  // Helper to get sales performance
  getSalesPerformance: async (days: number = 7) => {
    return aiService.callTool('get_sales_performance', { days })
  },
}
