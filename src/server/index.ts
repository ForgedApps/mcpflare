#!/usr/bin/env node

import { loadEnvFromDotFile } from '../utils/load-env.js'
import logger from '../utils/logger.js'
import { MCPHandler } from './mcp-handler.js'

// Load environment variables from .env when present.
loadEnvFromDotFile()

async function main() {
  try {
    logger.info('Starting MCPflare...')

    const handler = new MCPHandler()
    await handler.start()

    logger.info('MCPflare is ready to accept connections')
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to start MCPflare')
    process.exit(1)
  }
}

main()
