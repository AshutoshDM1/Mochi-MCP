#!/usr/bin/env node

import { runLoginFlow } from './cli/login.js';
import { runMcpServer } from './mcp/server.js';

const args = process.argv.slice(2);

async function main() {
  if (args.includes('login')) {
    await runLoginFlow();
  } else {
    await runMcpServer();
  }
}

main().catch((error) => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});