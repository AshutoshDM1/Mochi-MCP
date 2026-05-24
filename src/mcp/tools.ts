import axios from 'axios';
import { getApiKey, getApiUrl } from '../config.js';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// Declared list of available tools
export const TOOLS: McpTool[] = [
  {
    name: 'list_monitors',
    description: 'Retrieve a complete list of all website uptime monitors configured by the authenticated user, including their schedules, current status, checks count, and latency metrics.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Dispatches tool execution calls based on requested tool name.
 */
export async function handleToolCall(
  name: string,
  _arguments: any
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  if (name === 'list_monitors') {
    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Mochi API Key is not configured. Please run "npx mochi-mcp-kit login" in your terminal to save your key, or add it to your environment variables as MOCHI_API_KEY.',
          },
        ],
        isError: true,
      };
    }

    const backendUrl = getApiUrl();

    try {
      console.error(`[Mochi MCP] Fetching monitors from: ${backendUrl}/mcp/monitors`);
      const response = await axios.get(`${backendUrl}/mcp/monitors`, {
        headers: {
          'x-mochi-api-key': apiKey,
        },
        timeout: 10000,
      });

      const monitors = response.data?.data || [];

      if (monitors.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'You have not configured any website monitors yet! Go to mochi.elitedev.space to add your first site to monitor.',
            },
          ],
        };
      }

      // Format response beautifully as a Markdown table
      let table = `### 🌐 Mochi Active Monitors\n\n`;
      table += `| Monitor ID | Target URL | Cron Schedule | Current Status | Total Checks | Avg Latency | Uptime | Downtime |\n`;
      table += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

      monitors.forEach((m: any) => {
        const uptimeStr = `${(m.totalUpTimeSeconds / 3600).toFixed(2)} hrs`;
        const downtimeStr = `${(m.totalDownTimeSeconds / 3600).toFixed(2)} hrs`;
        const shortId = typeof m.id === 'string' ? `${m.id.substring(0, 8)}...` : 'N/A';
        const averageLatency = m.averageResponseTimeMs !== undefined ? `${Math.round(m.averageResponseTimeMs)}ms` : '0ms';
        table += `| \`${shortId}\` | ${m.url} | \`${m.interval}\` | **${m.status}** | ${m.totalChecks} | ${averageLatency} | ${uptimeStr} | ${downtimeStr} |\n`;
      });

      return {
        content: [
          {
            type: 'text',
            text: table,
          },
        ],
      };
    } catch (error: any) {
      console.error('[Mochi MCP] Error contacting Mochi API:', error.message);
      return {
        content: [
          {
            type: 'text',
            text: `Error: Failed to fetch monitors from Mochi API. ${error.response?.data?.message || error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Tool not found: ${name}`);
}
