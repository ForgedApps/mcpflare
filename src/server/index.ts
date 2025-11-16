#!/usr/bin/env node

import dotenv from 'dotenv'
import logger from '../utils/logger.js'
import { MCPHandler } from './mcp-handler.js'

// Load environment variables
dotenv.config()

async function main() {
  try {
    logger.info('Starting MCP Isolate Runner...')

    const handler = new MCPHandler()
    await handler.start()

    logger.info('MCP Isolate Runner is ready to accept connections')
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to start MCP Isolate Runner')
    process.exit(1)
  }
}

main()
