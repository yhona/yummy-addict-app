import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { db } from "./db";
import { products, transactions, orders, orderItems, productStock, stockMovements, warehouses } from "./db/schema";
import { eq, ilike, or, desc, and, gte } from "drizzle-orm";

export function createMcpServer() {
  const server = new Server(
    {
      name: "retail-erp-mcp",
      version: "1.2.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  // List Resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "retail://products/all",
          name: "All Products",
          mimeType: "application/json",
          description: "List of all active products",
        },
        {
          uri: "retail://inventory/low-stock",
          name: "Low Stock Products",
          mimeType: "application/json",
          description: "Products that are below minimum stock level",
        },
      ],
    };
  });

  // Read Resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    if (uri === "retail://products/all") {
      const allProducts = await db.query.products.findMany({
        limit: 50,
        with: { stock: true }
      });
      
      const data = allProducts.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        stock: p.stock.reduce((sum, s) => sum + s.quantity, 0),
        price: p.sellingPrice
      }));

      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (uri === "retail://inventory/low-stock") {
      const lowStockProducts = await db.query.products.findMany({
        where: eq(products.isActive, true),
        with: { stock: true }
      });

      const filtered = lowStockProducts
        .map(p => ({
          sku: p.sku,
          name: p.name,
          currentStock: p.stock.reduce((sum, s) => sum + s.quantity, 0),
          minStock: p.minStock
        }))
        .filter(p => p.currentStock < p.minStock);

      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(filtered, null, 2) }],
      };
    }

    throw new Error("Resource not found");
  });

  // List Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_products",
          description: "Search products by name or SKU",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search keyword" },
            },
            required: ["query"],
          },
        },
        {
          name: "get_product_stock",
          description: "Get detailed stock information for a product SKU",
          inputSchema: {
            type: "object",
            properties: {
              sku: { type: "string" }
            },
            required: ["sku"]
          }
        },
        {
          name: "get_recent_orders",
          description: "Get the most recent customer orders",
          inputSchema: {
            type: "object",
            properties: {
              limit: { type: "number", default: 10 }
            }
          }
        },
        {
          name: "get_sales_performance",
          description: "Get sales performance metrics for a specific period",
          inputSchema: {
            type: "object",
            properties: {
              days: { type: "number", description: "Number of days to look back", default: 7 }
            }
          }
        },
        {
          name: "search_transactions",
          description: "Search transaction history",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Transaction number or customer name" }
            },
            required: ["query"]
          }
        },
        {
          name: "create_draft_order",
          description: "Create a new draft order for a customer",
          inputSchema: {
            type: "object",
            properties: {
              customerName: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sku: { type: "string" },
                    quantity: { type: "number" }
                  },
                  required: ["sku", "quantity"]
                }
              },
              notes: { type: "string" }
            },
            required: ["customerName", "items"]
          }
        },
        {
          name: "update_stock_adjustment",
          description: "Adjust stock level for a product",
          inputSchema: {
            type: "object",
            properties: {
              sku: { type: "string" },
              quantityChange: { type: "number", description: "Positive to add, negative to reduce" },
              reason: { type: "string" }
            },
            required: ["sku", "quantityChange", "reason"]
          }
        }
      ],
    };
  });

  // Call Tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return handleToolCall(name, args);
  });

  return server;
}

