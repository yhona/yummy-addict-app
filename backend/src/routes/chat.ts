import { Hono } from 'hono'
import { google } from '@ai-sdk/google'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import { createMcpServer } from '../mcp-server'

export const chatRoutes = new Hono()

// Define tools for the AI model
const tools = {
  search_products: tool({
    description: 'Search products by name or SKU',
    parameters: z.object({
      query: z.string().describe('Search keyword'),
    }),
    // @ts-ignore
    // @ts-expect-error
    execute: async (args: any) => {
      const { query } = args;
      const { handleToolCall } = await import('../mcp-server');
      const toolResult = await handleToolCall('search_products', { query });
      return toolResult?.content?.[0]?.text || "No results found.";
    },
  }),
  get_product_stock: tool({
    description: 'Get detailed stock information for a product SKU',
    parameters: z.object({
      sku: z.string().describe('Product SKU'),
    }),
    // @ts-expect-error
    execute: async (args: any) => {
      const { sku } = args;
      const { handleToolCall } = await import('../mcp-server');
      const toolResult = await handleToolCall('get_product_stock', { sku });
      return toolResult?.content?.[0]?.text || "Stock information not found.";
    },
  }),
  get_recent_orders: tool({
    description: 'Get the most recent customer orders',
    parameters: z.object({
      limit: z.number().optional().default(5).describe('Number of orders to return'),
    }),
    // @ts-expect-error
    execute: async (args: any) => {
      const { limit } = args;
      const { handleToolCall } = await import('../mcp-server');
      const toolResult = await handleToolCall('get_recent_orders', { limit });
      return toolResult?.content?.[0]?.text || "No recent orders found.";
    },
  }),
  get_sales_performance: tool({
    description: 'Get sales performance metrics',
    parameters: z.object({
      days: z.number().optional().default(7).describe('Number of days to look back'),
    }),
    // @ts-expect-error
    execute: async (args: any) => {
      const { days } = args;
      const { handleToolCall } = await import('../mcp-server');
      const toolResult = await handleToolCall('get_sales_performance', { days });
      return toolResult?.content?.[0]?.text || "Performance data unavailable.";
    },
  }),
  create_draft_order: tool({
    description: 'Create a new draft order for a customer',
    parameters: z.object({
      customerName: z.string().describe('Name of the customer'),
      items: z.array(z.object({
        sku: z.string().describe('Product SKU'),
        quantity: z.number().describe('Quantity to order'),
      })).describe('List of items to order'),
      notes: z.string().optional().describe('Optional notes for the order'),
    }),
    // @ts-expect-error
    execute: async (args: any) => {
      const { customerName, items, notes } = args;
      const { handleToolCall } = await import('../mcp-server');
      const toolResult = await handleToolCall('create_draft_order', { customerName, items, notes });
      return toolResult?.content?.[0]?.text || "Failed to create draft order.";
    },
  }),
  update_stock_adjustment: tool({
    description: 'Adjust stock level for a product (e.g. for breakage, loss, or bonus)',
    parameters: z.object({
      sku: z.string().describe('Product SKU'),
      quantityChange: z.number().describe('Positive to add, negative to reduce'),
      reason: z.string().describe('Reason for adjustment'),
    }),
    // @ts-expect-error
    execute: async (args: any) => {
      const { sku, quantityChange, reason } = args;
      const { handleToolCall } = await import('../mcp-server');
      const toolResult = await handleToolCall('update_stock_adjustment', { sku, quantityChange, reason });
      return toolResult?.content?.[0]?.text || "Failed to adjust stock.";
    },
  }),
}

chatRoutes.post('/', async (c) => {
  const { messages } = await c.req.json()

  const result = streamText({
    model: google('gemini-1.5-flash'),
    system: `You are a helpful AI assistant for a retail business (toko sembako/kelontong). 
    You have access to the business data via tools.
    Always answer in Indonesian (Bahasa Indonesia).
    Be concise, helpful, and professional.
    When showing data, formatting it nicely in markdown (tables, lists, bold text).
    If asked about stock, always check the stock first.
    If asked about sales, summarize the performance clearly.
    
    IMPORTANT: If you want to display a chart to the user (especially for sales performance), output the data in a JSON code block with the language 'json-chart'.
    The format should be:
    \`\`\`json-chart
    {
      "title": "Chart Title",
      "type": "bar",
      "data": [
        { "name": "Label1", "value": 100 },
        { "name": "Label2", "value": 200 }
      ]
    }
    \`\`\`
    Only use this for numeric comparisons or time-series data.`,
    messages,
    tools,
  })

  return result.toTextStreamResponse({
     headers: {
        'Content-Type': 'text/plain; charset=utf-8', 
     }
  })
})
