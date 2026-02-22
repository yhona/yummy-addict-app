import { Hono } from "hono";
import { createMcpServer, handleToolCall } from "../mcp-server";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export const mcpRoutes = new Hono();

const mcpServer = createMcpServer();
let transport: SSEServerTransport | null = null;

mcpRoutes.get("/sse", async (c) => {
  console.log("MCP: New SSE connection");
  
  transport = new SSEServerTransport("/api/mcp/messages", c.res as any);
  
  await mcpServer.connect(transport);
  
  // Keep connection open
  return c.res;
});

mcpRoutes.post("/messages", async (c) => {
  console.log("MCP: New message received");
  
  if (!transport) {
    return c.json({ error: "No active SSE transport" }, 400);
  }

  const body = await c.req.json();
  await transport.handlePostMessage(c.req.raw as any, c.res as any, body);
  
  return c.json({ status: "accepted" });
});

mcpRoutes.post("/call-tool", async (c) => {
  const { name, arguments: toolArgs } = await c.req.json();
  
  try {
    const result = await handleToolCall(name, toolArgs);
    return c.json(result);
  } catch (error) {
    console.error(`MCP Error calling ${name}:`, error);
    return c.json({ error: (error as Error).message }, 500);
  }
});