export async function handleToolCall(name: string, args: any) {
  switch (name) {
    case "search_products": {
      const query = String(args?.query || "");
      const results = await db.query.products.findMany({
        where: or(
          ilike(products.name, `%${query}%`),
          ilike(products.sku, `%${query}%`)
        ),
        limit: 5,
      });
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    }

    case "get_product_stock": {
      const sku = String(args?.sku || "");
      const product = await db.query.products.findFirst({
        where: eq(products.sku, sku),
        with: { stock: { with: { warehouse: true } } }
      });
      
      if (!product) return { content: [{ type: "text", text: "Product not found" }] };

      const stockData = product.stock.map(s => ({
        warehouse: s.warehouse.name,
        quantity: s.quantity
      }));
      
      return {
        content: [{ type: "text", text: JSON.stringify({
          product: product.name,
          sku: product.sku,
          total_stock: stockData.reduce((a,b) => a + b.quantity, 0),
          breakdown: stockData
        }, null, 2) }]
      };
    }

    case "get_recent_orders": {
      const limit = Number(args?.limit || 10);
      const recentOrders = await db.query.orders.findMany({
        orderBy: [desc(orders.date)],
        limit,
        with: { customer: true }
      });
      return { content: [{ type: "text", text: JSON.stringify(recentOrders, null, 2) }] };
    }

    case "get_sales_performance": {
      const days = Number(args?.days || 7);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const recentTransactions = await db.query.transactions.findMany({
        where: and(
          eq(transactions.status, 'completed'),
          gte(transactions.date, startDate)
        )
      });

      const totalSales = recentTransactions.reduce((sum, t) => sum + Number(t.finalAmount), 0);
      const count = recentTransactions.length;

      return {
        content: [{ type: "text", text: JSON.stringify({
          period_days: days,
          total_revenue: totalSales,
          transaction_count: count,
          average_transaction_value: count > 0 ? totalSales / count : 0
        }, null, 2) }]
      };
    }

    case "search_transactions": {
      const query = String(args?.query || "");
      const results = await db.query.transactions.findMany({
        where: ilike(transactions.number, `%${query}%`),
        limit: 5,
        with: { customer: true }
      });
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    }

    case "create_draft_order": {
      const { customerName, items, notes } = args;
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("Items array is required");
      }

      const orderNumber = `ORD-${Date.now()}`;
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = await db.query.products.findFirst({
          where: eq(products.sku, item.sku)
        });

        if (!product) throw new Error(`Product SKU ${item.sku} not found`);

        const quantity = Number(item.quantity) || 1;
        const price = Number(product.sellingPrice);
        const subtotal = price * quantity;
        
        totalAmount += subtotal;
        orderItemsData.push({
          productId: product.id,
          quantity,
          price: String(price),
          subtotal: String(subtotal)
        });
      }

      const [newOrder] = await db.insert(orders).values({
        number: orderNumber,
        customerName: String(customerName),
        totalAmount: String(totalAmount),
        status: 'pending',
        notes: String(notes || '')
      }).returning();

      if (!newOrder) {
        throw new Error("Failed to create new order");
      }

      await db.insert(orderItems).values(
        orderItemsData.map(item => ({
          ...item,
          orderId: newOrder.id
        }))
      );

      return { content: [{ type: "text", text: `Order created successfully: ${orderNumber} for ${customerName}. Total: ${totalAmount}` }] };
    }

    case "update_stock_adjustment": {
      const { sku, quantityChange, reason } = args;
      const qtyChange = Number(quantityChange);
      
      const product = await db.query.products.findFirst({
        where: eq(products.sku, sku),
        with: { stock: true }
      });

      if (!product) throw new Error(`Product SKU ${sku} not found`);

      // Use default warehouse or first available
      const warehouseId = product.stock[0]?.warehouseId;
      if (!warehouseId) throw new Error("No warehouse found for this product");

      const currentStock = await db.query.productStock.findFirst({
         where: and(
           eq(productStock.productId, product.id),
           eq(productStock.warehouseId, warehouseId)
         )
      });
      
      const currentQty = currentStock ? currentStock.quantity : 0;
      const newQty = currentQty + qtyChange;

      // Update product stock
      if (currentStock) {
        await db.update(productStock)
          .set({ quantity: newQty, updatedAt: new Date() })
          .where(eq(productStock.id, currentStock.id));
      } else {
         await db.insert(productStock).values({
           productId: product.id,
           warehouseId: warehouseId,
           quantity: newQty
         });
      }

      // Record movement
      await db.insert(stockMovements).values({
        productId: product.id,
        warehouseId: warehouseId,
        movementType: 'adjustment',
        referenceType: 'adjustment',
        quantityBefore: currentQty,
        quantityChange: qtyChange,
        quantityAfter: newQty,
        notes: String(reason || 'Manual adjustment via AI'),
      });

      return { content: [{ type: "text", text: `Stock adjusted for ${product.name} (${sku}). New quantity: ${newQty}` }] };
    }

    default:
      throw new Error(`Tool ${name} not found`);
  }
}

// Stdio startup for backward compatibility / direct use
const currentFile = process.argv[1];
if (currentFile && currentFile.endsWith('mcp-server.ts')) {
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
