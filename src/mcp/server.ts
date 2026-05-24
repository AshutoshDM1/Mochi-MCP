import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOLS, handleToolCall } from './tools.js';
import { Server } from '@modelcontextprotocol/sdk/server';

/**
 * Boots the MCP Server over StdioServerTransport.
 */
export async function runMcpServer(): Promise<void> {
  const server = new Server(
    {
      name: 'mochi-mcp-server',
      version: '1.5.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register the list of available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  // Register the callback handler for tool execution requests
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await handleToolCall(name, args);
  });

  // Connect using standard Input/Output streams
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[Mochi MCP] Server successfully connected and running on stdio');
}
